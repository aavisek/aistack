(() => {
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const roleNames = { "ai-architect": "AI Architect", "ai-platform-architect": "AI Platform Architect", other: "Other", unclassified: "Unclassified" };
  let generation = 0;
  let timer;
  const analysisLabel = (analysis) => `JD-${analysis.createdAt.slice(0, 10).replace(/-/g, "")}-${analysis.id}`;
  const newAnalysisName = () => `JD analysis ${new Date().toISOString().replace("T", " ").replace("Z", " UTC")}`;

  async function api(path, method = "GET", data) {
    const response = await fetch(`/api/jd${path}`, {
      method,
      headers: data === undefined ? {} : { "content-type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || `JD request failed (${response.status}).`);
    return result.data;
  }

  function demandMarkup(demand) {
    return `<p>${demand.totalJobs} reviewed jobs in this selection. Percentage = distinct jobs mentioning a technology / selected reviewed jobs.
      These are observations from your collection, not a market-wide forecast. Dates filter collection date, not posting date.</p>
      <div class="jd-table-scroll"><table><caption>Demand in your collected JDs</caption><thead><tr><th>Technology / area</th><th>Distinct jobs</th><th>Share</th><th>Required / preferred</th><th>Evidence</th></tr></thead><tbody>
      ${demand.technologies.map((item) => `<tr><td><strong>${escape(item.name)}</strong><small>${escape(item.category)}</small></td><td>${item.jobCount}</td><td>${item.share}%</td><td>${item.requiredCount} / ${item.preferredCount}</td>
      <td><details><summary>View sources</summary>${item.evidence.map((source) => `<blockquote><button class="link" data-edit-job="${escape(source.jobId)}">${escape(source.title)}</button><p>${escape(source.evidence)}</p></blockquote>`).join("")}</details></td></tr>`).join("") || '<tr><td colspan="5">No reviewed jobs in this batch.</td></tr>'}
      </tbody></table></div>
      <h3>Languages, tools, cloud platforms and databases by percentage</h3>
      <p>Exact recorded technology names and broad concepts, grouped by type and ranked by share within each group. Share = distinct jobs mentioning the entry / ${demand.totalJobs} selected reviewed jobs. Entries can overlap, so percentages do not add up to 100%. Generic database types do not imply a specific database product.</p>
      <div class="jd-table-scroll"><table><caption>Technology names and concepts by type</caption><thead><tr><th>Type</th><th>Name</th><th>Distinct jobs</th><th>Share of JDs</th></tr></thead>
      ${["Languages", "Cloud platforms and services", "Databases and database types", "Tools, frameworks and capabilities"].map((type) => {
        const entries = demand.technologyBreakdown.filter((item) => item.type === type);
        return `<tbody>${entries.map((item, index) => `<tr>${index === 0 ? `<th scope="rowgroup" rowspan="${entries.length}">${escape(type)}</th>` : ""}<th scope="row">${escape(item.name)}</th><td>${item.jobCount}</td><td><strong>${item.share}%</strong></td></tr>`).join("") || `<tr><th scope="row">${escape(type)}</th><td colspan="3">No entries in the selected JDs.</td></tr>`}</tbody>`;
      }).join("")}
      </table></div>
      <h3>Technology area ranking</h3><p>Ranked by the number of distinct reviewed jobs mentioning at least one technology in the area. A job contributes at most once to each area.</p>
      <div class="jd-table-scroll"><table><caption>Ranked technology areas</caption><thead><tr><th>Rank</th><th>Area</th><th>Distinct jobs</th><th>Share</th><th>Technologies found</th></tr></thead><tbody>
      ${demand.areas.map((area) => `<tr><td><strong>#${area.rank}</strong></td><td>${escape(area.area)}</td><td>${area.jobCount}</td><td>${area.share}%</td><td>${area.technologyCount}</td></tr>`).join("") || '<tr><td colspan="5">No ranked areas yet.</td></tr>'}
      </tbody></table></div>`;
  }

  function recommendationsMarkup(recommendations) {
    return `<h3>Role-specific tool learning recommendations</h3>
      <p>Learn the most frequently mentioned concrete tools first. Each list checks recorded mentions and original JD text for recognized tool names, using only this saved analysis's reviewed jobs in that role. AI Solution Architect uses the existing AI Architect classification. Known aliases count once per job; concepts and tools with no mentions are excluded. This is JD-demand prioritization, not a personal skill-gap assessment or prerequisite sequence.</p>
      ${recommendations.map((role) => `<section><h4>${escape(role.title)}</h4><button class="secondary" data-pdf-type="${escape(role.role)}">Download ${escape(role.title)} PDF</button><p>${role.totalJobs} reviewed jobs. Share = distinct jobs mentioning the tool / reviewed jobs for this role. Ties are alphabetical.</p>
        <div class="jd-table-scroll"><table><caption>${escape(role.title)} tool learning priorities</caption><thead><tr><th>Priority</th><th>Tool / language / service</th><th>Type</th><th>Distinct jobs</th><th>Share</th><th>Evidence</th></tr></thead><tbody>
        ${role.tools.map((item) => `<tr><td>${item.rank}</td><th scope="row">${escape(item.name)}</th><td>${escape(item.type)}</td><td>${item.jobCount}</td><td>${item.share}%</td><td><details><summary>View sources</summary>${item.evidence.map((source) => `<blockquote><button class="link" data-edit-job="${escape(source.jobId)}">${escape(source.title)}</button><p>${escape(source.evidence)}</p></blockquote>`).join("")}</details></td></tr>`).join("") || `<tr><td colspan="6">${role.totalJobs ? "No recognized concrete tools in this saved analysis's reviewed jobs." : "This saved analysis contains no reviewed jobs for this role. Open the original saved-collection snapshot in All saved analyses to see previously collected jobs."}</td></tr>`}
        </tbody></table></div></section>`).join("")}`;
  }

  function roadmapMarkup(roadmap) {
    return `<h2>${escape(roadmap.title)}</h2>
      <button class="secondary" data-pdf-type="roadmap">Download learning roadmap PDF</button>
      <p>${escape(roadmap.startingPoint)}; ${roadmap.weeklyHours} hours/week. Plan: ${roadmap.plannedWeeks} study weeks in 24 four-week blocks plus ${roadmap.bufferWeeks} weeks for catch-up, breaks and job applications (${roadmap.totalHours} hours over approximately two years). Repeat a month if its completion checks are not met.</p>
      <p><strong>Minimum job-ready path:</strong> complete P0 and P1; defer P2. Use Python, Azure, PostgreSQL/pgvector and LangGraph as the primary stack. Learn supporting tools only to implement the project, not to master every product. There are ${roadmap.months.filter((month) => month.priority !== "P2").length} core monthly blocks; optional blocks can become revision or application time. Start junior-role applications at the month-18 checkpoint if you can demonstrate the checks; strengthen your portfolio in months 22-23.</p>
      <p>Two years can build practical junior backend/platform/AI engineering skills. AI Platform Architect is a longer-term direction requiring production experience and architectural judgment; this plan does not guarantee employment or architect seniority. Cloud and model labs may incur charges: use budgets, synthetic/non-sensitive data and tear down unused resources.</p>
      <h3>Priority levels</h3><ul>${roadmap.priorities.map((priority) => `<li><strong>${priority.code}: ${escape(priority.title)}</strong> - ${escape(priority.description)}</li>`).join("")}</ul>
      <h3>Weekly routine: 16 hours</h3><ul>${roadmap.weeklySchedule.map((item) => `<li>${item.hours} hours: ${escape(item.activity)}</li>`).join("")}</ul>
      <h3>Minimum working toolkit</h3><p>Working familiarity, not certification-level mastery of every tool. Core foundations remain necessary even when absent from the ${roadmap.reviewedJobs} reviewed platform JDs. Demand percentages guide practice emphasis, not prerequisites.</p>
      <p>${roadmap.minimumToolkit.map((tool) => escape(tool.name)).join(", ")}</p>
      <h3>Readiness checkpoints</h3><ul>${roadmap.readiness.map((checkpoint) => `<li><strong>Month ${checkpoint.month}: ${escape(checkpoint.target)}</strong> - ${escape(checkpoint.criteria)}</li>`).join("")}</ul>
      <h3>Month-by-month projects</h3>
      <p>Role buckets group learning scope, not attained job titles. P0/P1/P2 priorities still apply within every bucket.</p>
      ${roadmap.buckets.map((bucket) => `<section class="jd-roadmap-bucket" aria-labelledby="jd-bucket-${bucket.id}">
        <h3 id="jd-bucket-${bucket.id}">${escape(bucket.title)} bucket - months ${bucket.fromMonth}-${bucket.toMonth}</h3>
        <p>${escape(bucket.goal)}</p><p><strong>Readiness evidence:</strong> ${escape(bucket.experience)}</p>
        ${roadmap.months.filter((month) => month.bucket === bucket.id).map((month) => `<details class="jd-roadmap-month" ${month.month === 1 ? "open" : ""}><summary><strong>Month ${month.month} - ${escape(month.title)}</strong> | ${month.priority} ${month.priority === "P2" ? "(optional)" : "(core)"}</summary>
        <p>${escape(month.phase)}; ${month.hours} planned hours. ${month.prerequisites.length ? `Prerequisite: complete core month ${month.prerequisites[0]} and earlier core checks.` : "No prior programming knowledge required."}</p>
        <p><strong>Tools:</strong> ${month.tools.map((tool) => `${escape(tool.name)} (${month.priority === "P2" ? "optional" : tool.essential ? "core" : "supporting, learn as needed"}; ${tool.jobCount ? `${tool.share}% of platform JDs` : "curriculum foundation, no recorded demand"})`).join(", ")}</p>
        <ul>${month.topics.map((topic) => `<li>${escape(topic)}</li>`).join("")}</ul>
        <p><strong>Project:</strong> ${escape(month.project)}</p>
        <p><strong>Completion checks:</strong></p><ul>${month.checks.map((check) => `<li>${escape(check)}</li>`).join("")}</ul>
      </details>`).join("")}</section>`).join("")}
      <details><summary>Other JD tools: defer, do not learn them all</summary><p>These are not prerequisites or additional mandatory modules. Pick an alternative only for a target job or project, after the primary stack works.</p><p>${roadmap.additionalTools.map((tool) => `${escape(tool.name)} (${tool.share}%)`).join(", ") || "No additional tools in the selected platform JDs."}</p></details>`;
  }

  function trendMarkup(analysis) {
    if (!analysis) return "";
    const report = analysis.report;
    const table = (title, rows) => `<h4>${escape(title)}</h4><div class="jd-table-scroll"><table><caption>${escape(title)} trend comparison</caption><thead><tr><th>Name</th><th>Old jobs</th><th>Old share</th><th>New jobs</th><th>New share</th><th>Change (percentage points)</th></tr></thead><tbody>${rows.map((item) => `<tr><th scope="row">${escape(item.name)}</th><td>${item.oldJobs}</td><td>${item.oldShare}%</td><td>${item.newJobs}</td><td>${item.newShare}%</td><td>${item.change > 0 ? "+" : ""}${item.change}</td></tr>`).join("") || '<tr><td colspan="6">No comparable entries.</td></tr>'}</tbody></table></div>`;
    return `<section class="panel jd-panel"><h2>Analysis: ${escape(analysis.name)}</h2>
      <p><strong>${escape(analysisLabel(analysis))}</strong><br>Saved: ${escape(new Date(analysis.createdAt).toLocaleString())} (date in ID: UTC)</p>
      <p>${report.scope === "saved-collection" ? "Original saved-collection snapshot. Includes all jobs saved at snapshot creation, without rerunning AI." : "Saved batch report. Only jobs from this upload are included; existing jobs are reused, not added twice."}
      ${report.jobs.length} included jobs; ${report.demand.totalJobs} reviewed.
      ${report.recommendations.map((role) => `${escape(role.title)}: ${role.totalJobs}`).join("; ")}.
      Reports stay unchanged when later jobs are imported or edited. Opening a report or downloading a PDF does not rerun AI.
      ${analysis.progress?.failed ? `${analysis.progress.failed} files failed; this is a partial batch.` : ""}</p>
      ${report.previous ? `<p>Compared with <a href="#jd/${escape(report.previous.id)}">${escape(report.previous.name)}</a>: ${report.previous.totalJobs} previous reviewed jobs versus ${report.demand.totalJobs} new reviewed jobs. Percentages use each batch's own denominator. These are collection observations, not market trends; differences may reflect sample size, source or role mix.</p>
        ${(report.comparable ?? Boolean(report.previous.totalJobs && report.demand.totalJobs)) ? table("All reviewed jobs", report.trends) : "<p>Cannot compare percentages: one batch has no reviewed jobs.</p>"}
        ${report.roleTrends.map((role) => `<p>${escape(role.title)}: ${role.previousJobs ?? 0} old versus ${role.totalJobs} new reviewed jobs.</p>${role.previousJobs && role.totalJobs ? table(role.title, role.trends) : "<p>No comparable reviewed-job sample for this role in both batches.</p>"}`).join("")}`
        : report.scope === "saved-collection" ? "<p>Original collection saved as a separate baseline. The one-file batch remains unchanged.</p>"
        : "<p>First completed batch: baseline saved. Upload a new batch to generate a comparison. Existing cumulative jobs are not a previous batch.</p>"}</section>`;
  }

  async function open(container) {
    const current = ++generation;
    clearTimeout(timer);
    const route = location.hash;
    const selectedAnalysis = route.startsWith("#jd/") ? route.slice(4) : null;
    const active = () => current === generation && location.hash === route && (route === "#jd" || route.startsWith("#jd/"));
    container.innerHTML = '<section class="panel empty" role="status">Loading JD Intelligence...</section>';
    try {
      const [status, analyses, analysis] = await Promise.all([api("/status"), api("/analyses"), selectedAnalysis ? api(`/analyses/${encodeURIComponent(selectedAnalysis)}`) : Promise.resolve(null)]);
      if (analysis && !analysis.report) throw new Error("This analysis has no completed report. Select another analysis or create a new one.");
      const { jobs = [], demand, technologies = [], recommendations, roadmap } = analysis?.report ?? {};
      let screenshots = [];
      if (!active()) return;
      let uploading = false;
      let editingId = null;
      let pageIds = [];
      const selectedTechnologies = new Set();
      container.innerHTML = `<div class="jd-view">
        <div class="view-title"><span class="eyebrow">Evidence-led learning</span><h1>JD Intelligence</h1><p>Create a dated analysis or open a saved report by its unique ID.</p></div>
        <p id="jd-message" role="status" aria-live="polite"></p>
        <section class="panel jd-panel"><h2>Analysis menu</h2>
          <button class="primary" id="jd-new">New analysis</button>
          ${analysis ? '<a href="#jd">All saved analyses</a>' : ""}
          <h3>Saved analyses</h3>
          <p>Click a unique ID to open that batch's saved report. Multiple analyses on the same day have different IDs. Dates in IDs use UTC.</p>
          <div class="jd-table-scroll"><table><caption>Analysis history</caption><thead><tr><th>Unique analysis ID</th><th>Name</th><th>Saved date / time</th><th>Status</th></tr></thead><tbody>
          ${analyses.map((item) => `<tr><th scope="row">${item.hasReport ? `<a href="#jd/${escape(item.id)}" ${selectedAnalysis === item.id ? 'aria-current="page"' : ""}>${escape(analysisLabel(item))}</a>` : escape(analysisLabel(item))}</th><td>${escape(item.name)}</td><td>${escape(new Date(item.createdAt).toLocaleString())}</td><td>${escape(item.state)}</td></tr>`).join("") || '<tr><td colspan="4">No saved analyses yet. Choose New analysis to create your first batch.</td></tr>'}
          </tbody></table></div>
          ${analyses.some((item) => !item.hasReport) ? "<p>Runs without a completed report cannot be opened. If a run was interrupted by a restart, create a new analysis; saved jobs will be reused.</p>" : ""}
          <form id="jd-new-form" hidden>
            <h3>New JD batch analysis</h3>
            <label>Automatic analysis name (UTC)<input id="jd-analysis-name" readonly value="${escape(newAnalysisName())}"></label>
            <label>Saved Naukri or LinkedIn job HTML files<input id="jd-analysis-files" type="file" multiple accept=".html,.htm,text/html" required></label>
            <p>Expand the full JD before saving. Up to 100 HTML files, 2 MB each and 10 MB total. Scripts and network requests are disabled. New JD text is sent to Azure AI; matching jobs are reused without another AI request. Each batch is compared with the previous completed batch, not the cumulative collection. Unsupported LinkedIn layouts fail visibly.</p>
            <button class="primary" type="submit" id="jd-analysis-generate">Generate analysis and trends</button>
          </form>
          <p id="jd-ai-progress" role="status" aria-live="polite"></p><div id="jd-import-errors"></div>
        </section>
        ${analysis ? `
        ${trendMarkup(analysis)}
        <section class="panel jd-panel"><h2>Technology master list for learning modules</h2>
          <p>Concrete product, tool, framework, language, cloud service and database names only. Ranked by ${analysis ? "this batch's reviewed-job count" : "distinct saved-job count, including drafts and recognized names in original source text"}, highest first; ties are alphabetical and unused entries appear last. Broad concepts and unrecognized extracted phrases are excluded; known aliases are merged. Select names to copy or download for your learning modules. Selections last until you refresh or leave this view.</p>
          <div class="jd-fields">
            <label>Search names and aliases<input id="jd-master-search" type="search" placeholder="AKS, Azure Foundry, PostgreSQL, LangGraph..."></label>
            <label>Technology type<select id="jd-master-type"><option value="">All types</option>${["Languages", "Cloud platforms and services", "Databases", "Tools and frameworks"].map((type) => `<option value="${escape(type)}">${escape(type)}</option>`).join("")}</select></label>
          </div>
          <button class="secondary" id="jd-master-select">Select matching entries</button>
          <button class="secondary" id="jd-master-clear">Clear selection</button>
          <button class="primary" id="jd-master-copy">Copy selected names</button>
          <button class="secondary" id="jd-master-export">Download selected names (.txt)</button>
          <p id="jd-master-summary" role="status" aria-live="polite"></p>
          <div class="jd-table-scroll" id="jd-master-table"></div>
        </section>
        <section class="panel jd-panel" id="jd-editor" hidden></section>
        <section class="panel jd-panel"><h2>Saved jobs</h2>
          <div class="jd-jobs">${jobs.map((job) => `<button class="secondary" data-edit-job="${escape(job.id)}">${escape(job.title)}${job.company ? ` - ${escape(job.company)}` : ""}<small>${escape(roleNames[job.roleFamily])} | ${job.reviewed ? "Reviewed" : "Draft"} | ${job.technologyCount} technologies</small></button>`).join("") || "<p>No jobs saved yet.</p>"}</div>
        </section>
        <section class="panel jd-panel"><h2>Demand and learning priorities</h2>
          <p>Saved batch results are frozen and include only this analysis's jobs.</p>
          <div id="jd-demand">${demandMarkup(demand)}</div>
          <div id="jd-recommendations">${recommendationsMarkup(recommendations)}</div>
        </section>
        <section class="panel jd-panel" id="jd-roadmap">${roadmapMarkup(roadmap)}</section>` : ""}
      </div>`;
      const message = (text, error = false) => {
        const element = container.querySelector("#jd-message");
        element.textContent = text;
        element.setAttribute("role", error ? "alert" : "status");
        element.classList.toggle("jd-error", error);
      };
      const run = async (operation) => {
        try { await operation(); }
        catch (error) {
          if (!active()) return;
          message(error.message, true);
          const editorMessage = container.querySelector("#jd-editor-message");
          if (editorMessage) {
            editorMessage.textContent = error.message;
            editorMessage.setAttribute("role", "alert");
            editorMessage.classList.add("jd-error");
          }
        }
      };
      function matchingTechnologies() {
        const search = container.querySelector("#jd-master-search").value.trim().toLowerCase();
        const type = container.querySelector("#jd-master-type").value;
        return technologies.filter((item) => (!type || item.type === type)
          && [item.name, ...item.aliases].some((name) => name.toLowerCase().includes(search)));
      }
      function renderMasterList() {
        const entries = matchingTechnologies();
        container.querySelector("#jd-master-summary").textContent = `${entries.length} of ${technologies.length} entries shown; ${selectedTechnologies.size} selected. ${analysis ? "Counts use only this batch's reviewed jobs." : "Saved-JD counts include reviewed jobs and drafts, independent of demand filters."}`;
        container.querySelector("#jd-master-table").innerHTML = `<table><caption>Master technology catalogue</caption><thead><tr><th>Select</th><th>Name</th><th>Type</th><th>Saved JDs</th><th>Source</th></tr></thead><tbody>${entries.map((item) => `<tr><td><label class="jd-check"><input type="checkbox" data-master-name="${escape(item.name)}" aria-label="Select ${escape(item.name)}" ${selectedTechnologies.has(item.name) ? "checked" : ""}></label></td><th scope="row">${escape(item.name)}</th><td>${escape(item.type)}</td><td>${item.jobCount}</td><td>${item.builtIn ? "Built-in catalogue" : "Saved JD"}${item.builtIn && item.jobCount ? " + saved JD" : ""}</td></tr>`).join("") || '<tr><td colspan="5">No matching entries.</td></tr>'}</tbody></table>`;
        container.querySelector("#jd-master-copy").disabled = !selectedTechnologies.size;
        container.querySelector("#jd-master-export").disabled = !selectedTechnologies.size;
      }
      function selectedNames() {
        if (!selectedTechnologies.size) throw new Error("Select at least one technology first.");
        return technologies.filter((item) => selectedTechnologies.has(item.name)).map((item) => item.name).join("\n") + "\n";
      }
      if (analysis) renderMasterList();
      function showStatus(next) {
        Object.assign(status, next);
        container.querySelector("#jd-import-errors").innerHTML = "";
        showAiProgress(next.aiProgress);
        const busy = uploading || next.progress.state === "running" || next.aiProgress.state === "running";
        for (const id of ["jd-analysis-generate", "jd-analysis-files", "jd-analysis-name"]) container.querySelector(`#${id}`).disabled = busy;
      }
      function showAiProgress(progress) {
        container.querySelector("#jd-ai-progress").textContent = `AI ${progress.state}: ${progress.processed}/${progress.total} ${progress.sourceType === "urls" ? "URLs processed" : progress.sourceType === "html" ? "HTML files processed" : "screenshots analyzed"}; ${progress.jobs} jobs saved, ${progress.reused ?? 0} reused, ${progress.failed} failed.${["urls", "html"].includes(progress.sourceType) ? ` ${progress.skipped ?? 0} duplicates skipped.` : ""}`;
        if (progress.errors.length) container.querySelector("#jd-import-errors").innerHTML += `<details open><summary>AI import errors</summary><ul>${progress.errors.map((error) => `<li>${escape(error.sourcePath || "")} ${escape(error.message)}</li>`).join("")}</ul></details>`;
        if (progress.duplicates?.length) container.querySelector("#jd-import-errors").innerHTML += `<details open><summary>Duplicates rejected</summary><ul>${progress.duplicates.map((item) => `<li>${escape(item.sourcePath)} ${escape(item.message)}</li>`).join("")}</ul></details>`;
      }
      async function poll() {
        if (!active()) return;
        try {
          const next = await api("/status");
          if (!active()) return;
          showStatus(next);
          if (next.progress.state === "running") timer = setTimeout(poll, 2000);
          else if (next.aiProgress.state === "running") timer = setTimeout(poll, 2000);
          else if (["urls", "html"].includes(next.aiProgress.sourceType)) {
            if (next.aiProgress.analysisId) {
              const completed = await api(`/analyses/${next.aiProgress.analysisId}`);
              if (completed.report) {
                location.hash = `#jd/${completed.id}`;
                return;
              }
            }
            await open(container);
            message("Analysis finished without a report. Check import errors and create a new analysis to retry.", next.aiProgress.failed > 0 || next.aiProgress.state === "failed");
          } else message("Import finished. Run AI import after OCR, or refresh lists to see saved jobs and demand.", next.progress.state === "failed" || next.progress.failed > 0 || next.aiProgress.state === "failed" || next.aiProgress.failed > 0);
        } catch (error) {
          if (active()) message(error.message, true);
        }
      }
      function editor(job) {
        editingId = job.id || null;
        pageIds = [...job.screenshotIds];
        const element = container.querySelector("#jd-editor");
        element.hidden = false;
        element.innerHTML = `<h2>${editingId ? "Edit" : "New"} job and technologies</h2>
          ${job.sourceUrl ? `<p>Source: <a href="${escape(job.sourceUrl)}" target="_blank" rel="noopener noreferrer">Original job listing</a></p>` : ""}
          <p>Verify title, role and page grouping against the originals. Keep posting date blank if unknown.
          All OCR text is preserved below; the catalogue is a starting point, not exhaustive extraction. Add missed or unfamiliar technologies manually.</p>
          <form id="jd-job-form">
            <div class="jd-fields"><label>Job title<input name="title" value="${escape(job.title)}" maxlength="300" required></label>
            <label>Company<input name="company" value="${escape(job.company)}" maxlength="300"></label>
            <label>Role family<select name="roleFamily">${Object.entries(roleNames).map(([value, name]) => `<option value="${value}" ${job.roleFamily === value ? "selected" : ""}>${name}</option>`).join("")}</select></label>
            <label>Collection date<input type="date" name="collectedOn" value="${escape(job.collectedOn)}" required></label>
            <label>Posting date (optional)<input type="date" name="postedOn" value="${escape(job.postedOn)}"></label></div>
            <details><summary id="jd-page-count">${pageIds.length} attached pages, in order</summary><ol id="jd-page-list"></ol>
              <p>Reorder or remove attachments here. Corrected JD text is kept unchanged unless you explicitly rebuild it.</p>
              <button type="button" class="secondary" id="jd-rebuild-text">Rebuild text and suggestions from attached pages</button>
              </details>
            <label>JD text (review or correct extracted text here)<textarea name="body" rows="14" maxlength="100000" required>${escape(job.body)}</textarea></label>
            <button type="button" class="secondary" id="jd-extract">Extract / reset technology suggestions from text</button>
            <label>Technologies: one per line as Name | Category | required, preferred or unspecified
              <textarea name="technologies" rows="12" spellcheck="false">${escape(job.technologies.map((item) => `${item.name} | ${item.category} | ${item.requirement}`).join("\n"))}</textarea></label>
            <p>Categories: ${status.categories.map(escape).join("; ")}. Each technology must match the JD text or a known alias. Requirement strength defaults to unspecified; change it only when the JD supports it.</p>
            <label class="jd-check"><input name="reviewed" type="checkbox" ${job.reviewed ? "checked" : ""}> I verified this is one distinct job, checked all technology mentions, and want it included in demand counts.</label>
            <button type="submit" class="primary">Save job</button> <button type="button" class="secondary" id="jd-cancel">Close editor</button>
            <p id="jd-editor-message" role="status" aria-live="polite"></p>
          </form>`;
        refreshPageList();
        element.querySelector("form").oninput = (event) => {
          if (event.target.name !== "reviewed") element.querySelector('[name="reviewed"]').checked = false;
        };
        element.scrollIntoView({ block: "start" });
      }
      function refreshPageList() {
        container.querySelector("#jd-page-count").textContent = `${pageIds.length} attached pages, in order`;
        container.querySelector("#jd-page-list").innerHTML = pageIds.map((id, index) => `<li>${escape(screenshots.find((image) => image.id === id)?.sourcePath || id)}
          <button type="button" class="secondary" data-page-index="${index}" data-page-move="-1" aria-label="Move page ${index + 1} up" ${index === 0 ? "disabled" : ""}>Up</button>
          <button type="button" class="secondary" data-page-index="${index}" data-page-move="1" aria-label="Move page ${index + 1} down" ${index === pageIds.length - 1 ? "disabled" : ""}>Down</button>
          <button type="button" class="secondary" data-page-remove="${index}" aria-label="Remove page ${index + 1}">Remove</button></li>`).join("");
      }
      container.onchange = (event) => {
        if (event.target.dataset?.masterName) {
          if (event.target.checked) selectedTechnologies.add(event.target.dataset.masterName);
          else selectedTechnologies.delete(event.target.dataset.masterName);
          renderMasterList();
          return;
        }
        if (event.target.id === "jd-master-type") { renderMasterList(); return; }
      };
      container.oninput = (event) => {
        if (event.target.id === "jd-master-search") renderMasterList();
      };
      // Handlers are replaced on re-entry rather than accumulating on the shared content element.
      container.onclick = (event) => {
        const button = event.target.closest("button");
        if (!button || button.disabled) return;
        return run(async () => {
          if (button.dataset.pdfType) {
            button.disabled = true;
            message("Generating PDF...");
            try {
              const type = button.dataset.pdfType;
              const response = await fetch(`/api/jd/analyses/${analysis.id}/pdf/${encodeURIComponent(type)}`);
              if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error?.message || `PDF download failed (${response.status}).`);
              }
              if (!response.headers.get("content-type")?.startsWith("application/pdf")) throw new Error("Server did not return a PDF.");
              const blob = await response.blob();
              if (!active()) return;
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${analysisLabel(analysis)}-${type}.pdf`;
              document.body.append(link);
              try { link.click(); }
              finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
              message("PDF downloaded from this saved analysis.");
            } finally { button.disabled = false; }
          }
          if (button.id === "jd-new") {
            container.querySelector("#jd-new-form").hidden = false;
            container.querySelector("#jd-analysis-name").value = newAnalysisName();
            container.querySelector("#jd-analysis-files").focus();
          }
          if (button.id === "jd-master-select") {
            for (const item of matchingTechnologies()) selectedTechnologies.add(item.name);
            renderMasterList();
          }
          if (button.id === "jd-master-clear") { selectedTechnologies.clear(); renderMasterList(); }
          if (button.id === "jd-master-copy") {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable. Download the selected names instead.");
            await navigator.clipboard.writeText(selectedNames());
            message(`${selectedTechnologies.size} technology names copied for your learning module.`);
          }
          if (button.id === "jd-master-export") {
            const url = URL.createObjectURL(new Blob([selectedNames()], { type: "text/plain;charset=utf-8" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = "learning-module-technologies.txt";
            document.body.append(link);
            try { link.click(); }
            finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
            message(`${selectedTechnologies.size} technology names exported.`);
          }
          if (button.dataset.editJob) {
            const [job, pages] = await Promise.all([api(`/jobs/${button.dataset.editJob}`), api("/screenshots")]);
            screenshots = pages;
            if (active()) editor(job);
          }
          if (button.id === "jd-cancel") container.querySelector("#jd-editor").hidden = true;
          if (button.dataset.pageMove !== undefined) {
            const index = Number(button.dataset.pageIndex);
            const target = index + Number(button.dataset.pageMove);
            [pageIds[index], pageIds[target]] = [pageIds[target], pageIds[index]];
            refreshPageList();
            container.querySelector('[name="reviewed"]').checked = false;
          }
          if (button.dataset.pageRemove !== undefined) {
            pageIds.splice(Number(button.dataset.pageRemove), 1);
            refreshPageList();
            container.querySelector('[name="reviewed"]').checked = false;
          }
          if (button.id === "jd-rebuild-text") {
            const replacementIds = pageIds;
            if (!replacementIds.length) throw new Error("Select or attach screenshots first.");
            const form = container.querySelector("#jd-job-form");
            const fields = new FormData(form);
            const text = replacementIds.map((id) => screenshots.find((image) => image.id === id).text).join("\n\n");
            editor({ id: editingId, title: fields.get("title"), company: fields.get("company"), roleFamily: fields.get("roleFamily"),
              collectedOn: fields.get("collectedOn"), postedOn: fields.get("postedOn"), reviewed: false, body: text, screenshotIds: replacementIds,
              technologies: await api("/extract", "POST", { text }) });
          }
          if (button.id === "jd-extract") {
            const form = container.querySelector("#jd-job-form");
            const technologies = await api("/extract", "POST", { text: form.elements.body.value });
            form.elements.technologies.value = technologies.map((item) => `${item.name} | ${item.category} | ${item.requirement}`).join("\n");
            form.elements.reviewed.checked = false;
          }
        });
      };
      container.onsubmit = (event) => {
        event.preventDefault();
        const form = event.target;
        return run(async () => {
          if (form.id === "jd-new-form") {
            const name = container.querySelector("#jd-analysis-name").value.trim();
            const files = [...(container.querySelector("#jd-analysis-files").files ?? [])];
            if (!name || name.length > 120) throw new Error("Enter an analysis name (1-120 characters).");
            if (!files.length || files.length > 100 || files.some((file) => !/\.html?$/i.test(file.name))) throw new Error("Select 1 to 100 HTML files.");
            if (files.some((file) => file.size > 2 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) throw new Error("HTML files must be at most 2 MB each and 10 MB total.");
            uploading = true;
            showStatus(status);
            try {
              const documents = [];
              for (const file of files) documents.push({ name: file.name, html: await file.text() });
              if (!active()) return;
              const started = await api("/analyses", "POST", { name, files: documents });
              uploading = false;
              showStatus({ progress: status.progress, aiProgress: started });
              message("New batch analysis started. Existing jobs are reused; new jobs are analyzed.");
              timer = setTimeout(poll, 500);
            } finally {
              uploading = false;
              if (active()) showStatus(status);
            }
          }
          if (form.id === "jd-job-form") {
            const fields = new FormData(form);
            const technologies = fields.get("technologies").split("\n").filter((line) => line.trim()).map((line, index) => {
              const parts = line.split("|").map((part) => part.trim());
              if (parts.length !== 3 || parts.some((part) => !part)) throw new Error(`Technology line ${index + 1} needs Name | Category | Requirement.`);
              return { name: parts[0], category: parts[1], requirement: parts[2] };
            });
            const save = form.querySelector('[type="submit"]');
            save.disabled = true;
            try {
              const job = await api(editingId ? `/jobs/${editingId}` : "/jobs", editingId ? "PUT" : "POST", {
                title: fields.get("title"), company: fields.get("company"), roleFamily: fields.get("roleFamily"),
                postedOn: fields.get("postedOn"), collectedOn: fields.get("collectedOn"), body: fields.get("body"),
                reviewed: fields.get("reviewed") === "on", screenshotIds: pageIds, technologies
              });
              if (!active()) return;
              editingId = job.id;
              const savedMessage = form.querySelector("#jd-editor-message");
              savedMessage.textContent = "Job saved. This historical analysis remains unchanged; later analyses can use the updated job.";
              savedMessage.setAttribute("role", "status");
              savedMessage.classList.remove("jd-error");
              message("Job saved successfully.");
            } finally { save.disabled = false; }
          }
        });
      };
      showStatus(status);
      if (status.progress.state === "running") timer = setTimeout(poll, 2000);
      if (status.aiProgress.state === "running") timer = setTimeout(poll, 2000);
    } catch (error) {
      if (!active()) return;
      container.innerHTML = `<section class="panel empty" role="alert"><h2>JD Intelligence is unavailable</h2><p>${escape(error.message)}</p><p>The existing learning portal remains available.</p><button class="primary" id="jd-retry">Try again</button></section>`;
      container.querySelector("#jd-retry").onclick = () => open(container);
    }
  }
  window.JdView = { open };
})();
