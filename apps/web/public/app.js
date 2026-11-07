const tracks = [
  { code: "FD", name: "Foundations", count: 12, progress: 75, color: "#ffb45b", description: "Build the habits every backend engineer needs." },
  { code: "TS", name: "TypeScript", count: 100, progress: 18, color: "#51d4cf", description: "From strict typing to production Node patterns." },
  { code: "NS", name: "NestJS & Redis", count: 42, progress: 6, color: "#ff7487", description: "Design APIs, queues, caches and workers." },
  { code: "PG", name: "PostgreSQL", count: 16, progress: 0, color: "#8b7cff", description: "Model, query and scale reliable data systems." },
  { code: "PY", name: "Python", count: 59, progress: 0, color: "#f0c75e", description: "Build a strong foundation in Python and its object model." }
];
const programs = [
  ["FD-01", "Git & npm Essentials", "Foundations", "completed"],
  ["FD-02", "HTTP & REST Basics", "Foundations", "completed"],
  ["FD-03", "Node.js Basics", "Foundations", "completed"],
  ["FD-04", "Async JavaScript: Callbacks → Promises → async/await", "Foundations", "upcoming"],
  ["FD-05", "A Plain Node.js HTTP Server (No Framework)", "Foundations", "upcoming"],
  ["FD-06", "Express CRUD API (In-Memory)", "Foundations", "upcoming"],
  ["FD-07", "Express Validation & Error Handling", "Foundations", "upcoming"],
  ["FD-08", "SQL Basics: SELECT, INSERT, UPDATE, DELETE", "Foundations", "upcoming"],
  ["FD-09", "SQL Intermediate: JOINs, GROUP BY, HAVING & Subqueries", "Foundations", "upcoming"],
  ["FD-10", "PostgreSQL in Docker + Node with pg (Parameterised Queries)", "Foundations", "upcoming"],
  ["FD-11", "Docker Basics", "Foundations", "upcoming"],
  ["FD-12", "Redis Basics & a Simple Node Cache", "Foundations", "upcoming"],
  ["TS-01", "Hello World & Strict Typing", "TypeScript", "current"],
  ["TS-02", "Typed Functions", "TypeScript", "upcoming"],
  ["TS-03", "Optional & Default Parameters", "TypeScript", "upcoming"],
  ["NS-01", "NestJS Architecture & CLI", "NestJS & Redis", "upcoming"],
  ["PG-01", "Schema Design & Normalization", "PostgreSQL", "upcoming"],
  ["PY-01", "Objects - Mutable and Immutable in Python", "Python", "upcoming"],
  ["PY-02", "Numbers, Booleans & Operators in Python", "Python", "upcoming"],
  ["PY-03", "Strings, Indexing, Slicing & Encoding in Python", "Python", "upcoming"],
  ["PY-04", "Lists, Methods & Operators in Python", "Python", "upcoming"],
  ["PY-05", "Sets & Frozensets in Python", "Python", "upcoming"],
  ["PY-06", "Dictionaries in Python", "Python", "upcoming"],
  ["PY-07", "The collections Module: Advanced Data Types in Python", "Python", "upcoming"],
  ["PY-08", "Python Data Types: Choosing the Right Type", "Python", "upcoming"],
  ["PY-09", "Operator Overloading & bytearray in Python", "Python", "upcoming"],
  ["PY-10", "Conditionals in Python", "Python", "upcoming"],
  ["PY-11", "Smart Thermostat System in Python", "Python", "upcoming"],
  ["PY-12", "Loan Eligibility Checker in Python", "Python", "upcoming"],
  ["PY-13", "Introduction to Loops in Python", "Python", "upcoming"],
  ["PY-14", "Looping Through Lists in Python", "Python", "upcoming"],
  ["PY-15", "Why Use enumerate in Python", "Python", "upcoming"],
  ["PY-16", "Combining Lists with zip in Python", "Python", "upcoming"],
  ["PY-17", "Introducing while Loops in Python", "Python", "upcoming"],
  ["PY-18", "Break, Continue & Loop Else in Python", "Python", "upcoming"],
  ["PY-19", "Dictionary in Place of Match Case in Python", "Python", "upcoming"],
  ["PY-20", "The Walrus Operator in Python", "Python", "upcoming"],
  ["PY-21", "Loops in Python: Complete Reference", "Python", "upcoming"],
  ["PY-22", "Building Your First Class and Object in Python", "Python", "upcoming"],
  ["PY-23", "Class and Object Namespaces in Python", "Python", "upcoming"],
  ["PY-24", "Attribute Shadowing in Python", "Python", "upcoming"],
  ["PY-25", "Understanding self in Python", "Python", "upcoming"],
  ["PY-26", "Constructors and __init__ in Python", "Python", "upcoming"],
  ["PY-27", "Three Ways to Access a Base Class in Python", "Python", "upcoming"],
  ["PY-28", "Method Resolution Order and MRO in Python", "Python", "upcoming"],
  ["PY-29", "Static Methods in Python", "Python", "upcoming"],
  ["PY-30", "Class Methods versus Static Methods in Python", "Python", "upcoming"],
  ["PY-31", "The property Decorator: Getters and Setters", "Python", "upcoming"],
  ["PY-32", "The Four Pillars of Object-Oriented Python", "Python", "upcoming"],
  ["PY-33", "Design an Object-Oriented Python Application", "Python", "upcoming"],
  ["PY-34", "Python OOP Quick Reference", "Python", "upcoming"],
  ["PY-35", "Functions: Reducing Duplication and Splitting Complex Tasks", "Python", "upcoming"],
  ["PY-36", "Functions: Three More Features", "Python", "upcoming"],
  ["PY-37", "Scope and Namespace in Functions", "Python", "upcoming"],
  ["PY-38", "Nonlocal versus Global Scopes", "Python", "upcoming"],
  ["PY-39", "Handling Arguments in Functions", "Python", "upcoming"],
  ["PY-40", "Handling Multiple Returns in Functions", "Python", "upcoming"],
  ["PY-41", "Lambdas, Pure versus Impure Functions", "Python", "upcoming"],
  ["PY-42", "Function Types in Python", "Python", "upcoming"],
  ["PY-43", "Documenting Functions and Built-in Functions", "Python", "upcoming"],
  ["PY-44", "Functions in Python", "Python", "upcoming"],
  ["PY-45", "Python Imports, Modules and __init__.py", "Python", "upcoming"],
  ["PY-46", "Python Imports", "Python", "upcoming"],
  ["PY-47", "List Comprehensions", "Python", "upcoming"],
  ["PY-48", "Set Comprehensions", "Python", "upcoming"],
  ["PY-49", "Dictionary Comprehensions", "Python", "upcoming"],
  ["PY-50", "Generator Comprehensions for Memory Optimization", "Python", "upcoming"],
  ["PY-51", "Comprehensions in Python", "Python", "upcoming"],
  ["PY-52", "Generators with yield and next", "Python", "upcoming"],
  ["PY-53", "Infinite Generators", "Python", "upcoming"],
  ["PY-54", "Send Values to Generators", "Python", "upcoming"],
  ["PY-55", "yield from and Closing Generators", "Python", "upcoming"],
  ["PY-56", "Decorators in Python", "Python", "upcoming"],
  ["PY-57", "Build a Logger with a Decorator", "Python", "upcoming"],
  ["PY-58", "Build an Authorization Decorator", "Python", "upcoming"],
  ["PY-59", "Generators and Decorators in Python", "Python", "upcoming"]
];
const state = JSON.parse(localStorage.getItem("ai-mastery-state") ?? '{"saved":[],"completed":3}');
const content = document.querySelector("#content");
const crumb = document.querySelector("#crumb");

