import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { validateHtmlBatch, importHtmlJobs } from "./jd-html.mjs";
import { createJdApi } from "./jd-api.mjs";
import { documentHash, importNaukriJobs } from "./jd-naukri.mjs";

const url = "https://www.naukri.com/job-listings-ai-architect-example-181026003829";
const html = (source = url, text = "Python is required.") => `<!doctype html><link rel="canonical" href="${source}">
  <h1 class="styles_jd-header-title__abc">AI Architect</h1>
  <div class="styles_jd-header-comp-name__abc">Example</div>
  <div class="styles_job-desc-container__abc"><div><h2>Job description</h2></div>
  <div>${text}</div><div class="styles_key-skill__abc">Python</div></div>
  <script>document.querySelector('h1').remove()</script><img src="https://example.invalid/tracker">`;
const file = (name = "job.html", source = url, text) => ({ name, html: html(source, text) });
const progress = (total) => ({ state: "running", sourceType: "html", total, processed: 0, jobs: 0, skipped: 0, duplicates: [], failed: 0, errors: [] });

test("saved HTML batch validation enforces types, extensions and exact byte limits", () => {
  assert.equal(validateHtmlBatch([file()]).length, 1);
  for (const files of [null, [], Array(101).fill(file()), [{ name: "../a.html", html: "a" }], [{ name: "a.txt", html: "a" }], [{ name: "a.html", html: "" }]]) {
    assert.throws(() => validateHtmlBatch(files));
  }
  const maximum = { name: "large.html", html: "x".repeat(2 * 1024 * 1024) };
  assert.equal(validateHtmlBatch(Array(5).fill(maximum)).length, 5);
  assert.throws(() => validateHtmlBatch([...Array(5).fill(maximum), { name: "extra.html", html: "a" }]), /10 MB/);
  assert.throws(() => validateHtmlBatch([{ ...maximum, html: maximum.html + "a" }]), /2 MB/);
  assert.equal(documentHash("Python\n is required."), documentHash(" Python is  required. "));
});

test("known URL duplicates are skipped before download or AI", async () => {
  const state = progress(1);
  await importNaukriJobs({ analyzeText: () => { throw new Error("Must not call AI"); } },
    { hasImportedJob: async () => true }, [url], state);
  assert.equal(state.jobs, 0);
  assert.equal(state.skipped, 1);
  assert.equal(state.processed, 1);
  assert.equal(state.duplicates.length, 1);
  assert.equal(state.state, "completed");
});

test("HTML API validates input, requires AI configuration and rejects cross-origin writes", async () => {
  const store = { pool: { query: async () => ({}) } };
  const api = createJdApi(store, {});
  const request = async (data, headers = {}) => {
    const req = Readable.from([Buffer.from(JSON.stringify(data))]);
    req.method = "POST";
    req.headers = { "content-type": "application/json", ...headers };
    const res = { writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
    await api(req, res, new URL("http://localhost/api/jd/html-import"));
    return res;
  };
  assert.equal((await request({ files: [] })).status, 400);
  assert.equal((await request({ files: [file()] })).status, 503);
  assert.equal((await request({ files: [file()] }, { origin: "https://other.example" })).status, 403);
});

test("offline saved HTML batch extracts without scripts, continues after failures and rejects duplicates", {
  skip: process.env.JD_HTML_BROWSER_TEST !== "1"
}, async () => {
  const saved = [];
  let analyzed = 0;
  const store = {
    hasImportedJob: async (sourceUrl, hash) => saved.some((job) => job.sourceUrl === sourceUrl || job.sourceContentHash === hash),
    saveAiJob: async (input) => saved.push(input)
  };
  const processor = { analyzeText: async (_, text) => {
    analyzed += 1;
    return { title: "AI Architect", company: "Example", roleFamily: "ai-architect", sourceText: text,
      requirements: [{ name: "Python", category: "Languages", requirement: "required", evidence: "Python is required.", confidence: 1 }], confidence: 1 };
  } };
  const files = [file(), file("renamed.htm"), { name: "bad.html", html: "<h1>Login</h1>" },
    file("same-text.html", url.replace("181026003829", "121026010400")),
    file("new.html", url.replace("181026003829", "040926000328"), "Python is required. Build new systems.")];
  const state = progress(files.length);
  await importHtmlJobs(processor, store, files, state);
  assert.equal(state.processed, 5);
  assert.equal(state.jobs, 2);
  assert.equal(state.skipped, 2);
  assert.equal(state.failed, 1);
  assert.equal(state.state, "completed-with-errors");
  assert.equal(analyzed, 2);
  assert.equal(saved[0].rejectDuplicate, true);
  assert.match(saved[0].body, /Python is required/);
  assert.doesNotMatch(saved[0].body, /tracker|remove\(\)/);
  const again = progress(1);
  await importHtmlJobs(processor, store, [file()], again);
  assert.equal(again.skipped, 1);
  assert.equal(again.jobs, 0);
  assert.equal(analyzed, 2);
});
