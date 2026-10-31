import { chromium } from "playwright";
import { JdError } from "./jd.mjs";
import { naukriUrl, naukriFingerprint } from "./jd-naukri.mjs";

// This function also runs in Chromium; keep it independent of server-side helpers.
export function renderedNaukriDocument() {
  const title = document.querySelectorAll('h1[class*="jd-header-title"]');
  const descriptions = document.querySelectorAll('[class*="job-desc-container"]');
  const body = document.body?.innerText ?? "";
  const blocked = /access denied|verify (?:that )?you are (?:a )?human|complete the captcha|job (?:has )?expired|job (?:is )?no longer available/i.test(body)
    || Boolean(document.querySelector('iframe[src*="captcha"], [class*="captcha"], [id*="captcha"]'));
  if (blocked) return { error: "Naukri requires verification or the listing is unavailable. Upload screenshots instead." };
  if (title.length > 1 || descriptions.length > 1) return { error: "Naukri returned multiple job descriptions. Upload screenshots instead." };
  if (title.length !== 1 || descriptions.length !== 1) return null;
  const heading = descriptions[0].querySelector("h2");
  const expanded = heading?.parentElement.nextElementSibling;
  const description = descriptions[0].querySelector('[class*="short-desc"]')
    ?? (heading?.textContent.trim().toLowerCase() === "job description"
      && expanded?.tagName === "DIV" && !expanded.className ? expanded : null);
  if (!title[0].innerText.trim() || !description?.innerText.trim()) return null;
  const company = document.querySelector('[class*="jd-header-comp-name"]')?.innerText.trim();
  const skills = descriptions[0].querySelector('[class*="key-skill"]')?.innerText.trim();
  const lines = [`Title: ${title[0].innerText.trim()}`];
  if (company) lines.push(`Company: ${company}`);
  lines.push(description.innerText.trim());
  if (skills) lines.push(skills);
  const text = lines.join("\n\n");
  if (text.length > 100000) return { error: "Naukri job description exceeds 100000 characters. No text was truncated." };
  return { text };
}

export async function renderNaukriJob(value, browserType = chromium) {
  const url = naukriUrl(value);
  let browser;
  let navigationError;
  try {
    try {
      browser = await browserType.launch({ chromiumSandbox: true, timeout: 10000 });
    } catch (error) {
      console.error("Naukri browser startup failed:", error.message);
      throw new JdError("Naukri browser could not start. Run npx playwright install --with-deps chromium and check Chromium sandbox support.", 503);
    }
    const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: false });
    const page = await context.newPage();
    let requests = 0;
    let navigations = 0;
    await context.route("**/*", async (route) => {
      const request = route.request();
      const target = new URL(request.url());
      const mainNavigation = request.isNavigationRequest() && request.frame() === page.mainFrame();
      if (mainNavigation) {
        try {
          if (++navigations > 4) throw new JdError("Naukri returned too many redirects.", 422);
          if (naukriFingerprint(target.href) !== naukriFingerprint(url)) throw new JdError("Naukri redirected to a different job.", 422);
        } catch {
          navigationError = new JdError("Naukri redirected away from this public listing, possibly to login or verification. Upload screenshots instead.", 422);
          await route.abort();
          return;
        }
      }
      const allowedHost = target.hostname === "naukri.com" || target.hostname.endsWith(".naukri.com")
        || target.hostname === "static.naukimg.com";
      if (++requests > 200 || target.protocol !== "https:" || target.port || target.username || target.password
        || !allowedHost || ["image", "font", "media"].includes(request.resourceType())
        || (request.isNavigationRequest() && !mainNavigation)) {
        await route.abort();
        return;
      }
      await route.continue();
    });
    await context.routeWebSocket("**/*", (socket) => socket.close());
    const deadline = Date.now() + 30000;
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response?.ok()) throw new JdError(`Naukri browser returned HTTP ${response?.status() ?? "unknown"}. Upload screenshots instead.`, 422);
    if (!/^text\/html(?:;|$)/i.test(response.headers()["content-type"] ?? "")) throw new JdError("Naukri browser did not return an HTML job listing.", 422);
    const result = await page.waitForFunction(renderedNaukriDocument, undefined, { timeout: Math.max(1, deadline - Date.now()) });
    const document = await result.jsonValue();
    if (navigationError) throw navigationError;
    if (document.error) throw new JdError(document.error, 422);
    if (naukriFingerprint(page.url()) !== naukriFingerprint(url)) throw new JdError("Naukri browser left the requested listing.", 422);
    return document.text;
  } catch (error) {
    if (navigationError) throw navigationError;
    if (error instanceof JdError) throw error;
    if (error.name === "TimeoutError") throw new JdError("Naukri browser timed out waiting for a public job description after 30 seconds. Login, verification or an unavailable listing may prevent access. Upload screenshots instead.", 422);
    console.error("Naukri browser retrieval failed:", error.message);
    throw new JdError("Could not render the public Naukri listing. Check browser dependencies and network access, or upload screenshots instead.", 502);
  } finally {
    await browser?.close();
  }
}
