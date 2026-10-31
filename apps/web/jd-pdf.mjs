import { chromium } from "playwright";
import { JdError } from "./jd.mjs";

export const pdfTypes = ["ai-platform-architect", "ai-architect", "roadmap"];
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const list = (items) => `<ul>${items.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`;

export function analysisPdfDocument(analysis, type) {
  if (!pdfTypes.includes(type)) throw new JdError("Unknown PDF report type.");
  if (!analysis.report) throw new JdError("This analysis has no saved report to download.", 409);
  const savedAt = new Date(analysis.createdAt).toISOString();
  const label = `JD-${savedAt.slice(0, 10).replace(/-/g, "")}-${analysis.id}`;
  let title;
  let content;
  if (type === "roadmap") {
    const roadmap = analysis.report.roadmap;
    title = roadmap.title;
    content = `<p>${escape(roadmap.startingPoint)}. ${roadmap.weeklyHours} hours/week:
      ${roadmap.plannedWeeks} study weeks + ${roadmap.bufferWeeks} buffer weeks, ${roadmap.totalHours} hours.</p>
      <p><strong>Minimum job-ready path:</strong> complete P0 and P1; defer P2. Primary stack: Python, Azure,
      PostgreSQL/pgvector and LangGraph. Learn supporting tools as needed for projects, not every product.
      Apply for junior roles at month 18 if you can demonstrate the checks; strengthen the portfolio in months 22-23.
      Repeat a month if its completion checks are not met.</p>
      <p>Role buckets describe learning scope, not attained seniority. This plan does not guarantee employment
      or an architect title; production experience and architectural judgment are still required.
      Cloud/model labs may incur charges: use budgets, non-sensitive data and tear down unused resources.</p>
      <h2>Priorities</h2>${list(roadmap.priorities.map((item) => `${item.code}: ${item.title} - ${item.description}`))}
      <h2>Weekly routine</h2>${list(roadmap.weeklySchedule.map((item) => `${item.hours} hours: ${item.activity}`))}
      <h2>Minimum working toolkit</h2><p>${roadmap.minimumToolkit.map((tool) => escape(tool.name)).join(", ")}</p>
      <p>Demand is based on ${roadmap.reviewedJobs} reviewed platform jobs in this batch.
      Curriculum foundations remain necessary even with no recorded demand.</p>
      <h2>Readiness checkpoints</h2>${list(roadmap.readiness.map((item) => `Month ${item.month}: ${item.target} - ${item.criteria}`))}
      ${roadmap.buckets.map((bucket) => `<h2>${escape(bucket.title)} bucket - months ${bucket.fromMonth}-${bucket.toMonth}</h2>
        <p>${escape(bucket.goal)}</p><p><strong>Readiness evidence:</strong> ${escape(bucket.experience)}</p>
        ${roadmap.months.filter((month) => month.bucket === bucket.id).map((month) => `<section class="month">
          <h3>Month ${month.month}: ${escape(month.title)} - ${escape(month.priority)} (${month.priority === "P2" ? "optional" : "core"})</h3>
          <p>${escape(month.phase)}; ${month.hours} hours.
          ${month.prerequisites.length ? `Prerequisite: core month ${month.prerequisites[0]} and earlier core checks.` : "No prior programming knowledge required."}</p>
          <p><strong>Tools:</strong> ${month.tools.map((tool) => `${escape(tool.name)} (${month.priority === "P2" ? "optional" : tool.essential ? "core" : "supporting"}; ${tool.jobCount ? `${tool.share}% of platform JDs` : "curriculum foundation, no recorded demand"})`).join(", ")}</p>
          ${list(month.topics)}<p><strong>Project:</strong> ${escape(month.project)}</p>
          <p><strong>Completion checks:</strong></p>${list(month.checks)}</section>`).join("")}`).join("")}
      <h2>Other JD tools: defer</h2><p>Not additional prerequisites; pick alternatives only for a target job or project.</p>
      <p>${roadmap.additionalTools.map((tool) => `${escape(tool.name)} (${tool.share}%)`).join(", ") || "No additional tools in this batch."}</p>`;
  } else {
    const role = analysis.report.recommendations.find((item) => item.role === type);
    if (!role) throw new JdError("This role is not available in the saved report.", 404);
    title = `${role.title} - tool learning recommendations`;
    content = `<p>${role.totalJobs} reviewed jobs. Share = distinct jobs mentioning a tool / reviewed jobs in this role.
      Known aliases count once per job. Ranked by job count, with alphabetical ties.
      AI Solution Architect uses the AI Architect classification.</p>
      <p>These are observations from this batch, not a market-wide forecast, personal skill-gap assessment
      or prerequisite sequence. Only recognized concrete names are included.</p>
      <table><thead><tr><th>Priority</th><th>Tool / language / service</th><th>Type</th><th>Jobs</th><th>Share</th></tr></thead><tbody>
      ${role.tools.map((tool) => `<tr><td>${tool.rank}</td><td>${escape(tool.name)}</td><td>${escape(tool.type)}</td><td>${tool.jobCount}</td><td>${tool.share}%</td></tr>`).join("") ||
        '<tr><td colspan="5">No recognized tools or reviewed jobs for this role in this batch.</td></tr>'}</tbody></table>
      <h2>Source evidence</h2>${role.tools.map((tool) => `<h3>${tool.rank}. ${escape(tool.name)}</h3>
        ${tool.evidence.map((source) => `<blockquote><strong>${escape(source.title)}</strong>
        <p>Job ID: ${escape(source.jobId)}</p><p>${escape(source.evidence)}</p></blockquote>`).join("") || "<p>No saved evidence quotes.</p>"}`).join("")}`;
  }
  return {
    filename: `${label}-${type}.pdf`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(title)}</title>
      <style>@page{size:A4;margin:18mm}body{font:11pt Arial,sans-serif;color:#17202a;line-height:1.45}
      h1{font-size:22pt}h2{font-size:16pt;margin-top:24px}h3{font-size:13pt}
      h1,h2,h3{break-after:avoid}p,li,td,th{overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:10pt}
      th,td{padding:7px;border:1px solid #ccd1d1;text-align:left;vertical-align:top}
      thead{display:table-header-group}tr{break-inside:avoid}blockquote{border-left:3px solid #ccd1d1;margin:12px 0;padding-left:12px}
      .metadata{font-size:10pt;color:#455}li{margin:4px 0}</style></head><body>
      <h1>${escape(title)}</h1><div class="metadata"><p>${escape(analysis.name)}<br>${escape(label)}<br>
      Saved: ${escape(savedAt)}</p></div>
      <p>Frozen batch report; later job edits do not change this download.
      ${analysis.progress?.failed ? `${analysis.progress.failed} files failed; this is a partial batch.` : ""}</p>
      ${content}</body></html>`
  };
}

export async function generateAnalysisPdf(analysis, type) {
  const document = analysisPdfDocument(analysis, type);
  const browser = await chromium.launch({ chromiumSandbox: true, timeout: 10000 });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, offline: true, serviceWorkers: "block" });
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(document.html, { waitUntil: "domcontentloaded", timeout: 10000 });
    const buffer = await page.pdf({ format: "A4", printBackground: true, timeout: 30000 });
    return { filename: document.filename, buffer };
  } finally {
    await browser.close();
  }
}
