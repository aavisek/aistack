import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { platformLearningRoadmap } from "./jd-roadmap.mjs";

const id = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const saved = { id, name: "<October batch>", createdAt: "2026-10-31T04:00:00.000Z", state: "completed", hasReport: true };
const report = {
  jobs: [{ id: "job", title: "<b>Architect</b>", company: "", roleFamily: "ai-architect", reviewed: false, technologyCount: 1 }],
  demand: {
    totalJobs: 1, technologyBreakdown: [{ name: "<Python>", type: "Languages", jobCount: 1, share: 100 }],
    areas: [{ rank: 1, area: "Languages", jobCount: 1, share: 100, technologyCount: 1 }],
    technologies: [{ name: "<Python>", category: "Languages", jobCount: 1, share: 100, requiredCount: 1, preferredCount: 0,
      evidence: [{ jobId: "job", title: "<b>Architect</b>", evidence: "<script>evidence</script>" }] }]
  },
  recommendations: [
    { role: "ai-platform-architect", title: "AI Platform Architect", totalJobs: 1, tools: [
      { rank: 1, name: "<Python>", type: "Languages", jobCount: 1, share: 100, evidence: [] }
    ] },
    { role: "ai-architect", title: "AI Solution Architect", totalJobs: 0, tools: [] }
  ],
  technologies: [
    { name: "AKS", aliases: ["Azure Kubernetes Service"], type: "Cloud platforms and services", builtIn: true, jobCount: 1 },
    { name: "PostgreSQL", aliases: ["Postgres"], type: "Databases", builtIn: true, jobCount: 0 }
  ],
  roadmap: platformLearningRoadmap({ totalJobs: 1, tools: [] }),
  previous: null
};
const idle = { state: "idle", total: 0, processed: 0, jobs: 0, imported: 0, skipped: 0, failed: 0, errors: [] };

async function browser({ failure = null, responses = {}, hash = "#jd", pdfFailure = null } = {}) {
  const nodes = new Map();
  const requests = [];
  const downloads = [];
  const timers = [];
  const node = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, { value: "", textContent: "", innerHTML: "", disabled: false, dataset: {}, focus() {}, setAttribute() {}, classList: { toggle() {}, add() {} } });
    return nodes.get(selector);
  };
  const container = { innerHTML: "", querySelector: node };
  const context = vm.createContext({
    URL: { createObjectURL() { return "blob:pdf"; }, revokeObjectURL() {} },
    document: {
      body: { append() {} },
      createElement() { return { click() { downloads.push({ href: this.href, filename: this.download }); }, remove() {} }; }
    },
    navigator: { clipboard: { writeText: async (text) => { context.copiedText = text; } } },
    window: {}, location: { hash }, clearTimeout() {}, setTimeout(callback) { timers.push(callback); },
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      if (url.includes("/pdf/")) return pdfFailure
        ? { ok: false, json: async () => ({ error: { message: pdfFailure } }) }
        : { ok: true, headers: { get: () => "application/pdf" }, blob: async () => ({}) };
      if (failure) return { ok: false, json: async () => ({ error: { message: failure } }) };
      const path = url.slice("/api/jd".length);
      const defaults = {
        "/status": { progress: idle, aiProgress: idle, aiEnabled: true },
        "/analyses": [saved],
        [`/analyses/${id}`]: { ...saved, report },
        [`/analyses/${secondId}`]: { ...saved, id: secondId, name: "Second batch", report: { ...report, jobs: [] } }
      };
      const value = Object.hasOwn(responses, path) ? responses[path] : defaults[path];
      assert.notEqual(value, undefined, `Unexpected request: ${url}`);
      const data = typeof value === "function" ? value(options) : value;
      return { ok: true, json: async () => ({ data }) };
    }
  });
  vm.runInContext(await readFile(new URL("./public/jd.js", import.meta.url), "utf8"), context);
  await context.window.JdView.open(container);
  return { container, context, requests, nodes, timers, downloads };
}

test("history replaces cumulative analysis with clickable date-stamped unique IDs", async () => {
  const { container, requests } = await browser({ responses: { "/analyses": [saved, { ...saved, id: secondId }] } });
  assert.match(container.innerHTML, new RegExp(`href="#jd/${id}"`));
  assert.match(container.innerHTML, new RegExp(`JD-20261031-${id}`));
  assert.match(container.innerHTML, new RegExp(`JD-20261031-${secondId}`));
  assert.match(container.innerHTML, /&lt;October batch&gt;/);
  assert.doesNotMatch(container.innerHTML, /Cumulative collection \(live\)|id="jd-demand"|id="jd-roadmap"|Import and analyze screenshots|id="jd-html-upload"|jd-analysis-select/);
  assert.deepEqual(requests.map((r) => r.url).sort(), ["/api/jd/analyses", "/api/jd/status"]);
});

