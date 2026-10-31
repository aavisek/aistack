import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, readFile, symlink, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import pg from "pg";
import { JdStore } from "./jd-store.mjs";
import { createJdApi } from "./jd-api.mjs";
import { jdConfig } from "./jd-config.mjs";

const config = jdConfig();

test("folder image uploads preserve paths, reject invalid files and never overwrite evidence", async () => {
  const screenshotDir = await mkdtemp(join(tmpdir(), "jd-upload-"));
  const outside = await mkdtemp(join(tmpdir(), "jd-upload-outside-"));
  const api = createJdApi({}, { screenshotDir });
  const server = createServer((request, response) => api(request, response, new URL(request.url, "http://localhost")));
  const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const upload = (path, body = image, headers = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/jd/upload?path=${encodeURIComponent(path)}`, {
      method: "POST", headers: { "content-type": "application/octet-stream", ...headers }, body
    });
    const first = await upload("New Job/pages/one.png");
    assert.equal(first.status, 201);
    assert.deepEqual(await readFile(join(screenshotDir, "New Job/pages/one.png")), image);
    assert.equal((await (await upload("New Job/pages/one.png")).json()).data.skipped, true);
    assert.equal((await upload("New Job/pages/one.png", Buffer.concat([image, Buffer.from("changed")]))).status, 409);
    assert.deepEqual(await readFile(join(screenshotDir, "New Job/pages/one.png")), image);
    for (const path of ["../escape.png", "/escape.png", "one.png", "Job/../one.png", "Job\\outside/one.png"]) {
      assert.equal((await upload(path)).status, 400, path);
    }
    assert.equal((await upload("Job/notes.txt")).status, 415);
    assert.equal((await upload("Job/invalid.png", "not an image")).status, 415);
    assert.equal((await upload("Job/one.png", image, { origin: "https://untrusted.example" })).status, 403);
    await symlink(outside, join(screenshotDir, "linked"));
    assert.equal((await upload("linked/one.png")).status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(screenshotDir, { recursive: true });
    await rm(outside, { recursive: true });
  }
});

test("JD PostgreSQL and HTTP integration", { skip: !config.testDatabaseUrl }, async (t) => {
  const schema = `jd_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new pg.Pool({ connectionString: config.testDatabaseUrl });
  const connection = new URL(config.testDatabaseUrl);
  connection.searchParams.set("options", `-csearch_path=${schema}`);
  const store = new JdStore(connection.toString());
  const screenshotDir = await mkdtemp(join(tmpdir(), "jd-api-"));
  const fixture = Buffer.from("local image fixture");
  const fixtureHash = createHash("sha256").update(fixture).digest("hex");
  const api = createJdApi(store, { ...config, screenshotDir });
  const server = createServer((request, response) => api(request, response, new URL(request.url, "http://localhost")));
  const screenshotIds = [];
  let base;
  const request = async (path, method = "GET", data, headers = {}) => {
    const response = await fetch(`${base}${path}`, { method, headers: { "content-type": "application/json", ...headers }, body: data === undefined ? undefined : JSON.stringify(data) });
    return { status: response.status, ...(await response.json()) };
  };
  const input = (overrides = {}) => ({
    title: "Platform Architect <script>", company: "Example", body: "Python, RAG and Lang Chain. Python is required. NewTechX is preferred.",
    collectedOn: "2026-10-29", postedOn: "", roleFamily: "ai-platform-architect", reviewed: true, screenshotIds: [],
    technologies: [
      { name: "Python", category: "Languages", requirement: "required" },
      { name: "Lang Chain", category: "Other", requirement: "unspecified" },
      { name: "NewTechX", category: "Other", requirement: "preferred" }
    ], ...overrides
  });
  try {
    await admin.query(`CREATE SCHEMA ${pg.escapeIdentifier(schema)}`);
    await store.migrate();
    await store.migrate();
    // Older databases have only the partial fingerprint index, not a table constraint.
    await store.pool.query("ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_source_fingerprint_key");
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}/api/jd`;
    await t.test("migrations repeat safely and screenshots persist once by hash", async () => {
      await writeFile(join(screenshotDir, "first.jpeg"), fixture);
      await store.saveScreenshot(fixtureHash, "first.jpeg", "Python page one", null);
      await store.saveScreenshot(fixtureHash, "duplicate.jpeg", "changed", null);
      await store.saveScreenshot("second", "second.jpeg", "Python page two", null);
      const screenshots = await store.screenshots();
      assert.equal(screenshots.length, 2);
      assert.equal(screenshots[0].text, "Python page one");
      screenshotIds.push(...screenshots.map((item) => item.id));
    });
    await t.test("original image evidence is served only when it matches the imported hash", async () => {
      const path = `/screenshots/${screenshotIds[0]}/image`;
      const image = await fetch(`${base}${path}`);
      assert.equal(image.status, 200);
      assert.equal(image.headers.get("content-type"), "image/jpeg");
      assert.deepEqual(Buffer.from(await image.arrayBuffer()), fixture);
      await writeFile(join(screenshotDir, "first.jpeg"), "replaced file");
      assert.equal((await request(path)).status, 409);
      await rm(join(screenshotDir, "first.jpeg"));
      assert.equal((await request(path)).status, 404);
      await writeFile(join(screenshotDir, "first.jpeg"), fixture);
    });
    let id;
    await t.test("groups multiple pages and normalizes aliases in persistent mentions", async () => {
      const result = await request("/jobs", "POST", input({ screenshotIds }));
      assert.equal(result.status, 201);
      id = result.data.id;
      assert.deepEqual(result.data.screenshotIds, screenshotIds);
      assert.ok(result.data.technologies.some((item) => item.name === "LangChain"));
      assert.ok(result.data.technologies.every((item) => item.evidence));
      assert.equal(result.data.postedOn, null);
      assert.equal((await request(`/jobs/${id}`)).data.title, input().title);
      const suggestions = (await request("/extract", "POST", { text: "NewTechX and Python" })).data;
      assert.ok(suggestions.some((item) => item.name === "NewTechX"));
    });
    await t.test("edits do not inflate demand, drafts and other roles are filtered", async () => {
      assert.equal((await request(`/jobs/${id}`, "PUT", input({ screenshotIds }))).status, 200);
      await request("/jobs", "POST", input({ reviewed: false }));
      await request("/jobs", "POST", input({ roleFamily: "other", collectedOn: "2026-09-01", technologies: [input().technologies[0]] }));
      const demand = (await request("/demand")).data;
      assert.equal(demand.totalJobs, 2);
      assert.equal(demand.areas[0].area, "Languages");
      assert.equal(demand.areas[0].jobCount, 2);
      assert.equal(demand.areas[0].rank, 1);
      assert.equal(demand.technologies.find((item) => item.name === "Python").jobCount, 2);
      assert.equal(demand.technologies.find((item) => item.name === "LangChain").share, 50);
      const filtered = (await request("/demand?role=ai-platform-architect&from=2026-10-01&to=2026-10-31")).data;
      assert.equal(filtered.totalJobs, 1);
      assert.equal(filtered.technologies[0].share, 100);
      assert.equal(filtered.technologyBreakdown.find((item) => item.name === "Python").share, 100);
      assert.equal(filtered.technologyBreakdown.find((item) => item.name === "Python").type, "Languages");
      assert.equal(filtered.technologyBreakdown.length, filtered.technologies.length);
      assert.equal(filtered.learningPlan.length, 4);
      const empty = (await request("/demand?role=ai-architect")).data;
      assert.equal(empty.totalJobs, 0);
      assert.deepEqual(empty.technologies, []);
      assert.deepEqual(empty.technologyBreakdown, []);
      const master = await request("/technologies");
      assert.equal(master.status, 200);
      assert.ok(master.data.some((item) => item.name === "LangSmith" && item.jobCount === 0));
      assert.equal(master.data.some((item) => item.name === "NewTechX"), false);
      assert.equal(master.data.some((item) => item.name === "RAG"), false);
      assert.ok(master.data.some((item) => item.name === "Python" && item.jobCount > 0));
      const recommendations = await request("/recommendations?role=other&from=2026-10-01&to=2026-10-31");
      assert.equal(recommendations.status, 200);
      const platform = recommendations.data.find((item) => item.role === "ai-platform-architect");
      const solution = recommendations.data.find((item) => item.role === "ai-architect");
      assert.equal(platform.totalJobs, 1);
      assert.equal(platform.tools.find((item) => item.name === "Python").share, 100);
      assert.equal(platform.tools.some((item) => item.name === "RAG"), false);
      assert.equal(solution.title, "AI Solution Architect");
      assert.equal(solution.totalJobs, 0);
      assert.deepEqual(solution.tools, []);
      const emptyRecommendations = await request("/recommendations?from=2027-01-01");
      assert.ok(emptyRecommendations.data.every((item) => item.totalJobs === 0 && !item.tools.length));
      assert.equal((await request("/recommendations?from=2026-12-01&to=2026-01-01")).status, 400);
      const roadmap = await request("/roadmap?role=other&from=2026-10-01&to=2026-10-31");
      assert.equal(roadmap.status, 200);
      assert.equal(roadmap.data.role, "ai-platform-architect");
      assert.equal(roadmap.data.reviewedJobs, 1);
      assert.equal(roadmap.data.months.length, 24);
      assert.equal(roadmap.data.minimumToolkit.find((tool) => tool.name === "Python").share, 100);
      const emptyRoadmap = await request("/roadmap?from=2027-01-01");
      assert.equal(emptyRoadmap.data.reviewedJobs, 0);
      assert.equal(emptyRoadmap.data.months.length, 24);
      assert.equal((await request("/roadmap?from=2026-12-01&to=2026-01-01")).status, 400);
      assert.equal((await request("/demand?from=2026-12-01&to=2026-01-01")).status, 400);
    });
    await t.test("page conflicts and validation failures are transactional", async () => {
      assert.equal((await request("/jobs", "POST", input({ screenshotIds }))).status, 409);
      assert.equal((await store.jobs()).length, 3);
      assert.equal((await request(`/jobs/${id}`, "PUT", input({ technologies: [{ name: "Invented", category: "Other", requirement: "required" }] }))).status, 400);
      assert.equal((await store.job(id)).technologies.length, 3);
      assert.equal((await request(`/jobs/${randomUUID()}`)).status, 404);
      assert.equal((await request("/jobs/not-a-uuid")).status, 400);
    });
    await t.test("drafting a reviewed job removes it from demand and releases removed pages", async () => {
      await store.pool.query("UPDATE job_descriptions SET body=body || ' Terraform and LangSmith are required.' WHERE id=$1", [id]);
      const before = await request("/recommendations");
      const platform = before.data.find((item) => item.role === "ai-platform-architect");
      assert.equal(platform.tools.find((item) => item.name === "Terraform").jobCount, 1);
      assert.equal(platform.tools.find((item) => item.name === "LangSmith").share, 100);
      assert.equal((await store.job(id)).technologies.some((item) => item.name === "Terraform"), false);
      const master = await request("/technologies");
      assert.equal(master.data.find((item) => item.name === "Terraform").jobCount, 1);
      await request(`/jobs/${id}`, "PUT", input({ reviewed: false }));
      assert.equal((await request("/demand?role=ai-platform-architect")).data.totalJobs, 0);
      assert.deepEqual((await request("/recommendations")).data.find((item) => item.role === "ai-platform-architect").tools, []);
      assert.ok((await store.screenshots()).every((page) => page.jobId === null));
    });
    await t.test("AI reruns update an existing job when its page set grows", async () => {
      const aiInput = { title: "AI Platform Architect", company: "Example", roleFamily: "ai-platform-architect",
        sourceFolder: "Example Job", body: "Python and RAG.", screenshotIds, technologies: [{ name: "Python", category: "Languages", requirement: "required", evidence: "Python", confidence: 0.9 }], confidence: 0.9 };
      const first = await store.saveAiJob(aiInput);
      const repeated = await store.saveAiJob({ ...aiInput, sourceFolder: "Updated Folder" });
      assert.equal(repeated.id, first.id);
      assert.equal((await store.aiJobs()).find((job) => job.id === first.id).sourceFolder, "Updated Folder");
      const before = (await store.jobs()).length;
      const second = await store.saveAiJob({ ...aiInput, jobId: first.id, body: "Python, RAG and new page." });
      assert.equal(second.id, first.id);
      assert.equal((await store.jobs()).length, before);
      assert.equal((await store.aiJobs()).find((job) => job.id === first.id).sourceFolder, "Example Job");
    });
    await t.test("URL AI jobs persist provenance, update by Naukri ID and contribute once to demand", async () => {
      const sourceUrl = "https://www.naukri.com/job-listings-ai-architect-example-181026003829";
      const urlInput = {
        sourceUrl, sourceFolder: null, screenshotIds: [], title: "AI Architect", company: "Example",
        roleFamily: "ai-architect", body: "Python is required.", confidence: 0.9,
        technologies: [{ name: "Python", category: "Languages", requirement: "required", evidence: "Python is required.", confidence: 0.9 }]
      };
      const before = await store.demand(new URLSearchParams("role=ai-architect"));
      const first = await store.saveAiJob(urlInput);
      assert.equal(first.sourceUrl, sourceUrl);
      assert.deepEqual(first.screenshotIds, []);
      assert.equal(first.reviewed, true);
      const repeated = await store.saveAiJob({ ...urlInput, sourceUrl: `${sourceUrl.replace("ai-architect", "changed-title")}?tracking=1`, title: "Updated AI Architect" });
      assert.equal(repeated.id, first.id);
      assert.equal(repeated.title, "Updated AI Architect");
      const demand = await store.demand(new URLSearchParams("role=ai-architect"));
      assert.equal(demand.totalJobs, before.totalJobs + 1);
      assert.equal(demand.technologies.find((item) => item.name === "Python").jobCount, 1);
      const saved = await request(`/jobs/${first.id}`, "PUT", input({
        title: repeated.title, body: repeated.body, roleFamily: "ai-architect",
        technologies: [{ name: "Python", category: "Languages", requirement: "required" }]
      }));
      assert.equal(saved.status, 200);
      assert.equal(saved.data.sourceUrl, repeated.sourceUrl);
      assert.deepEqual(saved.data.screenshotIds, []);
      const screenshotJob = (await store.aiJobs()).find((job) => job.sourceFolder === "Example Job");
      assert.deepEqual((await store.job(screenshotJob.id)).screenshotIds, screenshotIds);
    });
    await t.test("import deduplication rejects matching IDs and hashes without overwriting existing jobs", async () => {
      const sourceUrl = "https://www.naukri.com/job-listings-architect-example-291026029686";
      const input = {
        sourceUrl, sourceFolder: null, screenshotIds: [], title: "Original", company: "Example",
        roleFamily: "ai-architect", body: "Python is required.", confidence: 1, rejectDuplicate: true,
        sourceContentHash: "test-document-hash",
        technologies: [{ name: "Python", category: "Languages", requirement: "required", evidence: "Python is required.", confidence: 1 }]
      };
      const before = (await store.jobs()).length;
      const first = await store.saveAiJob(input);
      assert.equal(await store.hasImportedJob(`${sourceUrl}?src=cluster`), true);
      assert.equal(await store.hasImportedJob(sourceUrl.replace("291026029686", "161026021479"), input.sourceContentHash), true);
      await assert.rejects(store.saveAiJob({ ...input, title: "Changed", sourceContentHash: "changed" }), /Duplicate JD/);
      await assert.rejects(store.saveAiJob({ ...input, sourceUrl: sourceUrl.replace("291026029686", "161026021479") }), /Duplicate JD/);
      assert.equal((await store.job(first.id)).title, "Original");
      assert.equal((await store.jobs()).length, before + 1);
      const concurrent = { ...input, sourceUrl: sourceUrl.replace("291026029686", "161026021479"), sourceContentHash: "concurrent-test" };
      const results = await Promise.allSettled([store.saveAiJob(concurrent), store.saveAiJob(concurrent)]);
      assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
      assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    });
    await t.test("batch analyses reuse jobs, scope denominators and freeze previous reports", {skip:process.env.JD_HTML_BROWSER_TEST !== "1"}, async () => {
      const {createAnalysis,runAnalysis}=await import("./jd-analysis.mjs");
      let calls=0;
      const processor={analyzeText:async(_,text)=>{
        calls++;
        return {title:"Batch Platform",company:"Example",roleFamily:"ai-platform-architect",sourceText:text,
          confidence:1,requirements:[{name:"Python",category:"Languages",requirement:"required",evidence:"Python",confidence:1}]};
      }};
      const file={name:"batch.html",html:`<link rel="canonical" href="https://www.naukri.com/job-listings-batch-test-111111111111"><h1 class="jd-header-title">Platform</h1><div class="job-desc-container"><div><h2>Job description</h2></div><div>Python is required.</div></div>`};
      const progress=()=>({state:"running",total:1,processed:0,jobs:0,reused:0,failed:0,skipped:0,errors:[]});
      const first=await createAnalysis(store,"First");
      const p1=progress();await runAnalysis(store,processor,[file],p1,first);
      assert.equal(p1.jobs,1);assert.equal(calls,1);
      const before=(await store.pool.query("SELECT report FROM jd_analyses WHERE id=$1",[first])).rows[0].report;
      assert.equal(before.demand.totalJobs,1);assert.equal(before.previous,null);
      const second=await createAnalysis(store,"Second");
      const p2=progress();await runAnalysis(store,processor,[file,file],p2,second);
      assert.equal(calls,1);assert.equal(p2.reused,2);
      const report=(await store.pool.query("SELECT report FROM jd_analyses WHERE id=$1",[second])).rows[0].report;
      assert.equal(report.jobs.length,1);assert.equal(report.demand.totalJobs,1);
      assert.equal(report.previous.id,first);
      const history = await request("/analyses");
      const detail = await request(`/analyses/${second}`);
      assert.equal(detail.status, 200);
      assert.equal(detail.data.id, second);
      assert.equal(detail.data.createdAt, history.data.find((item) => item.id === second).createdAt);
      assert.deepEqual(detail.data.report, report);
      assert.equal((await request("/analyses/invalid")).status, 400);
      assert.equal((await request(`/analyses/${randomUUID()}`)).status, 404);
      const pdf = await fetch(`${base}/analyses/${second}/pdf/ai-platform-architect`);
      assert.equal(pdf.status, 200);
      assert.equal(pdf.headers.get("content-type"), "application/pdf");
      assert.match(pdf.headers.get("content-disposition"), new RegExp(`${second}-ai-platform-architect.pdf`));
      assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
      assert.equal((await request(`/analyses/${second}/pdf/invalid`)).status, 400);
      assert.equal((await request(`/analyses/${randomUUID()}/pdf/roadmap`)).status, 404);
      const unfinished = await createAnalysis(store, "Unfinished");
      assert.equal((await request(`/analyses/${unfinished}/pdf/roadmap`)).status, 409);
      assert.ok(report.trends.every(row=>row.change===0));
      await store.pool.query("UPDATE job_descriptions SET body='Changed' WHERE id=$1",[report.jobs[0].id]);
      assert.deepEqual((await store.pool.query("SELECT report FROM jd_analyses WHERE id=$1",[first])).rows[0].report,before);
    });
    await t.test("saved-collection snapshot retains database mentions, all jobs and role counts without changing jobs or old reports", async () => {
      const { snapshotSavedJobs } = await import("./jd-analysis.mjs");
      const databaseJob = await request("/jobs", "POST", input({
        title: "Snapshot database platform", body: "PostgreSQL and Qdrant are required.",
        technologies: [
          { name: "PostgreSQL", category: "Data and retrieval", requirement: "required" },
          { name: "Qdrant", category: "Data and retrieval", requirement: "required" }
        ]
      }));
      assert.equal(databaseJob.status, 201);
      const originalJobs = (await store.pool.query("SELECT * FROM job_descriptions ORDER BY id")).rows;
      const originalReports = (await store.pool.query("SELECT id,report FROM jd_analyses ORDER BY id")).rows;
      const liveDemand = await store.demand(new URLSearchParams());
      const liveRoles = await store.toolRecommendations(new URLSearchParams());
      const id = await snapshotSavedJobs(store, "Original saved collection");
      const { data } = await request(`/analyses/${id}`);
      assert.equal(data.state, "completed");
      assert.equal(data.report.scope, "saved-collection");
      assert.equal(data.report.previous, null);
      assert.equal(data.report.jobs.length, originalJobs.length);
      assert.equal(data.report.demand.totalJobs, liveDemand.totalJobs);
      assert.deepEqual(data.report.recommendations, liveRoles);
      for (const name of ["PostgreSQL", "Qdrant"]) {
        assert.ok(data.report.demand.technologyBreakdown.some((item) => item.name === name && item.jobCount > 0));
        assert.ok(data.report.technologies.some((item) => item.name === name && item.jobCount > 0));
      }
      assert.deepEqual((await store.pool.query("SELECT * FROM job_descriptions ORDER BY id")).rows, originalJobs);
      assert.deepEqual((await store.pool.query("SELECT id,report FROM jd_analyses WHERE id<>$1 ORDER BY id", [id])).rows, originalReports);
      await request(`/analyses/${id}`);
      assert.deepEqual((await request(`/analyses/${id}`)).data.report, data.report);
    });
    await t.test("HTTP rejects malformed JSON, cross-origin writes, oversized bodies and invalid methods", async () => {
      assert.equal((await request("/jobs", "POST", input(), { origin: "https://untrusted.example" })).status, 403);
      const malformed = await fetch(`${base}/extract`, { method: "POST", headers: { "content-type": "application/json" }, body: "{" });
      assert.equal(malformed.status, 400);
      const oversized = await request("/extract", "POST", { text: "x".repeat(1024 * 1024) });
      assert.equal(oversized.status, 413);
      assert.equal((await request("/jobs", "DELETE")).status, 404);
      assert.equal((await request("/extract", "POST", { text: "Python and RAG" })).data.length, 2);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await store.close();
    await admin.query(`DROP SCHEMA IF EXISTS ${pg.escapeIdentifier(schema)} CASCADE`);
    await admin.end();
    await rm(screenshotDir, { recursive: true });
  }
});

test("JD API reports missing configuration without affecting other routes", async () => {
  const api = createJdApi(null, {});
  const response = {
    writeHead(status) { this.status = status; },
    end(body) { this.body = JSON.parse(body); }
  };
  await api({ method: "GET", headers: {} }, response, new URL("http://localhost/api/jd/status"));
  assert.equal(response.status, 503);
  assert.match(response.body.error.message, /JD_DATABASE_URL/);
});
