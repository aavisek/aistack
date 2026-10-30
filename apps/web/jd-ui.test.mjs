import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

async function browser({ failure = null, uploadFailure = null, responses = {} } = {}) {
  const nodes = new Map();
  const requests = [];
  const timers = [];
  const node = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, { textContent: "", innerHTML: "", disabled: false, dataset: {}, setAttribute() {}, classList: { toggle() {}, add() {} } });
    return nodes.get(selector);
  };
  const container = { innerHTML: "", querySelector: node };
  const context = vm.createContext({
    window: {}, location: { hash: "#jd" }, clearTimeout() {}, setTimeout(callback) { timers.push(callback); },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (failure) return { ok: false, json: async () => ({ error: { message: failure } }) };
      if (url.startsWith("/api/jd/upload?")) return uploadFailure
        ? { ok: false, json: async () => ({ error: { message: uploadFailure } }) }
        : { ok: true, json: async () => ({ data: { skipped: false } }) };
      const override = responses[url.slice("/api/jd".length)];
      if (override) return { ok: true, json: async () => ({ data: typeof override === "function" ? override() : override }) };
      const data = {
        "/import": { state: "running", total: 0, processed: 0, imported: 0, skipped: 0, failed: 0, errors: [] },
        "/status": { progress: { state: "idle", total: 0, processed: 0, imported: 0, skipped: 0, failed: 0, errors: [] }, aiProgress: { state: "idle", total: 0, processed: 0, jobs: 0, failed: 0, errors: [] }, categories: ["Languages"], roles: ["ai-architect"], aiEnabled: true },
        "/screenshots": [{ id: "page", sourcePath: "<script>bad</script>.jpeg", text: "<img src=x onerror=bad>", status: "ready" }],
        "/jobs": [{ id: "job", title: "<b>Architect</b>", company: "", roleFamily: "ai-architect", reviewed: false, technologyCount: 1 }],
        "/demand": { totalJobs: 1, areas: [{ rank: 1, area: "Languages", jobCount: 1, share: 100, technologyCount: 1 }], technologies: [{ name: "<Python>", category: "Languages", jobCount: 1, share: 100, requiredCount: 1, preferredCount: 0,
          evidence: [{ jobId: "job", title: "<b>Architect</b>", evidence: "<script>evidence</script>" }] }], learningPlan: [] }
      }[url.slice("/api/jd".length)];
      return { ok: true, json: async () => ({ data }) };
    }
  });
  vm.runInContext(await readFile(new URL("./public/jd.js", import.meta.url), "utf8"), context);
  await context.window.JdView.open(container);
  return { container, context, requests, nodes, timers };
}