test("empty history and unfinished runs do not open reports", async () => {
  const empty = await browser({ responses: { "/analyses": [] } });
  assert.match(empty.container.innerHTML, /No saved analyses yet/);
  const failed = await browser({ responses: { "/analyses": [{ ...saved, hasReport: false, state: "failed" }] } });
  assert.match(failed.container.innerHTML, new RegExp(`JD-20261031-${id}`));
  assert.doesNotMatch(failed.container.innerHTML, new RegExp(`href="#jd/${id}"`));
});

test("direct ID routes open only the frozen report and preserve escaping and learning sections", async () => {
  const { container, requests } = await browser({ hash: `#jd/${id}` });
  assert.match(container.innerHTML, /All saved analyses/);
  assert.match(container.innerHTML, /aria-current="page"/);
  assert.match(container.innerHTML, /&lt;Python&gt;/);
  assert.match(container.innerHTML, /&lt;script&gt;evidence/);
  assert.doesNotMatch(container.innerHTML, /<script>|<b>Architect|id="jd-filters"/);
  assert.match(container.innerHTML, /Draft/);
  assert.match(container.innerHTML, /Technology area ranking/);
  assert.match(container.innerHTML, /Technology names and concepts by type/);
  assert.match(container.innerHTML, /AI Platform Architect tool learning priorities/);
  assert.match(container.innerHTML, /AI Solution Architect tool learning priorities/);
  assert.match(container.innerHTML, /Minimum job-ready path/);
  assert.equal((container.innerHTML.match(/class="jd-roadmap-month"/g) ?? []).length, 24);
  assert.equal((container.innerHTML.match(/class="jd-roadmap-bucket"/g) ?? []).length, 3);
  assert.equal(requests.length, 3);
});

test("route changes and reloads open the correct report and returning to history hides results", async () => {
  const { container, context } = await browser({ hash: `#jd/${id}` });
  context.location.hash = `#jd/${secondId}`;
  await context.window.JdView.open(container);
  assert.match(container.innerHTML, /Analysis: Second batch/);
  assert.match(container.innerHTML, /No jobs saved yet/);
  await context.window.JdView.open(container);
  assert.match(container.innerHTML, /Analysis: Second batch/);
  context.location.hash = "#jd";
  await context.window.JdView.open(container);
  assert.doesNotMatch(container.innerHTML, /id="jd-demand"/);
});

test("unavailable reports display actionable escaped errors", async () => {
  const { container } = await browser({ failure: "Set JD_DATABASE_URL <now>" });
  assert.match(container.innerHTML, /role="alert"/);
  assert.match(container.innerHTML, /Set JD_DATABASE_URL &lt;now&gt;/);
  assert.match(container.innerHTML, /Try again/);
  const unfinished = await browser({ hash: `#jd/${id}`, responses: { [`/analyses/${id}`]: { ...saved, report: null } } });
  assert.match(unfinished.container.innerHTML, /no completed report/);
});

test("New analysis posts a named batch, locks controls and routes to its completed report", async () => {
  const started = { ...idle, state: "running", analysisId: id, sourceType: "html", total: 1 };
  let status = { progress: idle, aiProgress: idle };
  const { container, nodes, requests, timers, context } = await browser({ responses: {
    "/analyses": (options) => options.method === "POST" ? started : [saved],
    "/status": () => status
  } });
  nodes.get("#jd-analysis-name").value = "New batch";
  nodes.get("#jd-analysis-files").files = [{ name: "one.html", size: 20, text: async () => "<h1>One</h1>" }];
  await container.onsubmit({ preventDefault() {}, target: { id: "jd-new-form" } });
  const posts = requests.filter((r) => r.options.method === "POST");
  assert.equal(posts.length, 1);
  assert.deepEqual(JSON.parse(posts[0].options.body), { name: "New batch", files: [{ name: "one.html", html: "<h1>One</h1>" }] });
  assert.equal(nodes.get("#jd-analysis-generate").disabled, true);
  status = { progress: idle, aiProgress: { ...started, state: "completed", processed: 1 } };
  await timers.pop()();
  assert.equal(context.location.hash, `#jd/${id}`);
});

