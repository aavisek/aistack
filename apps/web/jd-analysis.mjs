import { randomUUID } from "node:crypto";
import { JdError, masterTechnologies, sourceToolMentions } from "./jd.mjs";
import { platformLearningRoadmap } from "./jd-roadmap.mjs";
import { importHtmlJobs } from "./jd-html.mjs";

export function compareTrends(current, previous) {
  if (!previous) return [];
  const old = new Map(previous.map((item) => [item.name, item]));
  const fresh = new Map(current.map((item) => [item.name, item]));
  return [...new Set([...fresh.keys(), ...old.keys()])].map((name) => {
    const before = old.get(name)?.share ?? 0;
    const after = fresh.get(name)?.share ?? 0;
    return { name, oldShare: before, newShare: after, change: Math.round((after - before) * 10) / 10,
      oldJobs: old.get(name)?.jobCount ?? 0, newJobs: fresh.get(name)?.jobCount ?? 0 };
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change) || a.name.localeCompare(b.name));
}

export async function createAnalysis(store, name = `JD analysis ${new Date().toISOString().replace("T", " ").replace("Z", " UTC")}`) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) throw new JdError("Enter an analysis name (1-120 characters).");
  const id = randomUUID();
  await store.pool.query(`INSERT INTO jd_analyses(id,name,previous_id)
    VALUES($1,$2,(SELECT id FROM jd_analyses WHERE report IS NOT NULL AND state IN ('completed','completed-with-errors') ORDER BY created_at DESC,id DESC LIMIT 1))`, [id, name.trim()]);
  return id;
}

export async function saveAnalysisReport(store, id, scope = "batch") {
  const filters = new URLSearchParams({ analysis: id });
  const demand = await store.demand(filters);
  const recommendations = await store.toolRecommendations(filters);
  const jobRows = (await store.pool.query(`SELECT j.id,j.title,j.body,j.company,j.role_family AS "roleFamily",j.reviewed,
    count(m.technology_id)::int AS "technologyCount" FROM jd_analysis_jobs b
    JOIN job_descriptions j ON j.id=b.job_id LEFT JOIN jd_technology_mentions m ON m.job_id=j.id
    WHERE b.analysis_id=$1 GROUP BY j.id ORDER BY j.title`, [id])).rows;
  const previous = (await store.pool.query(`SELECT old.report,old.name,old.id FROM jd_analyses fresh
    JOIN jd_analyses old ON old.id=fresh.previous_id WHERE fresh.id=$1`, [id])).rows[0];
  const jobs = jobRows.map(({ body, ...job }) => job);
  const technologies = masterTechnologies([...demand.technologies, ...sourceToolMentions(jobRows.filter((job) => job.reviewed))].map((item) => ({
    name: item.name, category: item.category, aliases: [], jobIds: item.evidence.map((source) => source.jobId)
  })));
  const report = { scope, demand, recommendations, jobs, technologies,
    roadmap: platformLearningRoadmap(recommendations.find((role) => role.role === "ai-platform-architect")),
    previous: previous ? { id: previous.id, name: previous.name, totalJobs: previous.report.demand.totalJobs } : null,
    comparable: Boolean(previous && previous.report.demand.totalJobs && demand.totalJobs),
    trends: previous?.report.demand.totalJobs && demand.totalJobs ? compareTrends(demand.technologyBreakdown, previous.report.demand.technologyBreakdown) : [],
    roleTrends: recommendations.map((role) => ({
      title: role.title, totalJobs: role.totalJobs,
      previousJobs: previous?.report.recommendations.find((old) => old.role === role.role)?.totalJobs ?? null,
      trends: role.totalJobs && previous?.report.recommendations.find((old) => old.role === role.role)?.totalJobs
        ? compareTrends(role.tools, previous.report.recommendations.find((old) => old.role === role.role).tools) : []
    }))
  };
  await store.pool.query("UPDATE jd_analyses SET report=$2 WHERE id=$1", [id, JSON.stringify(report)]);
  return report;
}

export async function snapshotSavedJobs(store, name) {
  const id = await createAnalysis(store, name);
  try {
    await store.pool.query("UPDATE jd_analyses SET previous_id=NULL WHERE id=$1", [id]);
    await store.pool.query("INSERT INTO jd_analysis_jobs(analysis_id,job_id) SELECT $1,id FROM job_descriptions", [id]);
    const count = (await store.pool.query("SELECT count(*)::int AS total FROM jd_analysis_jobs WHERE analysis_id=$1", [id])).rows[0].total;
    if (!count) throw new JdError("No saved jobs are available to snapshot.");
    await saveAnalysisReport(store, id, "saved-collection");
    const progress = { state: "completed", sourceType: "saved-collection", total: count, processed: count, jobs: 0, reused: count, failed: 0, errors: [] };
    await store.pool.query("UPDATE jd_analyses SET state=$2,progress=$3 WHERE id=$1", [id, progress.state, JSON.stringify(progress)]);
    return id;
  } catch (error) {
    await store.pool.query("UPDATE jd_analyses SET state='failed',report=NULL,progress=$2 WHERE id=$1",
      [id, JSON.stringify({ state: "failed", errors: [{ message: "Saved-collection snapshot failed. Check server logs." }] })]);
    throw error;
  }
}

export async function runAnalysis(store, processor, files, progress, id) {
  try {
    await importHtmlJobs(processor, store, files, progress, id);
    const count = (await store.pool.query("SELECT count(*)::int AS total FROM jd_analysis_jobs WHERE analysis_id=$1", [id])).rows[0].total;
    if (!count) {
      progress.state = "failed";
      progress.errors.push({ message: "No jobs were included; no report or trend comparison was generated." });
    } else {
      await saveAnalysisReport(store, id);
    }
  } catch (error) {
    console.error("JD analysis generation failed:", error.message);
    progress.state = "failed";
    progress.errors.push({ message: "Analysis generation failed. Check server logs and create a new analysis to retry." });
  } finally {
    await store.pool.query("UPDATE jd_analyses SET state=$2,progress=$3 WHERE id=$1", [id, progress.state, JSON.stringify(progress)]);
  }
}
