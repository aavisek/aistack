import pg from "pg";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { JdError, normalizeName, roles, validateDate, validateJob, learningPlan, extractTechnologies } from "./jd.mjs";
import { naukriUrl, naukriFingerprint } from "./jd-naukri.mjs";

export class JdStore {
  constructor(databaseUrl) {
    this.pool = new pg.Pool({ connectionString: databaseUrl, max: 4, connectionTimeoutMillis: 5000 });
    this.pool.on("error", (error) => console.error("JD database connection failed:", error.message));
  }

  async migrate() {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(724019)");
      await client.query(await readFile(new URL("../../infra/postgres/001-jd.sql", import.meta.url), "utf8"));
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() { await this.pool.end(); }

  async hasScreenshot(hash) {
    const result = await this.pool.query("SELECT 1 FROM jd_screenshots WHERE content_hash = $1 AND status = 'ready'", [hash]);
    return result.rowCount > 0;
  }

  async saveScreenshot(hash, sourcePath, text, failure) {
    await this.pool.query(`INSERT INTO jd_screenshots (id,content_hash,source_path,extracted_text,status,error)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (content_hash) DO UPDATE
      SET extracted_text=EXCLUDED.extracted_text,status=EXCLUDED.status,error=EXCLUDED.error
      WHERE jd_screenshots.status='failed'`,
    [randomUUID(), hash, sourcePath, text, failure ? "failed" : "ready", failure]);
  }

  async screenshots() {
    return (await this.pool.query(`SELECT s.id,s.source_path AS "sourcePath",s.extracted_text AS text,s.status,s.error,
      s.collected_at AS "collectedAt",p.job_id AS "jobId",p.page_order AS "pageOrder"
      FROM jd_screenshots s LEFT JOIN jd_pages p ON p.screenshot_id=s.id ORDER BY s.source_path`)).rows;
  }

  async aiSourceScreenshots() {
    return (await this.pool.query(`SELECT id,source_path AS "sourcePath",content_hash AS "contentHash",
      extracted_text AS text
      FROM jd_screenshots WHERE status='ready' ORDER BY source_path`)).rows;
  }

  async aiJobs() {
    return (await this.pool.query(`SELECT id,title,company,role_family AS "roleFamily",
      source_folder AS "sourceFolder",left(body,1200) AS summary FROM job_descriptions
      WHERE processing_mode='ai-automatic' ORDER BY updated_at DESC`)).rows;
  }

  async jobs() {
    return (await this.pool.query(`SELECT j.id,j.title,j.company,j.role_family AS "roleFamily",j.reviewed,
      to_char(j.collected_on,'YYYY-MM-DD') AS "collectedOn",count(m.technology_id)::int AS "technologyCount"
      FROM job_descriptions j LEFT JOIN jd_technology_mentions m ON m.job_id=j.id GROUP BY j.id ORDER BY j.updated_at DESC`)).rows;
  }

  async suggest(text) {
    const learned = (await this.pool.query(`SELECT t.name,t.category,array_agg(a.alias) AS aliases
      FROM technologies t JOIN technology_aliases a ON a.technology_id=t.id GROUP BY t.id`)).rows;
    return extractTechnologies(text, learned);
  }

  async job(id) {
    const result = await this.pool.query(`SELECT id,title,company,role_family AS "roleFamily",reviewed,body,source_url AS "sourceUrl",
      to_char(posted_on,'YYYY-MM-DD') AS "postedOn",to_char(collected_on,'YYYY-MM-DD') AS "collectedOn"
      FROM job_descriptions WHERE id=$1`, [id]);
    if (!result.rows[0]) throw new JdError("Job not found.", 404);
    const pages = await this.pool.query("SELECT screenshot_id AS id FROM jd_pages WHERE job_id=$1 ORDER BY page_order", [id]);
    const mentions = await this.pool.query(`SELECT t.name,t.category,m.requirement,m.evidence
      FROM jd_technology_mentions m JOIN technologies t ON t.id=m.technology_id WHERE m.job_id=$1 ORDER BY t.name`, [id]);
    return { ...result.rows[0], screenshotIds: pages.rows.map((row) => row.id), technologies: mentions.rows };
  }

  async saveJob(id, input, create = false) {
    const job = validateJob(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (!create) {
        const existing = await client.query("SELECT id FROM job_descriptions WHERE id=$1 FOR UPDATE", [id]);
        if (!existing.rowCount) throw new JdError("Job not found.", 404);
      }

      if (job.screenshotIds.length) {
        const pages = await client.query("SELECT id,status FROM jd_screenshots WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE", [job.screenshotIds]);
        if (pages.rowCount !== job.screenshotIds.length || pages.rows.some((row) => row.status !== "ready")) throw new JdError("All selected screenshots must exist and have successful OCR.");
        const assigned = await client.query("SELECT 1 FROM jd_pages WHERE screenshot_id=ANY($1::uuid[]) AND job_id<>$2", [job.screenshotIds, id]);
        if (assigned.rowCount) throw new JdError("A screenshot belongs to another job. Edit that job to release it first.", 409);
      }
      await client.query(`INSERT INTO job_descriptions (id,title,company,role_family,posted_on,collected_on,reviewed,body)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET title=$2,company=$3,
        role_family=$4,posted_on=$5,collected_on=$6,reviewed=$7,body=$8,updated_at=now()`,
      [id, job.title, job.company, job.roleFamily, job.postedOn, job.collectedOn, job.reviewed, job.body]);
      await client.query("DELETE FROM jd_pages WHERE job_id=$1", [id]);
      for (const [order, screenshotId] of job.screenshotIds.entries()) {
        await client.query("INSERT INTO jd_pages(screenshot_id,job_id,page_order) VALUES ($1,$2,$3)", [screenshotId, id, order]);
      }
      await client.query("DELETE FROM jd_technology_mentions WHERE job_id=$1", [id]);
      for (const item of job.technologies) {
        const technology = await client.query(`INSERT INTO technologies(id,name,normalized_name,category) VALUES ($1,$2,$3,$4)
          ON CONFLICT(normalized_name) DO UPDATE SET normalized_name=EXCLUDED.normalized_name RETURNING id`,
        [randomUUID(), item.name, normalizeName(item.name), item.category]);
        const technologyId = technology.rows[0].id;
        for (const alias of item.aliases) {
          await client.query("INSERT INTO technology_aliases(alias,technology_id) VALUES ($1,$2) ON CONFLICT(alias) DO NOTHING", [normalizeName(alias), technologyId]);
        }
        await client.query("INSERT INTO jd_technology_mentions(job_id,technology_id,evidence,requirement) VALUES ($1,$2,$3,$4)",
          [id, technologyId, item.evidence, item.requirement]);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return this.job(id);
  }

  async saveAiJob(input) {
    const sourceUrl = input.sourceUrl ? naukriUrl(input.sourceUrl) : null;
    if ((!input.screenshotIds.length && !sourceUrl) || !input.technologies.length) throw new JdError("AI result must contain a source and technologies.", 502);
    if (sourceUrl && (input.screenshotIds.length || input.jobId)) throw new JdError("URL imports cannot replace screenshot jobs.", 502);
    const fingerprint = sourceUrl ? naukriFingerprint(sourceUrl) : normalizeName([...input.screenshotIds].sort().join(","));
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const existing = input.jobId
        ? await client.query("SELECT id FROM job_descriptions WHERE id=$1 FOR UPDATE", [input.jobId])
        : await client.query("SELECT id FROM job_descriptions WHERE source_fingerprint=$1 FOR UPDATE", [fingerprint]);
      const id = existing.rows[0]?.id ?? randomUUID();
      const pages = await client.query("SELECT id,status FROM jd_screenshots WHERE id=ANY($1::uuid[]) FOR UPDATE", [input.screenshotIds]);
      if (pages.rowCount !== input.screenshotIds.length || pages.rows.some((row) => row.status !== "ready")) throw new JdError("AI selected invalid screenshot pages.", 502);
      const assigned = await client.query(`SELECT p.job_id,j.processing_mode,j.reviewed FROM jd_pages p
        JOIN job_descriptions j ON j.id=p.job_id WHERE p.screenshot_id=ANY($1::uuid[]) AND p.job_id<>$2`, [input.screenshotIds, id]);
      const draftJobs = [...new Set(assigned.rows.filter((row) => row.processing_mode === "manual" && !row.reviewed).map((row) => row.job_id))];
      for (const draftJob of draftJobs) await client.query("DELETE FROM job_descriptions WHERE id=$1", [draftJob]);
      if (assigned.rows.some((row) => !draftJobs.includes(row.job_id))) throw new JdError("AI assigned a screenshot to an already reviewed job.", 502);
      const conflict = input.jobId ? "(id)" : "(source_fingerprint) WHERE source_fingerprint IS NOT NULL";
      await client.query(`INSERT INTO job_descriptions
        (id,title,company,role_family,reviewed,body,source_fingerprint,source_folder,processing_mode,ai_confidence,source_url)
        VALUES ($1,$2,$3,$4,true,$5,$6,$7,'ai-automatic',$8,$9)
        ON CONFLICT ${conflict} DO UPDATE SET title=$2,company=$3,role_family=$4,reviewed=true,
        body=$5,source_fingerprint=$6,source_folder=$7,processing_mode='ai-automatic',ai_confidence=$8,source_url=$9,updated_at=now()`,
      [id, input.title, input.company, input.roleFamily, input.body, fingerprint, input.sourceFolder, input.confidence, sourceUrl]);
      await client.query("DELETE FROM jd_pages WHERE job_id=$1", [id]);
      for (const [order, screenshotId] of input.screenshotIds.entries()) {
        await client.query("INSERT INTO jd_pages(screenshot_id,job_id,page_order) VALUES ($1,$2,$3)", [screenshotId, id, order]);
      }
      await client.query("DELETE FROM jd_technology_mentions WHERE job_id=$1", [id]);
      for (const item of input.technologies) {
        const technology = await client.query(`INSERT INTO technologies(id,name,normalized_name,category) VALUES ($1,$2,$3,$4)
          ON CONFLICT(normalized_name) DO UPDATE SET category=EXCLUDED.category RETURNING id`,
        [randomUUID(), item.name, normalizeName(item.name), item.category]);
        const technologyId = technology.rows[0].id;
        await client.query("INSERT INTO technology_aliases(alias,technology_id) VALUES ($1,$2) ON CONFLICT(alias) DO NOTHING", [normalizeName(item.name), technologyId]);
        await client.query(`INSERT INTO jd_technology_mentions(job_id,technology_id,evidence,requirement,confidence)
          VALUES ($1,$2,$3,$4,$5)`, [id, technologyId, item.evidence, item.requirement, item.confidence]);
      }
      await client.query("COMMIT");
      return this.job(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async demand(params) {
    const role = params.get("role") || null;
    if (role && !roles.includes(role)) throw new JdError("Invalid role filter.");
    const from = params.get("from") ? validateDate(params.get("from"), "From") : null;
    const to = params.get("to") ? validateDate(params.get("to"), "To") : null;
    if (from && to && from > to) throw new JdError("From must be on or before To.");
    const values = [role, from, to];
    const filter = "j.reviewed AND ($1::text IS NULL OR j.role_family=$1) AND ($2::date IS NULL OR j.collected_on >= $2) AND ($3::date IS NULL OR j.collected_on <= $3)";
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const total = (await client.query(`SELECT count(*)::int AS total FROM job_descriptions j WHERE ${filter}`, values)).rows[0].total;
      const areas = (await client.query(`SELECT t.category AS area,count(DISTINCT j.id)::int AS "jobCount",
        count(DISTINCT t.id)::int AS "technologyCount"
        FROM jd_technology_mentions m JOIN job_descriptions j ON j.id=m.job_id
        JOIN technologies t ON t.id=m.technology_id WHERE ${filter}
        GROUP BY t.category ORDER BY count(DISTINCT j.id) DESC,count(DISTINCT t.id) DESC,t.category`, values)).rows
        .map((item, index) => ({ rank: index + 1, ...item, share: total ? Math.round(item.jobCount / total * 1000) / 10 : 0 }));
      const technologies = (await client.query(`SELECT t.id,t.name,t.category,count(*)::int AS "jobCount",
        count(*) FILTER(WHERE m.requirement='required')::int AS "requiredCount",
        count(*) FILTER(WHERE m.requirement='preferred')::int AS "preferredCount",
        json_agg(json_build_object('jobId',j.id,'title',j.title,'evidence',m.evidence) ORDER BY j.title) AS evidence
        FROM jd_technology_mentions m JOIN job_descriptions j ON j.id=m.job_id JOIN technologies t ON t.id=m.technology_id
        WHERE ${filter} GROUP BY t.id ORDER BY count(*) DESC,t.name`, values)).rows
        .map((item) => ({ ...item, share: total ? Math.round(item.jobCount / total * 1000) / 10 : 0 }));
      await client.query("COMMIT");
      return { totalJobs: total, areas, technologies, learningPlan: learningPlan(technologies) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