function saveState() { localStorage.setItem("ai-mastery-state", JSON.stringify(state)); }
function shell(view) {
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  crumb.textContent = view[0].toUpperCase() + view.slice(1);
}
function today() {
  return `<div class="hero"><div><span class="eyebrow">Sunday, October 18</span><h1>Make progress today.</h1><p>A small, focused session compounds into serious engineering skill.</p></div><span class="date">Your learning path · Week 04</span></div>
  <div class="stats-grid"><div class="stat"><span class="stat-label">Current streak</span><div class="stat-value">7 days</div><div class="stat-trend">↑ 2 days this week</div></div><div class="stat"><span class="stat-label">Programs understood</span><div class="stat-value">${state.completed}<small style="font-size:12px;color:var(--muted)"> / 186</small></div><div class="stat-trend">↑ 1 this week</div></div><div class="stat"><span class="stat-label">Study time</span><div class="stat-value">2h 40m</div><div class="stat-trend muted">This week</div></div><div class="stat"><span class="stat-label">Daily goal</span><div class="stat-value">1 / 2</div><div class="stat-trend muted">programs</div></div></div>
  <div class="section-head"><h2>Continue learning</h2><a class="link" href="#path">View path →</a></div>
  <section class="panel focus-card"><div class="focus-copy"><span class="tag">TS-01 · TYPESCRIPT</span><h2>Hello World & Strict Typing</h2><p>Start with Hello World, your name, adding two numbers, and true/false values. Learn one small TypeScript program at a time.</p><div class="focus-actions"><button class="primary" data-action="study">Continue · 4 min</button><button class="secondary" data-action="save">♡ Save</button></div></div><div class="focus-visual"><div class="ring"><strong>62%</strong><small>complete</small></div></div></section>
  <div class="section-head"><h2>Up next</h2><span class="link">2 programs today</span></div><div class="program-list">${programs.filter((program) => program[2] === "TypeScript").slice(0,3).map((p,i)=>row(p,i)).join("")}</div>`;
}
function row(program, index) { return `<a class="panel program-row program-link" href="#program/${program[0]}"><span class="program-index">${String(index + 1).padStart(2,"0")}</span><div><h3>${program[0]} · ${program[1]}</h3><p>${program[2]} · ${index === 0 ? "In progress" : "Estimated 5 min"}</p></div><div class="row-status"><span>${index === 0 ? "62%" : "Start"}</span><span class="progress-line"><i style="width:${index === 0 ? 62 : 0}%"></i></span></div></a>`; }
function trackView(code) {
  const track = tracks.find((item) => item.code === code);
  if (!track) return `<section class="panel empty" role="alert"><h2>Track not found</h2><a class="link" href="#path">Back to learning path</a></section>`;
  const trackPrograms = programs.filter((program) => program[2] === track.name);
  return `<div class="view-title"><a class="link" href="#path">Back to learning path</a><span class="eyebrow">${escapeHtml(track.code)} track</span><h1>${escapeHtml(track.name)}</h1><p>${escapeHtml(track.description)}</p></div><section class="panel track-card track-detail"><span class="tag" style="background:${track.color}22;color:${track.color}">${escapeHtml(track.code)}</span><h2>${escapeHtml(track.name)}</h2><p>${escapeHtml(track.description)}</p><div class="track-meta"><span>${trackPrograms.length} programs</span><span>${track.progress}% complete</span></div><div class="bar"><i style="width:${track.progress}%;background:${track.color}"></i></div></section><div class="section-head" style="margin-top:34px"><h2>${escapeHtml(track.name)} programs</h2></div><div class="program-list">${trackPrograms.map((program, index) => row(program, index)).join("")}</div>`;
}
function path() { return `<div class="view-title"><span class="eyebrow">The roadmap</span><h1>Your learning path</h1><p>229 programs, sequenced from first principles to production systems.</p></div><div class="path-toolbar"><div class="section-head" style="margin:0"><h2>Tracks</h2><span class="link">5 tracks · 229 programs</span></div><input class="search" id="search" placeholder="Search programs..." /></div><div class="track-grid">${tracks.map(t=>`<${t.code === "PY" ? "a href=\"#track/PY\"" : "article"} class="panel track-card${t.code === "PY" ? " track-card-link" : ""}"><span class="tag" style="background:${t.color}22;color:${t.color}">${t.code}</span><h2>${t.name}</h2><p>${t.description}</p><div class="track-meta"><span>${t.count} programs</span><span>${t.progress}% complete</span></div><div class="bar"><i style="width:${t.progress}%;background:${t.color}"></i></div></${t.code === "PY" ? "a" : "article"}>`).join("")}</div><div class="section-head" style="margin-top:34px"><h2>Programs in order</h2></div><div class="program-list" id="programs">${programs.map((p,i)=>row(p,i)).join("")}</div>`; }
function review() { return `<div class="view-title"><span class="eyebrow">Spaced repetition</span><h1>Review queue</h1><p>Short sessions that make what you learn stick.</p></div><div class="review-grid"><section class="panel review-card"><span class="tag">REVIEW 01 · TS-01</span><h2>What does <code>strict: true</code> enable?</h2><p>Choose the best answer, then compare the explanation. There are 3 reviews due today.</p><div class="quiz-options"><button>It enables all strict type-checking options.</button><button>It only checks unused variables.</button><button>It disables implicit type inference.</button></div></section><aside class="panel side-summary"><h3>Today’s review</h3><div class="summary-row"><span>Due now</span><strong>3 cards</strong></div><div class="summary-row"><span>Estimated time</span><strong>8 min</strong></div><div class="summary-row"><span>Retention</span><strong style="color:var(--green)">92%</strong></div></aside></div>`; }
function saved() { return `<div class="view-title"><span class="eyebrow">Your library</span><h1>Saved for later</h1><p>Bookmarks and notes stay local for now and can move to the API in Phase 4.</p></div><section class="panel empty"><div style="font-size:32px;color:var(--accent)">♡</div><h2>Your saved cards will appear here</h2><p>Save a useful concept while studying to build your personal reference library.</p><a class="link" href="#today">Return to today →</a></section>`; }
function me() { return `<div class="view-title"><span class="eyebrow">Your workspace</span><h1>Alex Morgan</h1><p>Keep showing up. The system is working.</p></div><div class="stats-grid"><div class="stat"><span class="stat-label">All-time study</span><div class="stat-value">18h 24m</div></div><div class="stat"><span class="stat-label">Longest streak</span><div class="stat-value">14 days</div></div><div class="stat"><span class="stat-label">Cards viewed</span><div class="stat-value">246</div></div><div class="stat"><span class="stat-label">Mastery</span><div class="stat-value">12%</div></div></div><section class="panel" style="padding:24px"><div class="section-head"><h2>Settings</h2></div><div class="summary-row"><span>Theme</span><strong>Dark · Auto</strong></div><div class="summary-row"><span>Daily goal</span><strong>2 programs</strong></div><div class="summary-row"><span>Storage</span><strong style="color:var(--green)">Local only</strong></div></section>`; }
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}
function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
function fenceAttributes(info) {
  const language = info.match(/^\S+/)?.[0] ?? "text";
  const title = info.match(/\btitle="([^"]+)"/)?.[1] ?? "";
  const tab = info.match(/\btab="([^"]+)"/)?.[1] ?? "";
  const highlight = info.match(/\bhighlight="([^"]+)"/)?.[1] ?? "";
  return { language, title, tab, highlight, file: /\bfile\b/.test(info), verify: info.match(/\bverify="([^"]+)"/)?.[1] ?? "" };
}
function renderCodeBlock(info, code, highlightedCode = {}) {
  const attributes = fenceAttributes(info);
  const highlighted = highlightedCode[`${attributes.language.toLowerCase()}\0${code}`];
  const lineCount = code ? code.split("\n").length : 0;
  const expected = attributes.title === "Expected output";
  const file = attributes.file;
  const terminal = ["bash", "sh", "powershell"].includes(attributes.language);
  const highlight = new Set(attributes.highlight.split(",").flatMap((range) => {
    const parts = range.split("-").map(Number);
    return parts.length === 2 ? Array.from({ length: parts[1] - parts[0] + 1 }, (_, index) => parts[0] + index) : parts;
  }));
  const source = file
    ? `<code class="language-${escapeHtml(attributes.language)}">${highlighted ?? code.split("\n").map((line, index) => `<span class="code-line${highlight.has(index + 1) ? " is-highlighted" : ""}"><span class="line-number">${index + 1}</span><span>${escapeHtml(line)}</span></span>`).join("")}</code>`
    : `<code class="language-${escapeHtml(attributes.language)}">${highlighted ?? escapeHtml(code)}</code>`;
  const copyLabel = file ? "Copy file" : "Copy";
  const copyButton = expected || attributes.title === "Folder structure" ? "" :
    `<button class="copy-button" type="button" data-action="copy-code" data-copy="${encodeURIComponent(code)}">${copyLabel}</button>`;
  const heading = attributes.title ? `<div class="code-heading"><span>${escapeHtml(attributes.title)}</span>${copyButton}</div>` : copyButton;
  const preClass = `code-content${file ? " file-code" : ""}${expected ? " expected-code" : ""}${attributes.title === "Folder structure" ? " folder-code" : ""}${terminal ? ` terminal-code ${attributes.language === "powershell" ? "powershell" : "bash"}` : ""}`;
  const pre = `<pre class="${preClass}">${source}</pre>`;
  const content = file && lineCount > 40
    ? `<details class="long-file"><summary>Show full file (${lineCount} lines)</summary>${pre}</details>`
    : pre;
  return `<div class="code-block${expected ? " output-block" : ""}${terminal ? " command-block" : ""}${file ? " file-block" : ""}">${expected ? `<div class="output-label">Expected output</div>` : ""}${heading}${content}</div>`;
}
function renderMarkdown(markdown, highlightedCode = {}) {
  const normalized = markdown.replace(/^\s*-\s*\[\s\]\s*/gm, "- ");
  const lines = normalized.split(/\r?\n/);
  const output = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith("```")) {
      const blocks = [];
      while (index < lines.length && lines[index].startsWith("```")) {
        const info = lines[index].slice(3).trim();
        index += 1;
        const code = [];
        while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
        if (index < lines.length) index += 1;
        blocks.push({ info, code: code.join("\n") });
        if (!fenceAttributes(info).tab) break;
        let next = index;
        while (next < lines.length && !lines[next].trim()) next += 1;
        if (next >= lines.length || !lines[next].startsWith("```") || !fenceAttributes(lines[next].slice(3).trim()).tab) break;
        index = next;
      }
      if (blocks.length > 1) {
        const tabs = blocks.map((block, tabIndex) => {
          const { tab } = fenceAttributes(block.info);
          return `<button type="button" class="os-tab${tabIndex === 0 ? " active" : ""}" data-action="select-os" data-os="${escapeHtml(tab)}">${escapeHtml(tab)}</button>`;
        }).join("");
        const panes = blocks.map((block, tabIndex) => `<div class="os-pane${tabIndex === 0 ? " active" : ""}" data-os="${escapeHtml(fenceAttributes(block.info).tab)}">${renderCodeBlock(block.info, block.code, highlightedCode)}</div>`).join("");
        output.push(`<div class="os-code-group"><div class="os-tabs" role="tablist">${tabs}</div>${panes}</div>`);
      } else output.push(renderCodeBlock(blocks[0].info, blocks[0].code, highlightedCode));
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ""));
      const text = quote.join(" ");
      const label = text.match(/^\*\*(Checkpoint|Warning|Tip|Note|Your output will differ):\*\*/i)?.[1] ?? "Note";
      const className = label.toLowerCase().replace(/\s+/g, "-");
      output.push(`<aside class="lesson-callout callout-${className}"><strong>${escapeHtml(label)}</strong>${inlineMarkdown(text.replace(/^\*\*[^*]+:\*\*\s*/, ""))}</aside>`);
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      output.push(`<h${level}>${inlineMarkdown(line.slice(level).trim())}</h${level}>`);
      index += 1;
      continue;
    }
    if (/^\|/.test(line) && lines[index + 1]?.includes("---")) {
      const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      const header = cells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && /^\|/.test(lines[index])) rows.push(cells(lines[index++]));
      output.push(`<div class="table-scroll"><table><thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, cellIndex) => `<td>${inlineMarkdown(row[cellIndex] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) items.push(`<li>${inlineMarkdown(lines[index++].replace(/^\s*[-*]\s+/, ""))}</li>`);
      output.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) items.push(`<li>${inlineMarkdown(lines[index++].replace(/^\s*\d+\.\s+/, ""))}</li>`);
      output.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(?:```|#{1,6}\s|>\s?|\||\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[index])) paragraph.push(lines[index++]);
    output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }
  return output.join("");
}
function quizCard(body, index) {
  const question = body.match(/^question:\s*(.+)$/m)?.[1] ?? "Choose the best answer.";
  const options = [...body.matchAll(/^\s*-\s+(.+)$/gm)].map((match) => match[1]);
  const answer = Number(body.match(/^answer:\s*(\d+)$/m)?.[1] ?? -1);
  const explanation = body.match(/^explanation:\s*(.+)$/m)?.[1] ?? "";
  const type = body.match(/^type:\s*(.+)$/m)?.[1] ?? "mcq";
  const buttons = options.map((option, optionIndex) => `<button type="button" class="quiz-answer" data-action="quiz-answer" data-quiz="${index}" data-answer="${optionIndex}" data-correct="${optionIndex === answer}">${inlineMarkdown(option)}</button>`).join("");
  return `<section class="lesson-quiz"><span class="eyebrow">${escapeHtml(type.toUpperCase())} · QUESTION ${index + 1}</span><h2>${inlineMarkdown(question)}</h2><div class="lesson-quiz-options">${buttons}</div><p class="quiz-feedback" data-feedback="${index}" aria-live="polite" hidden>${inlineMarkdown(explanation)}</p></section>`;
}
function splitSubsections(body, pattern) {
  const headings = [...body.matchAll(pattern)];
  return headings.map((heading, index) => ({
    title: heading[1].trim(),
    body: body.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? body.length).trim()
  }));
}
function markdownSectionHeadings(markdown) {
  const headings = [];
  let offset = 0;
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    else if (!inFence && line.startsWith("## ")) headings.push({ title: line.slice(3).trim(), index: offset, length: line.length });
    offset += line.length + 1;
  }
  return headings;
}
function lessonCards(markdown, highlightedCode = {}, cheatSheet = null) {
  const headings = markdownSectionHeadings(markdown);
  const sections = headings.map((heading, index) => ({
    title: heading.title,
    body: markdown.slice(heading.index + heading.length, headings[index + 1]?.index ?? markdown.length).trim()
  }));
  const cards = [];
  const intro = sections.filter(({ title }) => ["Why this matters", "What you will build"].includes(title));
  cards.push({ title: "Start here", label: "INTRO", html: intro.map(({ title, body }) => `<section><h2>${escapeHtml(title)}</h2>${renderMarkdown(body)}</section>`).join("") });
  for (const section of sections) {
    if (["Why this matters", "What you will build", "Recap"].includes(section.title)) continue;
    if (section.title === "Quiz") {
      splitSubsections(section.body, /^### (Q\d+)\s*$/gm).forEach((question, index) => cards.push({ title: question.title, label: "QUIZ", html: quizCard(question.body, index) }));
    } else if (section.title === "Common errors") {
      const errors = splitSubsections(section.body, /^### (.+)$/gm);
      const items = errors.map((error) => `<details class="error-item"><summary>${inlineMarkdown(error.title)}</summary>${renderMarkdown(error.body)}</details>`).join("");
      cards.push({ title: section.title, label: "REFERENCE", html: `<label class="error-search-label" for="error-search">Find an error message</label><input id="error-search" class="search error-search" placeholder="Paste part of the message"><div class="error-list">${items}</div>` });
    } else {
      const step = /^Step \d+:/.test(section.title);
      cards.push({ title: section.title, label: step ? "WALKTHROUGH" : "REFERENCE", html: renderMarkdown(section.body, highlightedCode) });
    }
  }
  cards.push({ title: "Recap", label: "FINISH", html: `<ul>${(sections.find(({ title }) => title === "Recap")?.body.match(/^\s*-\s+.+$/gm) ?? []).map((line) => `<li>${inlineMarkdown(line.replace(/^\s*-\s+/, ""))}</li>`).join("")}</ul><button class="primary" type="button" data-action="mark-understood">Mark understood</button>${cheatSheet ? `<a class="cheat-sheet-link" href="#cheatsheet/${encodeURIComponent(cheatSheet.id)}"><span aria-hidden="true">▤</span><span><strong>Cheat sheet</strong><small>${escapeHtml(cheatSheet.title)} · view only</small></span><span aria-hidden="true">→</span></a>` : ""}` });
  return cards;
}
function safeStorageGet(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function renderStudy(lesson, program) {
  const cards = lessonCards(lesson.markdown, lesson.highlightedCode ?? {}, lesson.cheatSheet);
  const key = `lesson-position-${lesson.id}`;
  const startAt = Math.min(Number(safeStorageGet(key, "0")) || 0, cards.length - 1);
  const slideMarkup = cards.map((card, index) => `<article class="lesson-slide panel" data-card-index="${index}" aria-label="${escapeHtml(card.title)}"><header class="lesson-slide-header"><span class="eyebrow">${escapeHtml(card.label)}</span><h2>${escapeHtml(card.title)}</h2></header><div class="lesson-slide-content">${card.html}</div></article>`).join("");
  const dots = cards.map((card, index) => `<button class="progress-dot${index === startAt ? " active" : ""}" type="button" aria-label="Go to ${escapeHtml(card.title)}" data-action="go-card" data-card="${index}"></button>`).join("");
  const spec = program?.body ? renderMarkdown(program.body) : '<p>Source requirements are unavailable.</p>';
  return `<div class="study-top"><div class="view-title"><a class="link" href="#path">Back to learning path</a><span class="tag">${escapeHtml(lesson.id)} · ${escapeHtml(lesson.track.toUpperCase())}</span><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(String(lesson.estMinutes))} min · ${escapeHtml(lesson.level)} · Read at your own pace</p></div><div class="study-controls"><div class="study-tabs" role="tablist"><button type="button" class="active" data-action="study-tab" data-tab="lesson">Lesson</button><button type="button" data-action="study-tab" data-tab="spec">Spec</button></div><label class="font-control">Text size <select data-action="font-size" aria-label="Lesson text size"><option value="s">S</option><option value="m" selected>M</option><option value="l">L</option><option value="xl">XL</option></select></label><button type="button" class="secondary" data-action="theme">Light / dark</button></div></div><div class="study-progress"><span id="step-count">Step ${startAt + 1} of ${cards.length}</span><div class="progress-dots" aria-label="Lesson cards">${dots}</div></div><div class="lesson-reader" data-lesson="${escapeHtml(lesson.id)}" data-start="${startAt}"><div class="lesson-card-stack">${slideMarkup}</div><nav class="study-navigation" aria-label="Lesson card navigation"><button class="secondary" type="button" data-action="prev-card">Previous</button><button class="primary" type="button" data-action="next-card">Next</button></nav></div><article class="panel spec-panel" hidden><div class="spec-head"><h2>Program requirements</h2><span>Source specification</span></div>${spec}</article><nav class="lesson-navigation" aria-label="Program navigation">${program?.previous ? `<a class="secondary" href="#program/${program.previous}">Previous: ${program.previous}</a>` : ""}<a class="secondary" href="#path">All programs</a>${program?.next ? `<a class="primary" href="#program/${program.next}">Next: ${program.next}</a>` : ""}</nav>`;
}
async function openProgram(code) {
  const route = location.hash;
  shell("path");
  content.innerHTML = '<section class="panel empty" role="status">Loading program...</section>';
  try {
    const lessonResponse = await fetch(`/api/lessons/${encodeURIComponent(code)}`);
    let lesson;
    let program;
    if (lessonResponse.ok) {
      ({ data: lesson } = await lessonResponse.json());
      const specResponse = await fetch(`/api/programs/${encodeURIComponent(code)}`);
      if (specResponse.ok) ({ data: program } = await specResponse.json());
    } else if (lessonResponse.status === 404) {
      const response = await fetch(`/api/programs/${encodeURIComponent(code)}`);
      if (!response.ok) throw new Error(response.status === 404 ? "Program not found." : "Could not load the program. Please try again.");
      ({ data: program } = await response.json());
    } else throw new Error("Could not load the program. Please try again.");
    if (location.hash !== route) return;
    const index = programs.findIndex((item) => item[0] === code);
    const navigation = { previous: index > 0 ? programs[index - 1][0] : undefined, next: index >= 0 ? programs[index + 1]?.[0] : undefined };
    if (lesson?.markdown) content.innerHTML = renderStudy(lesson, { ...program, ...navigation });
    else if (program) content.innerHTML = `<div class="view-title"><a class="link" href="#path">Back to learning path</a><h1>${escapeHtml(program.code)} · ${escapeHtml(program.title)}</h1><p>Program specification · Read at your own pace</p></div><article class="panel lesson spec-panel">${renderMarkdown(program.body)}</article><nav class="lesson-navigation" aria-label="Program navigation">${navigation.previous ? `<a class="secondary" href="#program/${navigation.previous}">Previous: ${navigation.previous}</a>` : ""}<a class="secondary" href="#path">All programs</a>${navigation.next ? `<a class="primary" href="#program/${navigation.next}">Next: ${navigation.next}</a>` : ""}</nav>`;
    else throw new Error("Lesson content is unavailable.");
    const stack = content.querySelector?.(".lesson-card-stack");
    if (stack) {
      const startAt = Number(content.querySelector(".lesson-reader")?.dataset.start ?? 0);
      const slides = [...stack.querySelectorAll(".lesson-slide")];
      if (startAt > 0) slides[startAt]?.scrollIntoView({ block: "start" });
      stack.addEventListener("scroll", () => {
        let nearest = 0;
        let distance = Infinity;
        slides.forEach((slide, slideIndex) => {
          const nextDistance = Math.abs(slide.getBoundingClientRect().top - stack.getBoundingClientRect().top);
          if (nextDistance < distance) { nearest = slideIndex; distance = nextDistance; }
        });
        try { localStorage.setItem(`lesson-position-${code}`, String(nearest)); } catch {}
        content.querySelectorAll(".progress-dot").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === nearest));
        const counter = content.querySelector("#step-count");
        if (counter) counter.textContent = `Step ${nearest + 1} of ${slides.length}`;
      }, { passive: true });
      content.querySelector("#error-search")?.addEventListener("input", (event) => {
        const query = event.target.value.toLowerCase();
        content.querySelectorAll(".error-item").forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(query); });
      });
      const choice = safeStorageGet("lesson-os-choice", "");
      const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent ?? "";
      const preferred = choice || (/windows/i.test(userAgent) ? "Windows PowerShell" : "macOS / Linux");
      content.querySelectorAll(".os-code-group").forEach((group) => applyOsChoice(group, preferred));
      if (safeStorageGet("lesson-theme", "dark") === "light") content.querySelector(".lesson-reader")?.classList.add("lesson-light");
      content.querySelector(".lesson-reader").dataset.fontSize = safeStorageGet("lesson-font-size", "m");
    }
  } catch (error) {
    if (location.hash !== route) return;
    content.innerHTML = `<section class="panel empty" role="alert"><h2>Unable to open program</h2><p>${escapeHtml(error instanceof Error ? error.message : "An unexpected error occurred.")}</p><button class="primary" data-action="retry-program">Try again</button> <a class="link" href="#path">Back to learning path</a></section>`;
  }
}
async function openCheatSheet(id) {
  const route = location.hash;
  shell("cheatsheets");
  content.innerHTML = '<section class="panel empty" role="status">Loading cheat sheet...</section>';
  try {
    const response = await fetch(`/api/cheatsheets/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(response.status === 404 ? "Cheat sheet not found." : "Could not load the cheat sheet. Please try again.");
    const { data, navigation } = await response.json();
    if (location.hash !== route) return;
    const pageMarkup = Array.from({ length: data.pageCount }, (_, index) => `<figure class="cheat-sheet-page"><img src="/api/cheatsheets/${encodeURIComponent(id)}/pages/${index + 1}.png" alt="${escapeHtml(data.title)}, page ${index + 1} of ${data.pageCount}" loading="${index < 2 ? "eager" : "lazy"}" draggable="false"><figcaption>Page ${index + 1} of ${data.pageCount}</figcaption></figure>`).join("");
    const previous = navigation?.previous;
    const next = navigation?.next;
    const previousControl = previous
      ? `<a class="button secondary" href="#cheatsheet/${encodeURIComponent(previous.id)}" rel="prev" aria-label="Previous cheat sheet: ${escapeHtml(previous.title)}">← Previous</a>`
      : `<span class="button secondary is-disabled" aria-disabled="true">← Previous</span>`;
    const nextControl = next
      ? `<a class="button primary" href="#cheatsheet/${encodeURIComponent(next.id)}" rel="next" aria-label="Next cheat sheet: ${escapeHtml(next.title)}">Next →</a>`
      : `<span class="button primary is-disabled" aria-disabled="true">Next →</span>`;
    const navigationMarkup = `<nav class="cheat-sheet-navigation" aria-label="Cheat sheet navigation">${previousControl}<span class="cheat-sheet-position">${escapeHtml(id)} of 46 topics</span>${nextControl}</nav>`;
    content.innerHTML = `<div class="view-title"><div class="cheat-sheet-links"><a class="link" href="#cheatsheets">Back to Cheat Sheets</a><a class="link" href="#program/${encodeURIComponent(id)}">Back to ${escapeHtml(id)}</a></div><span class="tag">${escapeHtml(id)} · CHEAT SHEET</span><h1>${escapeHtml(data.title)}</h1><p>${data.pageCount} ${data.pageCount === 1 ? "page" : "pages"} · Scroll to read · View only</p></div>${navigationMarkup}<section class="cheat-sheet-viewer" aria-label="${escapeHtml(data.title)} cheat sheet">${pageMarkup}</section>${navigationMarkup}`;
    content.querySelector(".cheat-sheet-viewer").addEventListener("contextmenu", (event) => event.preventDefault());
  } catch (error) {
    if (location.hash !== route) return;
    content.innerHTML = `<section class="panel empty" role="alert"><h2>Unable to open cheat sheet</h2><p>${escapeHtml(error instanceof Error ? error.message : "An unexpected error occurred.")}</p><a class="link" href="#path">Back to learning path</a></section>`;
  }
}
async function openCheatSheets() {
  const route = location.hash;
  shell("cheatsheets");
  content.innerHTML = '<section class="panel empty" role="status">Loading cheat sheets...</section>';
  try {
    const response = await fetch("/api/cheatsheets");
    if (!response.ok) throw new Error("Could not load the cheat sheets. Please try again.");
    const { data, groups } = await response.json();
    if (location.hash !== route) return;
    let topicIndex = 0;
    const groupMarkup = groups.map((group) => {
      const rows = group.topics.map((sheet) => {
        topicIndex += 1;
        return `<a class="program-row program-link" href="#cheatsheet/${encodeURIComponent(sheet.id)}"><span class="program-index">${String(topicIndex).padStart(2, "0")}</span><div><h3>${escapeHtml(sheet.id)} · ${escapeHtml(sheet.title)}</h3><p>Python · Topic reference</p></div><div class="row-status"><span>Open</span><span aria-hidden="true">→</span></div></a>`;
      }).join("");
      const status = group.priority ?? (group.required ? "MANDATORY" : "CORE");
      const placeholder = group.topics.length === 0 ? `<div class="cheat-sheet-placeholder"><strong>Lessons pending</strong><span>Topic cheat sheets will be added here.</span></div>` : "";
      return `<section class="cheat-sheet-group panel"><div class="section-head"><h2>${escapeHtml(group.title)}</h2><span class="tag">${escapeHtml(status)}</span></div>${placeholder}<div class="program-list" aria-label="${escapeHtml(group.title)} cheat sheets">${rows}</div></section>`;
    }).join("");
    content.innerHTML = `<div class="view-title"><span class="eyebrow">Reference library</span><h1>Cheat Sheets</h1><p>Topic-wise references organized by concept. They remain available at the end of each tutorial too.</p></div><div class="section-head"><h2>${data.length} topics</h2></div><div class="cheat-sheet-tree">${groupMarkup}</div>`;
  } catch (error) {
    if (location.hash !== route) return;
    content.innerHTML = `<section class="panel empty" role="alert"><h2>Unable to load cheat sheets</h2><p>${escapeHtml(error instanceof Error ? error.message : "An unexpected error occurred.")}</p><a class="link" href="#path">Back to learning path</a></section>`;
  }
}
function applyOsChoice(group, os) {
  const available = [...group.querySelectorAll(".os-tab")].map((button) => button.dataset.os);
  const selected = available.includes(os) ? os : available[0];
  group.querySelectorAll(".os-tab").forEach((button) => button.classList.toggle("active", button.dataset.os === selected));
  group.querySelectorAll(".os-pane").forEach((pane) => { pane.hidden = pane.dataset.os !== selected; pane.classList.toggle("active", pane.dataset.os === selected); });
}
function render() { const view = location.hash.slice(1) || "today"; content.onclick = null; content.onsubmit = null; content.onchange = null; if (view.startsWith("program/")) { openProgram(view.slice("program/".length)); return; } if (view.startsWith("cheatsheet/")) { openCheatSheet(decodeURIComponent(view.slice("cheatsheet/".length))); return; } if (view === "cheatsheets") { openCheatSheets(); return; } if (view.startsWith("track/")) { shell("path"); const code = view.slice("track/".length); const track = tracks.find((item) => item.code === code); crumb.textContent = track?.name ?? "Learning path"; content.innerHTML = trackView(code); return; } shell(view.startsWith("jd/") ? "jd" : view); if (view === "jd" || view.startsWith("jd/")) { crumb.textContent = "JD Intelligence"; window.JdView.open(content); return; } content.innerHTML = ({today, path, review, saved, me}[view] ?? today)(); if(view==="path") document.querySelector("#search").addEventListener("input", filterPrograms); }
function filterPrograms(event) { const query = event.target.value.toLowerCase(); document.querySelector("#programs").innerHTML = programs.filter(p => p.join(" ").toLowerCase().includes(query)).map((p,i)=>row(p,i)).join("") || `<section class="panel empty"><h2>No matching programs</h2><p>Try a track code or keyword.</p></section>`; }
function goToCard(offset) {
  const stack = content.querySelector(".lesson-card-stack");
  const slides = [...stack.querySelectorAll(".lesson-slide")];
  const current = slides.findIndex((slide) => Math.abs(slide.getBoundingClientRect().top - stack.getBoundingClientRect().top) < slide.getBoundingClientRect().height / 2);
  const next = Math.max(0, Math.min(slides.length - 1, current + offset));
  slides[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
}
document.addEventListener("click", (event) => {
  const clicked = event.target.closest("[data-action]");
  const action = clicked?.dataset.action;
  if(action === "retry-program") render();
  if(action === "study") location.hash = "program/TS-01";
  if(action === "save"){ if(!state.saved.includes("TS-01")) state.saved.push("TS-01"); saveState(); event.target.textContent = "✓ Saved"; }
  if(action === "copy-code") {
    const code = decodeURIComponent(clicked.dataset.copy);
    const finish = () => {
      clicked.textContent = "Copied";
      setTimeout(() => { clicked.textContent = clicked.closest(".file-block") ? "Copy file" : "Copy"; }, 1400);
    };
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(finish, () => { clicked.textContent = "Copy failed"; });
    else {
      const field = document.createElement("textarea");
      field.value = code;
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      clicked.textContent = copied ? "Copied" : "Copy failed";
    }
  }
  if(action === "select-os") {
    applyOsChoice(clicked.closest(".os-code-group"), clicked.dataset.os);
    try { localStorage.setItem("lesson-os-choice", clicked.dataset.os); } catch {}
  }
  if(action === "theme") {
    const reader = content.querySelector(".lesson-reader");
    reader.classList.toggle("lesson-light");
    try { localStorage.setItem("lesson-theme", reader.classList.contains("lesson-light") ? "light" : "dark"); } catch {}
  }
  if(action === "study-tab") {
    const showSpec = clicked.dataset.tab === "spec";
    content.querySelector(".lesson-reader").hidden = showSpec;
    content.querySelector(".study-progress").hidden = showSpec;
    content.querySelector(".spec-panel").hidden = !showSpec;
    content.querySelectorAll(".study-tabs button").forEach((button) => button.classList.toggle("active", button === clicked));
  }
  if(action === "prev-card") goToCard(-1);
  if(action === "next-card") goToCard(1);
  if(action === "go-card") content.querySelectorAll(".lesson-slide")[Number(clicked.dataset.card)]?.scrollIntoView({ behavior: "smooth", block: "start" });
  if(action === "quiz-answer") {
    const feedback = content.querySelector(`[data-feedback="${clicked.dataset.quiz}"]`);
    feedback.hidden = false;
    feedback.classList.toggle("correct", clicked.dataset.correct === "true");
    feedback.classList.toggle("incorrect", clicked.dataset.correct !== "true");
    feedback.insertAdjacentHTML("afterbegin", clicked.dataset.correct === "true" ? "<strong>Correct. </strong>" : "<strong>Not quite. </strong>");
    clicked.closest(".lesson-quiz-options").querySelectorAll("button").forEach((button) => { button.disabled = true; });
  }
  if(action === "mark-understood") {
    state.completed += 1;
    saveState();
    clicked.textContent = "Marked understood";
    clicked.disabled = true;
  }
});
document.addEventListener("change", (event) => {
  if(event.target.matches("[data-action='font-size']")) {
    content.querySelector(".lesson-reader").dataset.fontSize = event.target.value;
    try { localStorage.setItem("lesson-font-size", event.target.value); } catch {}
  }
});
document.addEventListener("input", (event) => {
  if(event.target.matches("#error-search")) {
    const query = event.target.value.toLowerCase();
    content.querySelectorAll(".error-item").forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(query); });
  }
});
window.addEventListener("hashchange", render); render();
fetch("/api/auth/me").then((response) => response.ok ? response.json() : null).then((result) => {
  const user = result?.data?.user;
  if(!user) return;
  const avatar = document.querySelector("#auth-avatar");
  avatar.textContent = (user.name || user.email).split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  avatar.title = user.email;
  document.querySelector("#auth-logout").hidden = false;
  const chip = document.querySelector(".offline-chip");
  if(chip) chip.hidden = true;
}).catch(() => {});
