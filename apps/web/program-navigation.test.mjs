import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

async function browser(hash, response = { ok: true, json: async () => ({ data: { code: "FD-01", title: "Git & npm Essentials", body: "Learn Git <script>alert(1)</script>" } }) }) {
  const content = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [] };
  const handlers = {};
  const location = { hash };
  const context = vm.createContext({
    location,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      querySelector: (selector) => selector === "#content" ? content : { addEventListener: () => {}, textContent: "" },
      querySelectorAll: () => [],
      addEventListener: (name, callback) => { handlers[name] = callback; }
    },
    window: { addEventListener: () => {} },
    navigator: { userAgent: "Linux" },
    fetch: async () => response
  });
  vm.runInContext(await readFile(new URL("./public/app.js", import.meta.url), "utf8"), context);
  await new Promise((resolve) => setImmediate(resolve));
  return { content, handlers, location };
}

test("path rows link to the program reader", async () => {
  const { content } = await browser("#path");
  assert.match(content.innerHTML, /href="#program\/FD-01"/);
  assert.match(content.innerHTML, /href="#program\/PG-01"/);
  assert.match(content.innerHTML, /<h2>Python<\/h2>/);
  assert.match(content.innerHTML, /href="#track\/PY"/);
  assert.match(content.innerHTML, /href="#program\/PY-01"/);
  assert.match(content.innerHTML, /Objects - Mutable and Immutable in Python/);
  assert.match(content.innerHTML, /5 tracks · 179 programs/);
});

test("Python track route shows only Python and its programs", async () => {
  const { content } = await browser("#track/PY");
  assert.match(content.innerHTML, /<h1>Python<\/h1>/);
  assert.match(content.innerHTML, /9 programs/);
  assert.match(content.innerHTML, /href="#program\/PY-01"/);
  assert.match(content.innerHTML, /href="#program\/PY-02"/);
  assert.match(content.innerHTML, /href="#program\/PY-03"/);
  for (const code of ["PY-04", "PY-05", "PY-06", "PY-07", "PY-08", "PY-09"]) assert.match(content.innerHTML, new RegExp(`href="#program/${code}"`));
  assert.match(content.innerHTML, /Objects - Mutable and Immutable in Python/);
  assert.match(content.innerHTML, /Numbers, Booleans & Operators in Python/);
  assert.match(content.innerHTML, /Strings, Indexing, Slicing & Encoding in Python/);
  assert.match(content.innerHTML, /Lists, Methods & Operators in Python/);
  assert.doesNotMatch(content.innerHTML, /TypeScript|PostgreSQL|Foundations/);
  assert.match(content.innerHTML, /href="#path">Back to learning path/);
});

test("learning path lists all twelve Foundations programs before TS-01", async () => {
  const { content } = await browser("#path");
  let previousPosition = -1;
  for (let number = 1; number <= 12; number += 1) {
    const code = `FD-${String(number).padStart(2, "0")}`;
    const position = content.innerHTML.indexOf(`href="#program/${code}"`);
    assert.ok(position > previousPosition, `${code} must appear in Foundations order`);
    previousPosition = position;
  }
  assert.ok(content.innerHTML.indexOf('href="#program/TS-01"') > previousPosition);
});

test("Foundations reader navigation includes the added lessons and TS-01 boundary", async () => {
  for (const [code, previous, next] of [
    ["FD-03", "FD-02", "FD-04"],
    ["FD-04", "FD-03", "FD-05"],
    ["FD-12", "FD-11", "TS-01"],
    ["TS-01", "FD-12", "TS-02"]
  ]) {
    const { content } = await browser(`#program/${code}`);
    assert.ok(content.innerHTML.includes(`href="#program/${previous}"`), `${code}: previous`);
    assert.ok(content.innerHTML.includes(`href="#program/${next}"`), `${code}: next`);
  }
});

test("Today keeps TypeScript recommendations after adding Foundations lessons", async () => {
  const { content } = await browser("#today");
  for (const code of ["TS-01", "TS-02", "TS-03"]) {
    assert.ok(content.innerHTML.includes(`href="#program/${code}"`));
  }
});

test("direct program route loads escaped source content and next navigation", async () => {
  const { content } = await browser("#program/FD-01");
  assert.match(content.innerHTML, /Git &amp; npm Essentials/);
  assert.match(content.innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(content.innerHTML, /<script>/);
  assert.match(content.innerHTML, /href="#program\/FD-02"/);
  assert.match(content.innerHTML, /Back to learning path/);
});

test("Continue opens TS-01 instead of returning to the catalogue", async () => {
  const { handlers, location } = await browser("#today");
  handlers.click({ target: { closest: () => ({ dataset: { action: "study" } }) } });
  assert.equal(location.hash, "program/TS-01");
});

test("missing program shows a visible error with retry and return actions", async () => {
  const { content } = await browser("#program/unknown", { ok: false, status: 404 });
  assert.match(content.innerHTML, /role="alert"/);
  assert.match(content.innerHTML, /Program not found/);
  assert.match(content.innerHTML, /Try again/);
  assert.match(content.innerHTML, /href="#path"/);
});

test("lesson route renders Markdown as lesson cards and interactive block affordances", async () => {
  const markdown = `## Why this matters
- [ ] **Objective:** Git is a **history** tool.

## What you will build
A tiny project.

\`\`\`bash title="Terminal"
node app.js
\`\`\`

\`\`\`text title="Expected output"
Hello
\`\`\`

> **Checkpoint:** the two operating-system blocks are ready.

\`\`\`bash tab="macOS / Linux" title="Terminal"
echo ready
\`\`\`

\`\`\`powershell tab="Windows PowerShell" title="Terminal"
Write-Output ready
\`\`\`

## Step 1: Run it
Use the command.

\`\`\`js title="src/app.js" file
console.log("Hello");
\`\`\`

## Common errors
### Error message
Try a fix.

## Quiz
### Q1
type: mcq
question: What does Git record?
options:
  - History
  - Weather
answer: 0
explanation: Git records project changes.

## Recap
- One
- Two
- Three`;
  const response = { ok: true, json: async () => ({ data: {
    id: "FD-01",
    title: "Git lesson",
    track: "fd",
    level: "beginner",
    estMinutes: 10,
    markdown,
    highlightedCode: { ['js\0console.log("Hello");']: '<span class="line"><span style="color:#F97583">console.log("Hello");</span></span>' }
  } }) };
  const { content } = await browser("#program/FD-01", response);
  assert.match(content.innerHTML, /class="lesson-card-stack"/);
  assert.match(content.innerHTML, /class="quiz-answer"/);
  assert.match(content.innerHTML, /Copy file/);
  assert.match(content.innerHTML, /Expected output/);
  assert.match(content.innerHTML, /class="os-code-group"/);
  assert.match(content.innerHTML, /callout-checkpoint/);
  assert.match(content.innerHTML, /style="color:#F97583"/);
  assert.match(content.innerHTML, /<strong>history<\/strong>/);
  assert.doesNotMatch(content.innerHTML, /\*\*history\*\*/);
  assert.doesNotMatch(content.innerHTML, /- \[ \]/);
});