test("New analysis validates HTML files and surfaces read failures without posting", async () => {
  for (const files of [[], [{ name: "bad.txt", size: 1 }], [{ name: "big.html", size: 2 * 1024 * 1024 + 1 }],
    [{ name: "bad.html", size: 1, text: async () => { throw new Error("Read failed"); } }]]) {
    const { container, nodes, requests } = await browser();
    nodes.get("#jd-analysis-name").value = "New batch";
    nodes.get("#jd-analysis-files").files = files;
    await container.onsubmit({ preventDefault() {}, target: { id: "jd-new-form" } });
    assert.ok(nodes.get("#jd-message").textContent);
    assert.equal(requests.some((r) => r.options.method === "POST"), false);
    assert.equal(nodes.get("#jd-analysis-generate").disabled, false);
  }
});

test("New analysis automatically fills a read-only timestamped name and focuses file selection", async () => {
  const { container, nodes } = await browser();
  assert.match(container.innerHTML, /id="jd-analysis-name" readonly value="JD analysis \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} UTC"/);
  await container.onclick({ target: { closest: () => ({ id: "jd-new", dataset: {} }) } });
  assert.match(nodes.get("#jd-analysis-name").value, /^JD analysis \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} UTC$/);
  assert.equal(nodes.get("#jd-new-form").hidden, false);
});

test("master catalogue searches aliases, retains selection and copies canonical names", async () => {
  const { container, nodes, context } = await browser({ hash: `#jd/${id}` });
  const search = nodes.get("#jd-master-search");
  search.id = "jd-master-search";
  const click = async (id) => container.onclick({ target: { closest: () => ({ id, dataset: {} }) } });
  search.value = "Azure Kubernetes";
  container.oninput({ target: search });
  assert.match(nodes.get("#jd-master-table").innerHTML, /AKS/);
  assert.doesNotMatch(nodes.get("#jd-master-table").innerHTML, /PostgreSQL/);
  await click("jd-master-select");
  search.value = "Postgres";
  container.oninput({ target: search });
  await click("jd-master-select");
  await click("jd-master-copy");
  assert.equal(context.copiedText, "AKS\nPostgreSQL\n");
});

test("all three PDF buttons download the selected saved analysis", async () => {
  const { container, requests, downloads } = await browser({ hash: `#jd/${id}` });
  for (const type of ["ai-platform-architect", "ai-architect", "roadmap"]) {
    assert.match(container.innerHTML, new RegExp(`data-pdf-type="${type}"`));
    const button = { dataset: { pdfType: type }, disabled: false };
    await container.onclick({ target: { closest: () => button } });
    assert.equal(button.disabled, false);
    assert.ok(requests.some((r) => r.url === `/api/jd/analyses/${id}/pdf/${type}`));
    assert.equal(downloads.at(-1).filename, `JD-20261031-${id}-${type}.pdf`);
  }
});

test("PDF failures are visible and re-enable the download button", async () => {
  const { container, downloads, nodes } = await browser({ hash: `#jd/${id}`, pdfFailure: "PDF generation failed." });
  const button = { dataset: { pdfType: "roadmap" }, disabled: false };
  await container.onclick({ target: { closest: () => button } });
  assert.equal(nodes.get("#jd-message").textContent, "PDF generation failed.");
  assert.equal(button.disabled, false);
  assert.equal(downloads.length, 0);
});

test("saved-collection snapshot clearly shows original role counts and does not generate analysis on open", async () => {
  const snapshot = { ...report, scope: "saved-collection", recommendations: [
    { ...report.recommendations[0], totalJobs: 7 }, { ...report.recommendations[1], totalJobs: 13 }
  ] };
  const { container, requests, context } = await browser({ hash: `#jd/${id}`, responses: { [`/analyses/${id}`]: { ...saved, report: snapshot } } });
  assert.match(container.innerHTML, /Original saved-collection snapshot/);
  assert.match(container.innerHTML, /AI Platform Architect: 7/);
  assert.match(container.innerHTML, /AI Solution Architect: 13/);
  assert.match(container.innerHTML, /does not rerun AI/);
  await context.window.JdView.open(container);
  assert.ok(requests.every((r) => r.options.method === "GET"));
  assert.ok(requests.every((r) => !r.url.includes("/demand") && !r.url.includes("/recommendations")));
});