test("JD view hides imported pages and escapes job titles, technology names and evidence", async () => {
  const { container } = await browser();
  assert.doesNotMatch(container.innerHTML, /jd-screenshots|Imported OCR source documents|Group pages into a real job/);
  assert.match(container.innerHTML, /&lt;Python&gt;/);
  assert.match(container.innerHTML, /&lt;script&gt;evidence/);
  assert.doesNotMatch(container.innerHTML, /<script>|<img src=x|<b>Architect/);
  assert.match(container.innerHTML, /not a market-wide forecast/);
  assert.match(container.innerHTML, /Draft/);
  assert.match(container.innerHTML, /Technology area ranking/);
  assert.match(container.innerHTML, /#1/);
});

test("database failure is displayed as an escaped actionable error", async () => {
  const { container } = await browser({ failure: "Set JD_DATABASE_URL <now>" });
  assert.match(container.innerHTML, /role="alert"/);
  assert.match(container.innerHTML, /Set JD_DATABASE_URL &lt;now&gt;/);
  assert.match(container.innerHTML, /Try again/);
});

test("stale JD response never overwrites a different learning route", async () => {
  const { container, context } = await browser();
  context.location.hash = "#path";
  await context.window.JdView.open(container);
  assert.equal(container.innerHTML, '<section class="panel empty" role="status">Loading JD Intelligence...</section>');
});

test("JD view exposes zero-touch AI import", async () => {
  const { container } = await browser();
  assert.match(container.innerHTML, /Run AI import/);
  assert.match(container.innerHTML, /combined OCR document per folder/);
  assert.match(container.innerHTML, /id="jd-folder" type="file" webkitdirectory multiple/);
  assert.match(container.innerHTML, /Upload folder and extract text/);
  assert.doesNotMatch(container.innerHTML, /<h2>2\.|<h2>3\.|Create draft from selection/);
});

test("folder upload sends every supported image with its relative path before starting OCR", async () => {
  const { container, requests, nodes } = await browser();
  const files = [
    { name: "one.png", webkitRelativePath: "New Job/one.png", size: 10 },
    { name: "two.JPG", webkitRelativePath: "New Job/pages/two.JPG", size: 20 },
    { name: "notes.txt", webkitRelativePath: "New Job/notes.txt", size: 5 }
  ];
  nodes.get("#jd-folder").files = files;
  const button = nodes.get("#jd-upload");
  button.id = "jd-upload";
  await container.onclick({ target: { closest: () => button } });
  const uploads = requests.filter((request) => request.url.startsWith("/api/jd/upload?"));
  assert.equal(uploads.length, 2);
  assert.equal(uploads[0].url, `/api/jd/upload?path=${encodeURIComponent(files[0].webkitRelativePath)}`);
  assert.equal(uploads[1].options.body, files[1]);
  assert.equal(requests.filter((request) => request.url === "/api/jd/import").length, 1);
  assert.ok(requests.indexOf(uploads[1]) < requests.findIndex((request) => request.url === "/api/jd/import"));
});

test("folder upload failures are displayed and OCR is not started", async () => {
  const { container, requests, nodes } = await browser({ uploadFailure: "The image could not be saved." });
  nodes.get("#jd-folder").files = [{ name: "one.png", webkitRelativePath: "Job/one.png", size: 10 }];
  const button = nodes.get("#jd-upload");
  button.id = "jd-upload";
  await container.onclick({ target: { closest: () => button } });
  assert.equal(nodes.get("#jd-message").textContent, "The image could not be saved.");
  assert.equal(requests.some((request) => request.url === "/api/jd/import"), false);
  assert.equal(button.disabled, false);
});

test("URL-file upload posts text once, starts AI without OCR and locks import controls", async () => {
  const started = { state: "running", sourceType: "urls", total: 1, processed: 0, jobs: 0, skipped: 1, failed: 0, errors: [] };
  const { container, requests, nodes } = await browser({ responses: { "/naukri-import": started } });
  assert.match(container.innerHTML, /Upload URL list and analyze/);
  assert.match(container.innerHTML, /id="jd-url-file" type="file" accept=".txt,text\/plain"/);
  const text = "1.\nhttps://www.naukri.com/job-listings-ai-architect-181026003829";
  nodes.get("#jd-url-file").files = [{ name: "jobs.txt", size: text.length, text: async () => text }];
  const button = nodes.get("#jd-url-upload");
  button.id = "jd-url-upload";
  await container.onclick({ target: { closest: () => button } });
  const posts = requests.filter((request) => request.options.method === "POST");
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, "/api/jd/naukri-import");
  assert.equal(JSON.parse(posts[0].options.body).text, text);
  for (const id of ["jd-upload", "jd-import", "jd-ai-import", "jd-url-upload", "jd-url-file"]) assert.equal(nodes.get(`#${id}`).disabled, true, id);
  assert.match(nodes.get("#jd-ai-progress").textContent, /URLs processed/);
  assert.match(nodes.get("#jd-ai-progress").textContent, /1 duplicate URLs skipped/);
});

test("URL-file validation and read failures show an error without starting an import", async () => {
  for (const file of [
    null, { name: "jobs.csv", size: 1 }, { name: "jobs.txt", size: 256 * 1024 + 1 },
    { name: "jobs.txt", size: 1, text: async () => { throw new Error("Cannot read selected file."); } }
  ]) {
    const { container, nodes, requests } = await browser();
    nodes.get("#jd-url-file").files = file ? [file] : [];
    const button = nodes.get("#jd-url-upload");
    button.id = "jd-url-upload";
    await container.onclick({ target: { closest: () => button } });
    assert.ok(nodes.get("#jd-message").textContent);
    assert.equal(requests.some((request) => request.options.method === "POST"), false);
    assert.equal(button.disabled, false);
  }
});

test("URL import polling refreshes jobs and demand and preserves escaped per-URL errors", async () => {
  const started = { state: "running", sourceType: "urls", total: 2, processed: 0, jobs: 0, skipped: 0, failed: 0, errors: [] };
  let nextStatus = {
    progress: { state: "idle", total: 0, processed: 0, imported: 0, skipped: 0, failed: 0, errors: [] },
    aiProgress: { state: "idle", total: 0, processed: 0, jobs: 0, failed: 0, errors: [] },
    categories: ["Languages"], roles: ["ai-architect"], aiEnabled: true
  };
  const { container, nodes, requests, timers } = await browser({ responses: { "/naukri-import": started, "/status": () => nextStatus } });
  nodes.get("#jd-url-file").files = [{ name: "jobs.txt", size: 1, text: async () => "url" }];
  const button = nodes.get("#jd-url-upload");
  button.id = "jd-url-upload";
  await container.onclick({ target: { closest: () => button } });
  nextStatus = { ...nextStatus, aiProgress: { ...started, state: "completed-with-errors", processed: 2, jobs: 1, failed: 1,
    errors: [{ sourcePath: "<bad-url>", message: "<script>Blocked</script>" }] } };
  await timers.pop()();
  assert.equal(requests.filter((request) => request.url === "/api/jd/jobs").length, 2);
  assert.equal(requests.filter((request) => request.url === "/api/jd/demand").length, 2);
  assert.match(nodes.get("#jd-import-errors").innerHTML, /&lt;script&gt;Blocked/);
  assert.doesNotMatch(nodes.get("#jd-import-errors").innerHTML, /<script>/);
  assert.match(nodes.get("#jd-message").textContent, /refreshed/);
  assert.equal(button.disabled, false);
});
