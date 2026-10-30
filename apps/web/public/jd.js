(() => {
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const roleNames = { "ai-architect": "AI Architect", "ai-platform-architect": "AI Platform Architect", other: "Other", unclassified: "Unclassified" };
  let generation = 0;
  let timer;

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
      <td><details><summary>View sources</summary>${item.evidence.map((source) => `<blockquote><button class="link" data-edit-job="${escape(source.jobId)}">${escape(source.title)}</button><p>${escape(source.evidence)}</p></blockquote>`).join("")}</details></td></tr>`).join("") || '<tr><td colspan="5">No reviewed jobs match. Import screenshots and run AI import, or upload a Naukri URL list.</td></tr>'}
      </tbody></table></div>
      <h3>Technology area ranking</h3><p>Ranked by the number of distinct reviewed jobs mentioning at least one technology in the area. A job contributes at most once to each area.</p>
      <div class="jd-table-scroll"><table><caption>Ranked technology areas</caption><thead><tr><th>Rank</th><th>Area</th><th>Distinct jobs</th><th>Share</th><th>Technologies found</th></tr></thead><tbody>
      ${demand.areas.map((area) => `<tr><td><strong>#${area.rank}</strong></td><td>${escape(area.area)}</td><td>${area.jobCount}</td><td>${area.share}%</td><td>${area.technologyCount}</td></tr>`).join("") || '<tr><td colspan="5">No ranked areas yet.</td></tr>'}
      </tbody></table></div>
      <h3>Provisional 12-month learning sequence</h3><p>Within each quarter, technologies are ordered by observed JD count. This is not a personalized skill-gap assessment or a prediction; revisit monthly and choose a manageable hands-on subset.</p>
      <div class="jd-quarters">${demand.learningPlan.map((stage) => `<section><h4>Months ${stage.quarter * 3 - 2}-${stage.quarter * 3}: ${escape(stage.title)}</h4><p>${stage.technologies.map((item) => escape(item.name)).join(", ") || "No technologies recorded for this stage yet."}</p></section>`).join("")}</div>`;
  }

  async function open(container) {
    const current = ++generation;
    clearTimeout(timer);
    const active = () => current === generation && location.hash === "#jd";
    container.innerHTML = '<section class="panel empty" role="status">Loading JD Intelligence...</section>';
    try {
      const [status, screenshots, jobs, demand] = await Promise.all([api("/status"), api("/screenshots"), api("/jobs"), api("/demand")]);
      if (!active()) return;
      let uploading = false;
      let editingId = null;
      let pageIds = [];
      container.innerHTML = `<div class="jd-view">
        <div class="view-title"><span class="eyebrow">Evidence-led learning</span><h1>JD Intelligence</h1><p>Turn job screenshots or Naukri listings into reviewable technology demand and learning priorities.</p></div>
        <p id="jd-message" role="status" aria-live="polite"></p>
        <section class="panel jd-panel"><h2>1. Import and analyze screenshots</h2>
          <p>Import screenshots first to create local OCR source documents. AI import then analyzes one combined OCR document per folder, extracts the complete job details and technologies, and immediately includes reviewed jobs in demand.</p>
          <label>Choose a folder containing the images for one job
            <input id="jd-folder" type="file" webkitdirectory multiple accept=".png,.jpg,.jpeg,.webp">
          </label>
          <p id="jd-folder-summary" role="status">No folder selected. JPEG, PNG and WebP images, up to 20 MB each.</p>
          <button class="primary" id="jd-upload">Upload folder and extract text</button>
          <button class="primary" id="jd-import">Import / retry screenshots</button> <button class="secondary" id="jd-refresh">Refresh lists</button>
          <button class="primary" id="jd-ai-import">Run AI import</button>
          <h3>Or upload a Naukri URL list</h3>
          <label>Text file with one HTTPS Naukri job-listing URL per line
            <input id="jd-url-file" type="file" accept=".txt,text/plain">
          </label>
          <p>Up to 100 distinct jobs and 256 KB per file. Each listing is fetched and analyzed automatically using the same AI extraction. Re-uploading updates the same jobs. Naukri may block automated access; blocked, expired or login-only listings are reported, not saved.</p>
          <button class="primary" id="jd-url-upload">Upload URL list and analyze</button>
          <p id="jd-progress" role="status" aria-live="polite"></p><p id="jd-ai-progress" role="status" aria-live="polite"></p><div id="jd-import-errors"></div>
        </section>
        <section class="panel jd-panel" id="jd-editor" hidden></section>
        <section class="panel jd-panel"><h2>Saved jobs</h2>
          <div class="jd-jobs">${jobs.map((job) => `<button class="secondary" data-edit-job="${escape(job.id)}">${escape(job.title)}${job.company ? ` - ${escape(job.company)}` : ""}<small>${escape(roleNames[job.roleFamily])} | ${job.reviewed ? "Reviewed" : "Draft"} | ${job.technologyCount} technologies</small></button>`).join("") || "<p>No jobs saved yet.</p>"}</div>
        </section>
        <section class="panel jd-panel"><h2>Demand and learning priorities</h2>
          <form id="jd-filters" class="jd-fields"><label>Target role<select name="role"><option value="">All roles</option>${Object.entries(roleNames).map(([value, name]) => `<option value="${value}">${name}</option>`).join("")}</select></label>
          <label>Collected from<input type="date" name="from"></label><label>Collected through<input type="date" name="to"></label><button class="primary" type="submit">Apply filters</button></form>
          <div id="jd-demand">${demandMarkup(demand)}</div>
        </section>
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
      function showProgress(progress) {
        container.querySelector("#jd-import").disabled = progress.state === "running";
        container.querySelector("#jd-upload").disabled = uploading || progress.state === "running";
        container.querySelector("#jd-progress").textContent = `${progress.state}: ${progress.processed}/${progress.total} processed; ${progress.imported} imported, ${progress.skipped} duplicates skipped, ${progress.failed} failed.`;
        container.querySelector("#jd-import-errors").innerHTML = progress.errors.length ? `<details open><summary>Import errors</summary><ul>${progress.errors.map((error) => `<li>${escape(error.sourcePath)} ${escape(error.message)}</li>`).join("")}</ul></details>` : "";
      }
      function showStatus(next) {
        Object.assign(status, next);
        showProgress(next.progress);
        showAiProgress(next.aiProgress);
        const busy = uploading || next.progress.state === "running" || next.aiProgress.state === "running";
        for (const id of ["jd-upload", "jd-import", "jd-ai-import", "jd-folder", "jd-url-file", "jd-url-upload"]) container.querySelector(`#${id}`).disabled = busy;
      }
      function showAiProgress(progress) {
        const button = container.querySelector("#jd-ai-import");
        button.disabled = progress.state === "running";
        container.querySelector("#jd-ai-progress").textContent = `AI ${progress.state}: ${progress.processed}/${progress.total} ${progress.sourceType === "urls" ? "URLs processed" : "screenshots analyzed"}; ${progress.jobs} jobs saved, ${progress.failed} failed.${progress.sourceType === "urls" ? ` ${progress.skipped} duplicate URLs skipped.` : ""}`;
        if (progress.errors.length) container.querySelector("#jd-import-errors").innerHTML += `<details open><summary>AI import errors</summary><ul>${progress.errors.map((error) => `<li>${escape(error.sourcePath || "")} ${escape(error.message)}</li>`).join("")}</ul></details>`;
      }
      async function poll() {
        if (!active()) return;
        try {
          const next = await api("/status");
          if (!active()) return;
          showStatus(next);
          if (next.progress.state === "running") timer = setTimeout(poll, 2000);
          else if (next.aiProgress.state === "running") timer = setTimeout(poll, 2000);
          else if (next.aiProgress.sourceType === "urls") {
            await open(container);
            message("Naukri import finished. Saved jobs and demand have been refreshed. Check import errors for any failed URLs.", next.aiProgress.failed > 0);
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
          ${job.sourceUrl ? `<p>Source: <a href="${escape(job.sourceUrl)}" target="_blank" rel="noopener noreferrer">Original Naukri listing</a></p>` : ""}
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
        if (event.target.id !== "jd-folder") return;
        const files = [...event.target.files].filter((file) => /\.(png|jpe?g|webp)$/i.test(file.name));
        container.querySelector("#jd-folder-summary").textContent = `${files.length} supported images selected. Folder names are preserved; one folder represents one job.`;
      };
      // Handlers are replaced on re-entry rather than accumulating on the shared content element.
      container.onclick = (event) => {
        const button = event.target.closest("button");
        if (!button || button.disabled) return;
        return run(async () => {
          if (button.dataset.editJob) {
            const job = await api(`/jobs/${button.dataset.editJob}`);
            if (active()) editor(job);
          }
          if (button.id === "jd-refresh") await open(container);
          if (button.id === "jd-url-upload") {
            const file = container.querySelector("#jd-url-file").files?.[0];
            if (!file || !/\.txt$/i.test(file.name)) throw new Error("Choose a .txt file containing one Naukri job URL per line.");
            if (file.size > 256 * 1024) throw new Error("The URL text file must be at most 256 KB.");
            uploading = true;
            showStatus(status);
            try {
              const text = await file.text();
              if (!active()) return;
              const started = await api("/naukri-import", "POST", { text });
              if (!active()) return;
              uploading = false;
              showStatus({ progress: status.progress, aiProgress: started });
              message("Naukri import started. Each listing is fetched, analyzed and saved automatically.");
              timer = setTimeout(poll, 500);
            } finally {
              uploading = false;
              if (active()) showStatus(status);
            }
          }
          if (button.id === "jd-upload") {
            const files = [...container.querySelector("#jd-folder").files].filter((file) => /\.(png|jpe?g|webp)$/i.test(file.name));
            if (!files.length) throw new Error("Choose a folder containing JPEG, PNG or WebP images first.");
            if (files.some((file) => file.size > 20 * 1024 * 1024)) throw new Error("Each image must be at most 20 MB.");
            uploading = true;
            showStatus(status);
            try {
              for (const [index, file] of files.entries()) {
                if (!active()) return;
                message(`Uploading image ${index + 1}/${files.length}: ${file.name}`);
                const response = await fetch(`/api/jd/upload?path=${encodeURIComponent(file.webkitRelativePath)}`, {
                  method: "POST", headers: { "content-type": "application/octet-stream" }, body: file
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error?.message || `Image upload failed (${response.status}).`);
              }
              const started = await api("/import", "POST", {});
              uploading = false;
              showStatus({ progress: started, aiProgress: status.aiProgress });
              message("Folder uploaded. Local OCR is extracting the job text. Run AI import when OCR finishes.");
              timer = setTimeout(poll, 500);
            } finally {
              uploading = false;
              if (active()) {
                showStatus(await api("/status"));
              }
            }
          }
          if (button.id === "jd-import") {
            button.disabled = true;
            try { showStatus({ progress: await api("/import", "POST", {}), aiProgress: status.aiProgress }); timer = setTimeout(poll, 500); }
            catch (error) { button.disabled = false; throw error; }
          }
          if (button.id === "jd-ai-import") {
            button.disabled = true;
            try {
              const started = await api("/ai-import", "POST", {});
              showStatus({ progress: status.progress, aiProgress: started });
              timer = setTimeout(poll, 1500);
            } catch (error) { button.disabled = false; throw error; }
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
        run(async () => {
          if (form.id === "jd-filters") {
            const params = new URLSearchParams(new FormData(form));
            const filtered = await api(`/demand?${params}`);
            if (active()) container.querySelector("#jd-demand").innerHTML = demandMarkup(filtered);
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
              savedMessage.textContent = "Saved. Refresh lists to update page assignments, saved jobs and demand counts.";
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
