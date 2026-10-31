import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { parseNaukriList, naukriUrl, naukriFingerprint, extractNaukriJob, fetchNaukriJob, importNaukriJobs } from "./jd-naukri.mjs";
import { AzureJdProcessor } from "./jd-ai.mjs";
import { createJdApi } from "./jd-api.mjs";

const url = "https://www.naukri.com/job-listings-ai-architect-example-10-to-15-years-181026003829";
const secondUrl = url.replace("181026003829", "121026010400");
const posting = { "@context": "https://schema.org", "@type": "JobPosting", title: "AI Architect",
  hiringOrganization: { name: "Example & Co" }, description: "<p>Python is required.</p><ul><li>Build RAG platforms.</li></ul>",
  skills: ["Python", "RAG"], qualifications: "Architecture experience" };
const html = (data = posting) => `<html><script type="application/ld+json">${JSON.stringify(data)}</script><p>Unrelated navigation</p></html>`;
const page = (data = posting) => new Response(html(data), { headers: { "content-type": "text/html; charset=utf-8" } });
const configuration = { azureOpenAiEndpoint: "https://example.openai.azure.com", azureOpenAiApiKey: "test", azureOpenAiDeployment: "test" };
const extraction = { title: "AI Architect", company: "Example & Co", roleFamily: "ai-architect",
  sourceText: "Python is required. Build RAG platforms.", requirements: [
    { name: "Python", category: "Languages", requirement: "required", evidence: "Python is required.", confidence: 0.9 }
  ], confidence: 0.9 };

test("URL lists support numbered separators, normalize tracking and deduplicate by job ID", () => {
  const parsed = parseNaukriList(`\uFEFF1.\r\n\r\n${url}?src=cluster\r\n2)\r\n${url}#tracking\n${url.replace("ai-architect", "new-title")}\n${secondUrl}/`);
  assert.deepEqual(parsed, { urls: [url, secondUrl], skipped: 2 });
  assert.equal(naukriUrl(url.replace("www.", "")), url);
  assert.equal(naukriFingerprint(url), "naukri:181026003829");
});

test("URL validation rejects invalid lists and non-listing or unsafe destinations", () => {
  for (const value of [
    "http://www.naukri.com/job-listings-ai-181026003829",
    url.replace("www.naukri.com", "www.naukri.com.evil.example"),
    url.replace("www.naukri.com", "127.0.0.1"), url.replace("www.", "user:password@www."),
    url.replace(".com/", ".com:8443/"), "https://www.naukri.com/login", "file:///etc/passwd"
  ]) assert.throws(() => naukriUrl(value), /HTTPS job-listing|valid HTTPS/);
  for (const input of ["", "1.\n2.", null, "notes\n" + url]) assert.throws(() => parseNaukriList(input));
  assert.throws(() => parseNaukriList("x".repeat(256 * 1024 + 1)), /256 KB/);
  assert.throws(() => parseNaukriList(Array.from({ length: 101 }, (_, index) => url.replace("181026003829", String(181026003829 + index))).join("\n")), /100 distinct/);
  assert.throws(() => parseNaukriList(`${url}\ninvalid`), /Line 2/);
});

test("extracts only structured JobPosting text including graphs, arrays and HTML entities", () => {
  for (const data of [posting, [posting], { "@graph": [posting] }, { mainEntity: posting }]) {
    const text = extractNaukriJob(html(data));
    assert.match(text, /Title: AI Architect/);
    assert.match(text, /Company: Example & Co/);
    assert.match(text, /Python is required\./);
    assert.match(text, /skills: Python; RAG/);
    assert.doesNotMatch(text, /<p>|Unrelated navigation/);
  }
  assert.match(extractNaukriJob(html({ ...posting, description: "<p>A &amp; B &#x1F680; &nbsp; &#39;Python&#39;</p>" })), /A & B \u{1f680}\s+'Python'/u);
});

test("blocked, incomplete, ambiguous or malformed pages never become successful JDs", () => {
  for (const content of ["<html>Access denied CAPTCHA Login</html>", html({ "@type": "WebSite" }),
    html({ ...posting, description: "" }), html([posting, posting]), '<script type="application/ld+json">{bad}</script>']) {
    assert.throws(() => extractNaukriJob(content), /job|structured/);
  }
});

test("fetch validates redirects and rejects HTTP failures, oversized and non-HTML pages", async () => {
  const calls = [];
  const text = await fetchNaukriJob(url, async (target, options) => {
    calls.push({ target, options });
    return calls.length === 1 ? new Response(null, { status: 302, headers: { location: `${url}/?tracking=1` } }) : page();
  });
  assert.match(text, /Python/);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.redirect, "manual");
  assert.equal(calls[1].target, url);
  for (const destination of ["http://127.0.0.1", "https://evil.example", "/login"]) {
    let fetched = 0;
    await assert.rejects(fetchNaukriJob(url, async () => {
      fetched += 1;
      return new Response(null, { status: 302, headers: { location: destination } });
    }));
    assert.equal(fetched, 1);
  }
  await assert.rejects(fetchNaukriJob(url, async () => new Response("denied", { status: 403 })), /HTTP 403/);
  await assert.rejects(fetchNaukriJob(url, async () => new Response("{}", { headers: { "content-type": "application/json" } })), /HTML/);
  await assert.rejects(fetchNaukriJob(url, async () => new Response("x".repeat(2 * 1024 * 1024 + 1), { headers: { "content-type": "text/html" } })), /2 MB/);
  await assert.rejects(fetchNaukriJob(url, async () => { throw new Error("network detail"); }), /Could not retrieve/);
});

