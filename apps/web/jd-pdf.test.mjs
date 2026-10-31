import test from "node:test";
import assert from "node:assert/strict";
import { analysisPdfDocument, generateAnalysisPdf } from "./jd-pdf.mjs";
import { platformLearningRoadmap } from "./jd-roadmap.mjs";

const analysis = {
  id: "11111111-1111-4111-8111-111111111111", name: "<Saved batch>",
  createdAt: "2026-10-31T04:00:00.000Z", progress: { failed: 1 },
  report: {
    roadmap: platformLearningRoadmap({ totalJobs: 2, tools: [] }),
    recommendations: [
      { role: "ai-platform-architect", title: "AI Platform Architect", totalJobs: 2, tools: [
        { rank: 1, name: "Terraform", type: "Tools and frameworks", jobCount: 1, share: 50,
          evidence: [{ jobId: "job1", title: "<Platform>", evidence: '<script src="https://example.com">bad</script>' }] }
      ] },
      { role: "ai-architect", title: "AI Solution Architect", totalJobs: 0, tools: [] }
    ]
  }
};
const escaped = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

test("role PDF includes frozen rankings, percentages, evidence and analysis metadata", () => {
  const { html, filename } = analysisPdfDocument(analysis, "ai-platform-architect");
  assert.equal(filename, `JD-20261031-${analysis.id}-ai-platform-architect.pdf`);
  assert.match(html, /Terraform/);
  assert.match(html, /50%/);
  assert.match(html, /&lt;Platform&gt;/);
  assert.match(html, /&lt;script/);
  assert.doesNotMatch(html, /<script|<img/);
  assert.match(html, /2026-10-31T04:00:00.000Z/);
  assert.match(html, /1 files failed/);
  const empty = analysisPdfDocument(analysis, "ai-architect");
  assert.match(empty.html, /AI Solution Architect/);
  assert.match(empty.html, /No recognized tools or reviewed jobs/);
  assert.doesNotMatch(empty.html, /Terraform/);
});

test("roadmap PDF expands every month, priority, bucket, project and completion check", () => {
  const { html } = analysisPdfDocument(analysis, "roadmap");
  assert.equal((html.match(/class="month"/g) ?? []).length, 24);
  for (const month of analysis.report.roadmap.months) {
    assert.ok(html.includes(escaped(month.title)));
    assert.ok(html.includes(escaped(month.project)));
    for (const check of month.checks) assert.ok(html.includes(escaped(check)), check);
  }
  for (const bucket of analysis.report.roadmap.buckets) assert.ok(html.includes(bucket.title));
  assert.match(html, /P0/);
  assert.match(html, /P1/);
  assert.match(html, /P2 \(optional\)/);
  assert.match(html, /Minimum job-ready path/);
  assert.match(html, /does not guarantee employment/);
});

test("PDF rejects unsupported report types and reports that are not saved", () => {
  assert.throws(() => analysisPdfDocument(analysis, "../../other"), /Unknown PDF report type/);
  assert.throws(() => analysisPdfDocument({ ...analysis, report: null }, "roadmap"), /no saved report/);
});

test("sandboxed offline Chromium produces real PDFs for all three exports", { skip: process.env.JD_HTML_BROWSER_TEST !== "1" }, async () => {
  for (const type of ["ai-platform-architect", "ai-architect", "roadmap"]) {
    const { buffer, filename } = await generateAnalysisPdf(analysis, type);
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
    assert.ok(buffer.length > 1000);
    assert.match(buffer.toString("latin1"), /%%EOF/);
    const pages = Number(buffer.toString("latin1").match(/\/Type \/Pages[\s\S]*?\/Count (\d+)/)?.[1]);
    assert.ok(pages >= 1);
    if (type === "roadmap") assert.ok(pages > 1);
    assert.ok(filename.endsWith(`-${type}.pdf`));
  }
});
