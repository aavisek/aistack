import { JdError } from "./jd.mjs";

export function naukriUrl(value) {
  let url;
  try { url = new URL(value); }
  catch { throw new JdError("Provide a valid HTTPS Naukri job-listing URL."); }
  if (url.protocol !== "https:" || !["naukri.com", "www.naukri.com"].includes(url.hostname)
    || url.port || url.username || url.password || !/^\/job-listings-[a-z0-9-]+-(\d{12,16})\/?$/i.test(url.pathname)) {
    throw new JdError("Use HTTPS job-listing URLs on naukri.com or www.naukri.com, without credentials or custom ports.");
  }
  return `https://www.naukri.com${url.pathname.replace(/\/$/, "")}`;
}

export function naukriFingerprint(value) {
  return `naukri:${new URL(naukriUrl(value)).pathname.match(/-(\d{12,16})$/)[1]}`;
}

export function parseNaukriList(text) {
  if (typeof text !== "string" || !text.trim()) throw new JdError("The text file is empty. Include one Naukri job URL per line.");
  if (Buffer.byteLength(text, "utf8") > 256 * 1024) throw new JdError("The URL text file must be at most 256 KB.", 413);
  const urls = [];
  const seen = new Set();
  let skipped = 0;
  for (const [index, line] of text.replace(/^\uFEFF/, "").split(/\r?\n/).entries()) {
    if (!line.trim() || /^\s*\d+[.)]\s*$/.test(line)) continue;
    let url;
    try { url = naukriUrl(line.trim()); }
    catch (error) {
      if (!(error instanceof JdError)) throw error;
      throw new JdError(`Line ${index + 1}: ${error.message}`);
    }
    const fingerprint = naukriFingerprint(url);
    if (seen.has(fingerprint)) { skipped += 1; continue; }
    seen.add(fingerprint);
    urls.push(url);
    if (urls.length > 100) throw new JdError("Upload at most 100 distinct job URLs at a time.");
  }
  if (!urls.length) throw new JdError("The text file contains no Naukri job URLs.");
  return { urls, skipped };
}

function plainText(value) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "-", mdash: "-", bull: "-", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"' };
  return String(value ?? "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(?:p|div|li|ul|ol|br|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
      if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? match;
      const code = entity[1].toLowerCase() === "x" ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : match;
    })
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();
}

export function extractNaukriJob(html) {
  const postings = [];
  const visit = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 20) return;
    if (Array.isArray(value)) { value.forEach((item) => visit(item, depth + 1)); return; }
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.some((type) => typeof type === "string" && /^(?:https?:\/\/schema\.org\/)?JobPosting$/.test(type))) postings.push(value);
    if (value["@graph"]) visit(value["@graph"], depth + 1);
    if (value.mainEntity) visit(value.mainEntity, depth + 1);
  };
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1])) continue;
    let structured;
    try { structured = JSON.parse(match[2]); }
    catch { throw new JdError("Naukri returned invalid structured job data. Upload screenshots or paste the JD text instead.", 422); }
    visit(structured);
  }
  if (postings.length !== 1) {
    throw new JdError("No single readable job description was found. Naukri may require login, JavaScript or a CAPTCHA, or the job may have expired. Upload screenshots or paste the JD text instead.", 422);
  }
  const posting = postings[0];
  if (typeof posting.title !== "string" || typeof posting.description !== "string" || !plainText(posting.description)) {
    throw new JdError("Naukri returned incomplete job details. Upload screenshots or paste the JD text instead.", 422);
  }
  const lines = [`Title: ${plainText(posting.title)}`];
  if (typeof posting.hiringOrganization?.name === "string") lines.push(`Company: ${plainText(posting.hiringOrganization.name)}`);
  lines.push(plainText(posting.description));
  for (const field of ["skills", "qualifications", "responsibilities", "experienceRequirements", "educationRequirements", "employmentType"]) {
    const value = posting[field];
    if (typeof value === "string") lines.push(`${field}: ${plainText(value)}`);
    else if (Array.isArray(value) && value.every((item) => typeof item === "string")) lines.push(`${field}: ${value.map(plainText).join("; ")}`);
  }
  return lines.join("\n\n");
}

export async function fetchNaukriJob(value, fetchPage = fetch) {
  let url = naukriUrl(value);
  const signal = AbortSignal.timeout(20000);
  try {
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      const response = await fetchPage(url, {
        redirect: "manual", signal,
        headers: { accept: "text/html", "user-agent": "JD-Intelligence/1.0" }
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location || redirects === 3) throw new JdError("Naukri returned too many or invalid redirects.", 422);
        const redirected = naukriUrl(new URL(location, url).href);
        if (naukriFingerprint(redirected) !== naukriFingerprint(value)) throw new JdError("Naukri redirected to a different job. Use that listing's URL directly.", 422);
        url = redirected;
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new JdError(`Naukri returned HTTP ${response.status}. The listing may be blocked, unavailable or expired. Upload screenshots or paste the JD text instead.`, 422);
      }
      if (!/^text\/html(?:;|$)/i.test(response.headers.get("content-type") ?? "")) {
        await response.body?.cancel();
        throw new JdError("Naukri did not return an HTML job listing.", 422);
      }
      let length = 0;
      const chunks = [];
      for await (const chunk of response.body) {
        length += chunk.length;
        if (length > 2 * 1024 * 1024) throw new JdError("Naukri page exceeds the 2 MB download limit.", 413);
        chunks.push(chunk);
      }
      return extractNaukriJob(Buffer.concat(chunks).toString("utf8"));
    }
  } catch (error) {
    if (error instanceof JdError) throw error;
    throw new JdError(signal.aborted ? "Naukri request timed out after 20 seconds." : "Could not retrieve the Naukri listing. Check network access or upload screenshots instead.", 502);
  }
}

export async function importNaukriJobs(processor, store, urls, progress) {
  for (const url of urls) {
    try {
      const text = await fetchNaukriJob(url);
      const analyzed = await processor.analyzeText(url, text, null, "Naukri");
      if (analyzed.sourceText.length > 100000) throw new JdError("The analyzed JD and original source exceed 100000 characters. No partial job was saved.", 422);
      await store.saveAiJob({
        sourceUrl: url, sourceFolder: null, screenshotIds: [],
        title: analyzed.title, company: analyzed.company, roleFamily: analyzed.roleFamily,
        body: analyzed.sourceText, technologies: analyzed.requirements, confidence: analyzed.confidence
      });
      progress.jobs += 1;
    } catch (error) {
      progress.failed += 1;
      progress.errors.push({ sourcePath: url, message: error.message });
    } finally {
      progress.processed += 1;
    }
  }
  progress.state = progress.failed ? (progress.jobs ? "completed-with-errors" : "failed") : "completed";
}
