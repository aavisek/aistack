import { chromium } from "playwright";
import { JdError } from "./jd.mjs";
import { saveImportedDocument, recordImportFailure } from "./jd-naukri.mjs";
import { renderedNaukriDocument } from "./jd-naukri-browser.mjs";
import { jobSourceUrl, jobSourceFingerprint } from "./jd-source.mjs";
import { extractNaukriJob, documentHash } from "./jd-naukri.mjs";

export function validateHtmlBatch(files) {
  if (!Array.isArray(files) || !files.length || files.length > 100) throw new JdError("Select 1 to 100 saved job HTML files.");
  let total = 0;
  for (const file of files) {
    if (!file || typeof file.name !== "string" || file.name.length > 500 || !/\.html?$/i.test(file.name)
      || /[\\/\x00-\x1f]/.test(file.name) || typeof file.html !== "string" || !file.html.trim()) {
      throw new JdError("Each file must have a valid .html or .htm filename and nonempty HTML content.");
    }
    const bytes = Buffer.byteLength(file.html);
    if (bytes > 2 * 1024 * 1024) throw new JdError("Each saved HTML file must be at most 2 MB.", 413);
    total += bytes;
    if (total > 10 * 1024 * 1024) throw new JdError("Saved HTML files must total at most 10 MB per batch.", 413);
  }
  return files;
}

export async function extractSavedNaukriJob(page, html) {
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
  const candidates = await page.evaluate(() => [...document.querySelectorAll('link[rel="canonical"]')].map((link) => link.getAttribute("href")));
  const savedUrl = html.match(/<!--\s*saved from url=\(\d+\)(https:\/\/[^\s<>]+)\s*-->/i)?.[1];
  if (savedUrl) candidates.push(savedUrl);
  if (!candidates.length) throw new JdError("Saved page has no source URL. Save the original listing as Webpage, Complete.", 422);
  const urls = candidates.map(jobSourceUrl);
  if (new Set(urls.map(jobSourceFingerprint)).size !== 1) throw new JdError("Saved page contains conflicting job IDs. Save the listing again.", 422);
  let result;
  if (urls[0].includes("linkedin.com")) {
    if (/application\/ld\+json/i.test(html) && /JobPosting/.test(html)) {
      result = { text: extractNaukriJob(html) };
    } else {
      result = await page.evaluate(() => {
        const titles = document.querySelectorAll("h1");
        const descriptions = document.querySelectorAll(".show-more-less-html__markup, .jobs-description__content, .jobs-box__html-content");
        const outer = [...descriptions].filter((node) => ![...descriptions].some((other) => other !== node && other.contains(node)));
        if (titles.length !== 1 || outer.length !== 1) return null;
        const title = titles[0].textContent.trim();
        const description = outer[0].textContent.trim();
        const company = document.querySelector(".topcard__org-name-link, .job-details-jobs-unified-top-card__company-name")?.textContent.trim();
        if (!title || description.length < 100) return null;
        return { text: [`Title: ${title}`, company ? `Company: ${company}` : "", description].filter(Boolean).join("\n\n") };
      });
    }
  } else result = await page.evaluate(renderedNaukriDocument);
  if (result?.error) throw new JdError(result.error, 422);
  if (!result?.text) throw new JdError("No complete job description found in this saved page. Expand Read more before saving the original listing.", 422);
  if (result.text.length > 100000) throw new JdError("Saved JD exceeds 100000 characters.", 413);
  return { sourceUrl: urls[0], text: result.text };
}

export async function importHtmlJobs(processor, store, files, progress, analysisId = null) {
  let browser;
  try {
    browser = await chromium.launch({ chromiumSandbox: true, timeout: 10000 });
    const context = await browser.newContext({ javaScriptEnabled: false, offline: true, serviceWorkers: "block", acceptDownloads: false });
    await context.route("**/*", (route) => route.abort());
    await context.routeWebSocket("**/*", (socket) => socket.close());
    for (const file of files) {
      let page;
      try {
        page = await context.newPage();
        const document = await extractSavedNaukriJob(page, file.html);
        if (analysisId) {
          const existing = await store.importedJob(document.sourceUrl, documentHash(document.text));
          if (existing) {
            await store.pool.query("INSERT INTO jd_analysis_jobs VALUES ($1,$2) ON CONFLICT DO NOTHING", [analysisId, existing]);
            progress.reused = (progress.reused ?? 0) + 1;
            continue;
          }
        }
        const saved = await saveImportedDocument(processor, store, { ...document, sourcePath: file.name }, progress);
        if (analysisId) await store.pool.query("INSERT INTO jd_analysis_jobs VALUES ($1,$2) ON CONFLICT DO NOTHING", [analysisId, saved.id]);
      } catch (error) {
        recordImportFailure(progress, file.name, error);
      } finally {
        await page?.close();
        progress.processed += 1;
      }
    }
    progress.state = progress.failed ? (progress.jobs ? "completed-with-errors" : "failed") : "completed";
  } catch (error) {
    console.error("Saved HTML import failed:", error.message);
    progress.state = "failed";
    progress.errors.push({ message: "Saved HTML import could not complete. Check Chromium installation, sandbox support and database access." });
  } finally {
    await browser?.close();
  }
}