test("Naukri text reuses AI evidence validation and retains original text", async () => {
  const processor = new AzureJdProcessor(null, {});
  const calls = [];
  processor.request = async (messages) => { calls.push(messages); return extraction; };
  const result = await processor.analyzeText(url, "Python is required.\nBuild RAG platforms.", null, "Naukri");
  assert.match(result.sourceText, /Original Naukri source document/);
  assert.match(calls[0][1].content, /Naukri source document/);
  assert.equal(result.requirements[0].evidence, "Python is required.");
  await assert.rejects(processor.analyzeText(url, "x".repeat(100001)), /no text was truncated/);
  await assert.rejects(processor.analyzeText(url, " "), /empty/);
});

test("missing structured data uses browser fallback once with the validated canonical URL", async () => {
  const calls = [];
  const text = await fetchNaukriJob(`${url}?src=cluster`, async () => new Response("<html><script>render()</script></html>", {
    headers: { "content-type": "text/html" }
  }), async (target) => { calls.push(target); return "Title: AI Architect\n\nPython is required."; });
  assert.deepEqual(calls, [url]);
  assert.match(text, /Python is required/);
});

test("browser failures remain explicit and invalid or ambiguous pages do not trigger fallback", async () => {
  const render = async () => { throw new Error("Unexpected browser fallback"); };
  assert.match(await fetchNaukriJob(url, async () => page(), render), /Python/);
  for (const data of [[posting, posting], { ...posting, description: "" }]) {
    await assert.rejects(fetchNaukriJob(url, async () => page(data), render), /multiple job|incomplete job/);
  }
  await assert.rejects(fetchNaukriJob(url, async () => new Response("denied", { status: 403 }), render), /HTTP 403/);
  const { JdError } = await import("./jd.mjs");
  await assert.rejects(fetchNaukriJob(url, async () => page({ "@type": "WebSite" }),
    async () => { throw new JdError("Browser dependency missing", 503); }), /Browser dependency missing/);
});

test("batch continues past blocked URLs and saves only evidence-validated jobs", async (t) => {
  t.mock.method(globalThis, "fetch", async (target) => target === secondUrl ? new Response("denied", { status: 403 }) : page());
  const processor = new AzureJdProcessor(null, {});
  processor.request = async () => extraction;
  const saved = [];
  const progress = { state: "running", total: 2, processed: 0, jobs: 0, failed: 0, errors: [] };
  await importNaukriJobs(processor, { hasImportedJob: async () => false, saveAiJob: async (job) => saved.push(job) }, [secondUrl, url], progress);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].sourceUrl, url);
  assert.deepEqual(saved[0].screenshotIds, []);
  assert.match(saved[0].body, /Original Naukri/);
  assert.equal(progress.state, "completed-with-errors");
  assert.equal(progress.processed, 2);
  assert.equal(progress.failed, 1);
  assert.equal(progress.errors[0].sourcePath, secondUrl);
});

test("API starts URL analysis, exposes progress and locks other imports until completion", async (t) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  t.mock.method(globalThis, "fetch", async (target) => {
    if (String(target).startsWith("https://www.naukri.com")) { await gate; return page(); }
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(extraction) } }] }), { headers: { "content-type": "application/json" } });
  });
  const saved = [];
  const store = { pool: { query: async () => ({}) }, hasImportedJob: async () => false, saveAiJob: async (job) => saved.push(job) };
  const api = createJdApi(store, configuration);
  const request = async (path, method = "POST", data = { text: url }, headers = {}) => {
    const req = Readable.from([Buffer.from(JSON.stringify(data))]);
    req.method = method;
    req.headers = { "content-type": "application/json", ...headers };
    const res = { writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
    await api(req, res, new URL(`http://localhost/api/jd${path}`));
    return res;
  };
  try {
    assert.equal((await request("/naukri-import", "POST", { text: "invalid" })).status, 400);
    assert.equal((await request("/naukri-import", "POST", { text: url }, { origin: "https://evil.example" })).status, 403);
    const started = await request("/naukri-import", "POST", { text: `${url}\n${url}?tracking=1` });
    assert.equal(started.status, 202);
    assert.equal(started.body.data.skipped, 1);
    for (const path of ["/naukri-import", "/ai-import", "/import", "/upload"]) assert.equal((await request(path)).status, 409);
    release();
    await api.waitForAiImport();
    const status = (await request("/status", "GET")).body.data;
    assert.equal(status.aiProgress.state, "completed");
    assert.equal(status.aiProgress.jobs, 1);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].sourceUrl, url);
    assert.match(saved[0].body, /Python/);
  } finally { release(); await api.waitForAiImport(); }
});

test("URL API reports missing AI configuration before fetching", async () => {
  const api = createJdApi({}, {});
  const req = Readable.from([Buffer.from(JSON.stringify({ text: url }))]);
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  const res = { writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
  await api(req, res, new URL("http://localhost/api/jd/naukri-import"));
  assert.equal(res.status, 503);
  assert.match(res.body.error.message, /AZURE_OPENAI/);
});
