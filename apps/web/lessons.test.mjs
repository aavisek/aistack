import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractAcceptanceCriteria, extractFences, extractSections, loadLessons, parseLesson, validateLesson } from "./lessons.mjs";
import { loadPrograms } from "./course.mjs";
import { highlightLesson } from "./highlight.mjs";

test("all authored lessons have valid metadata and required ordered sections", async () => {
  const [lessons, programs] = await Promise.all([loadLessons(), loadPrograms()]);
  const codes = new Map(programs.map((program) => [program.code, program]));
  assert.deepEqual(lessons.map(({ id }) => id), [
    ...Array.from({ length: 12 }, (_, index) => `FD-${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 59 }, (_, index) => `PY-${String(index + 1).padStart(2, "0")}`),
    "TS-01", "TS-02"
  ]);
  for (const lesson of lessons) {
    const source = await readFile(new URL(`../../content/lessons/${lesson.id}.md`, import.meta.url), "utf8");
    assert.deepEqual(validateLesson(source, `${lesson.id}.md`, codes), []);
  }
});

test("PY-03 covers all cheat-sheet topics and keeps its final Boolean program", async () => {
  const lesson = (await loadLessons()).find(({ id }) => id === "PY-03");
  assert.ok(lesson);
  const sections = extractSections(lesson.markdown);
  const steps = sections.filter(({ title }) => /^Step \d+:/.test(title));
  assert.equal(steps.length, 17);
  for (const section of [...steps, sections.at(-1)]) {
    const fences = extractFences(section.body);
    assert.ok(fences.some(({ info }) => /^python .* file$/.test(info)), section.title);
    assert.ok(fences.some(({ info }) => info.includes('verify="run"')), section.title);
    assert.ok(fences.some(({ info }) => info === 'text title="Expected output"'), section.title);
  }
  for (const topic of ["rindex", "slice_recipes.py", "utf-32", "cp1252",
    "xmlcharrefreplace", "namereplace", "surrogateescape", "charset-normalizer",
    "\\N{EURO SIGN}", "\\X", "utf-8-sig"]) {
    assert.ok(lesson.markdown.includes(topic), `Missing cheat-sheet topic: ${topic}`);
  }
  assert.equal(sections.at(-1).title, "Final practice: Should You Go for a Walk?");
});

test("PY-04 covers the lists cheat sheet and ends with the watchlist program", async () => {
  const lesson = (await loadLessons()).find(({ id }) => id === "PY-04");
  assert.ok(lesson);
  const sections = extractSections(lesson.markdown);
  const steps = sections.filter(({ title }) => /^Step \d+:/.test(title));
  assert.equal(steps.length, 10);
  for (const section of [...steps, sections.at(-1)]) {
    const fences = extractFences(section.body);
    assert.ok(fences.some(({ info }) => /^python .* file$/.test(info)), section.title);
    assert.ok(fences.some(({ info }) => info.includes('verify="run"')), section.title);
    assert.ok(fences.some(({ info }) => info === 'text title="Expected output"'), section.title);
  }
  for (const topic of ["append(", "insert(", "remove(", "pop(", "extend(", "sort(", "reverse(", "sorted(", "copy(", "clear(", "split(", "join("]) {
    assert.ok(lesson.markdown.includes(topic), `Missing cheat-sheet topic: ${topic}`);
  }
  assert.equal(sections.at(-1).title, "Final practice: Movie Watchlist");
});

test("lesson parser extracts front matter, ordered sections, and executable metadata", () => {
  const parsed = parseLesson(`---
id: FD-99
title: Small example
track: fd
level: beginner
estMinutes: 1
prerequisites: []
toolVersions:
  node: "20.1.0"
os: [windows, macos, linux]
---

## Step 1: Run
\`\`\`bash verify="run"
printf "ready\\n"
\`\`\`
\`\`\`text title="Expected output"
ready
\`\`\`
`);
  assert.equal(parsed.metadata.id, "FD-99");
  assert.equal(parsed.metadata.toolVersions.node, "20.1.0");
  assert.deepEqual(parsed.metadata.os, ["windows", "macos", "linux"]);
  assert.equal(extractSections(parsed.markdown)[0].title, "Step 1: Run");
  assert.equal(extractFences(parsed.markdown)[0].info, 'bash verify="run"');
});

test("lesson validation permits legitimate Todo terminology", async () => {
  const programs = await loadPrograms();
  const source = await readFile(new URL("../../content/lessons/FD-10.md", import.meta.url), "utf8");
  const codes = new Map(programs.map((program) => [program.code, program]));
  assert.deepEqual(validateLesson(source, "FD-10.md", codes), []);
});

test("each authored lesson is mapped to the existing source program specification", async () => {
  const programs = await loadPrograms();
  const lessons = await loadLessons();
  for (const lesson of lessons) {
    const program = programs.find(({ code }) => code === lesson.id);
    assert.ok(program, `Missing source program for ${lesson.id}`);
    assert.ok(lesson.markdown.includes("Verify against the requirements"));
    assert.equal(lesson.title, program.title.replaceAll("`", ""));
  }
});

test("JSON lesson file blocks are complete valid files", async () => {
  const lessons = await loadLessons();
  for (const lesson of lessons) {
    for (const block of extractFences(lesson.markdown)) {
      const filename = block.info.match(/\btitle="([^"]+\.json)"\s+file\b/)?.[1];
      if (filename) assert.doesNotThrow(() => JSON.parse(block.body), `${lesson.id}: ${filename}`);
    }
  }
});

test("TS-01 starts with standalone basic programs before functions and compiler-error examples", async () => {
  const lesson = (await loadLessons()).find(({ id }) => id === "TS-01");
  const sections = extractSections(lesson.markdown);
  const steps = sections.filter(({ title }) => /^Step \d+:/.test(title));
  assert.equal(steps.length, 11);
  const basics = steps.slice(1, 5);
  for (const [index, filename] of ["hello.ts", "name.ts", "add.ts", "ready.ts"].entries()) {
    const fences = extractFences(basics[index].body);
    const file = fences.find(({ info }) => info.includes(`title="src/${filename}" file`));
    assert.ok(file, `Missing standalone basic program ${filename}`);
    assert.doesNotMatch(file.body, /\b(?:import|export|function)\b|@ts-expect-error/);
    assert.ok(fences.some(({ body }) => body.includes(`node dist/${filename.replace(".ts", ".js")}`)));
    assert.ok(fences.some(({ info }) => info === 'text title="Expected output"'));
  }
  assert.match(steps[5].body, /Pause here/);
  assert.match(steps[7].title, /function/);
});

test("TS-02 teaches simple function calls before reusable guards and tests", async () => {
  const lesson = (await loadLessons()).find(({ id }) => id === "TS-02");
  const steps = extractSections(lesson.markdown).filter(({ title }) => /^Step \d+:/.test(title));
  assert.equal(steps.length, 10);
  for (const [index, filename] of ["first-add.ts", "use-result.ts", "operations.ts"].entries()) {
    const fences = extractFences(steps[index + 1].body);
    const file = fences.find(({ info }) => info.includes(`title="src/${filename}" file`));
    assert.ok(file, filename);
    assert.doesNotMatch(file.body, /\b(?:import|export|throw|unknown)\b|@ts-expect-error/);
    assert.ok(fences.some(({ body }) => body.includes(`node dist/${filename.replace(".ts", ".js")}`)));
  }
  assert.match(steps[3].body, /Pause here/);
  const tests = extractFences(lesson.markdown).find(({ info }) => info === 'js title="test/math.test.js" file');
  assert.ok(tests);
  assert.match(tests.body, /add\("1", 2\)/);
});

test("authored verification cards have enough step-linked items for source criteria", async () => {
  const [lessons, programs] = await Promise.all([loadLessons(), loadPrograms()]);
  const programsByCode = new Map(programs.map((program) => [program.code, program]));
  for (const lesson of lessons) {
    const verify = extractSections(lesson.markdown).find(({ title }) => title === "Verify against the requirements").body;
    const evidence = [...verify.matchAll(/^\s*-\s*\[[ x]\]\s*.+?(?:→|->)\s*Steps?\s*\d+/gm)];
    assert.ok(evidence.length >= extractAcceptanceCriteria(programsByCode.get(lesson.id).body).length, lesson.id);
  }
});

test("Shiki returns safe dual-theme, line-highlighted code markup", async () => {
  const result = await highlightLesson([{ info: 'js title="sample.js" file highlight="1"', body: "const answer = 42;" }]);
  const block = Object.values(result)[0];
  assert.match(block, /class="line is-highlighted"/);
  assert.match(block, /--shiki-light:/);
  assert.match(block, /<span style="color:/);
  assert.doesNotMatch(block, /<script/i);
});
