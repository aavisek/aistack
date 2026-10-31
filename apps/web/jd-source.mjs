import { JdError } from "./jd.mjs";
import { naukriUrl, naukriFingerprint } from "./jd-naukri.mjs";

export function jobSourceUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new JdError("Saved page has an invalid source URL.", 422); }
  if (["naukri.com", "www.naukri.com"].includes(url.hostname)) return naukriUrl(value);
  if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com", "in.linkedin.com"].includes(url.hostname)
    || url.username || url.password || url.port || !/^\/jobs\/view\/(?:[^/]+-)?\d+\/?$/.test(url.pathname)) {
    throw new JdError("Use a saved HTTPS Naukri or LinkedIn job-listing page.", 422);
  }
  const id = url.pathname.match(/(\d+)\/?$/)[1];
  return `https://www.linkedin.com/jobs/view/${id}`;
}

export function jobSourceFingerprint(value) {
  const url = jobSourceUrl(value);
  return url.includes("linkedin.com") ? `linkedin:${new URL(url).pathname.split("/").at(-1)}` : naukriFingerprint(url);
}
