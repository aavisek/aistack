import { mkdtemp, readFile, readdir, rm, mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPrograms } from "./course.mjs";
import { highlightLesson } from "./highlight.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const lessonsDir = join(root, "content", "lessons");
const requiredSections = [
  "Why this matters",
  "What you will build",
  "Before you start",
  "How it works",
  "Verify against the requirements",
  "Common errors",
  "Try it yourself (optional)",
  "Quiz",
  "Recap"
];

export function parseLesson(source) {
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatter) throw new Error("Missing YAML front-matter.");
  const fields = {};
  let currentMap;
  for (const line of frontMatter[1].split(/\r?\n/)) {
    const mapItem = line.match(/^\s{2}([A-Za-z][\w-]*):\s*["']?([^"']*)["']?\s*$/);
    if (mapItem && currentMap) {
      fields[currentMap] ??= {};
      fields[currentMap][mapItem[1]] = mapItem[2];
      continue;
    }
    const item = line.match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/);
    if (!item) continue;
    currentMap = item[1] === "toolVersions" ? item[1] : undefined;
    let value = item[2];
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((entry) => entry.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else {
      value = value.replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "");
    }
    fields[item[1]] = item[1] === "toolVersions" && !value ? {} : value;
  }
  return { metadata: fields, markdown: source.slice(frontMatter[0].length).trim() };
}

export function extractSections(markdown) {
  const headings = [];
  let offset = 0;
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    else if (!inFence && line.startsWith("## ")) headings.push({ 1: line.slice(3), index: offset, 0: line });
    offset += line.length + 1;
  }
  return headings.map((heading, index) => ({
    title: heading[1].trim(),
    body: markdown.slice(heading.index + heading[0].length, headings[index + 1]?.index ?? markdown.length).trim()
  }));
}

export function extractAcceptanceCriteria(programBody) {
  const match = programBody.match(/^- \*\*Acceptance criteria:\*\*\s*(.+)$/m);
  return match ? match[1].split(/;\s*/).map((criterion) => criterion.trim()).filter(Boolean) : [];
}

export function extractFences(markdown) {
  const blocks = [];
  const pattern = /^```([^\n]*)\r?\n([\s\S]*?)^```\s*$/gm;
  for (const match of markdown.matchAll(pattern)) {
    const info = match[1].trim();
    blocks.push({
      info,
      body: match[2].replace(/\r?\n$/, ""),
      line: markdown.slice(0, match.index).split("\n").length
    });
  }
  return blocks;
}

export function validateLesson(source, filename, programCodes) {
  const errors = [];
  let lesson;
  try {
    lesson = parseLesson(source);
  } catch (error) {
    return [error.message];
  }
  const { metadata, markdown } = lesson;
  const id = filename.replace(/\.md$/i, "");
  for (const field of ["id", "title", "track", "level", "estMinutes", "prerequisites", "toolVersions", "os"]) {
    if (!metadata[field]) errors.push(`Missing front-matter field "${field}".`);
  }
  if (metadata.id !== id) errors.push(`Front-matter id "${metadata.id}" does not match filename "${id}".`);
  if (!programCodes.has(metadata.id)) errors.push(`Program "${metadata.id}" does not exist in the source specification.`);
  if (!["fd", "ts", "ns", "pg"].includes(metadata.track)) errors.push("Track must be fd, ts, ns, or pg.");
  if (!["beginner", "intermediate", "advanced"].includes(metadata.level)) errors.push("Level is not supported.");
  if (!Number.isInteger(Number(metadata.estMinutes)) || Number(metadata.estMinutes) < 1) errors.push("estMinutes must be a positive integer.");
  if (!Array.isArray(metadata.os) || !["windows", "macos", "linux"].every((os) => metadata.os.includes(os))) errors.push("os must include windows, macos, and linux.");

  const sections = extractSections(markdown);
  const titles = sections.map((section) => section.title);
  const firstStep = titles.findIndex((title) => /^Step \d+: .+/.test(title));
  const lastStep = titles.findLastIndex((title) => /^Step \d+: .+/.test(title));
  if (firstStep !== 3) errors.push("Steps must follow Before you start.");
  if (firstStep < 0 || lastStep < firstStep) errors.push("At least one numbered Step section is required.");
  const sectionPositions = requiredSections.map((title) => titles.indexOf(title));
  if (sectionPositions.some((position) => position < 0) || sectionPositions.some((position, index) => index > 0 && position <= sectionPositions[index - 1])) {
    errors.push(`Required sections are missing or out of order: ${requiredSections.join(" → ")}.`);
  }
  if (lastStep >= 0 && sectionPositions[3] <= lastStep) errors.push("How it works must come after the walkthrough steps.");
  const verifyBody = sections.find(({ title }) => title === "Verify against the requirements")?.body ?? "";
  const linkedEvidence = [...verifyBody.matchAll(/^\s*-\s*\[[ x]\]\s*.+?(?:→|->)\s*Steps?\s*\d+/gm)];
  const sourceProgram = programCodes instanceof Map ? programCodes.get(metadata.id) : undefined;
  if (sourceProgram && linkedEvidence.length < extractAcceptanceCriteria(sourceProgram.body).length) {
    errors.push("Map every source acceptance criterion to evidence in the verification checklist.");
  }

  for (const section of sections.filter(({ title }) => /^Step \d+: .+/.test(title))) {
    const fences = extractFences(section.body);
    if (!fences.length) errors.push(`${section.title} needs at least one code or command block.`);
    if (fences.some(({ info }) => /^(bash|sh|powershell)\b/.test(info)) && !fences.some(({ info }) => /\btitle=["']?Expected output/i.test(info))) {
      errors.push(`${section.title} needs an Expected output block.`);
    }
    const prose = section.body.replace(/^```[\s\S]*?^```\s*$/gm, "").replace(/^\s*>\s?/gm, "").trim();
    if (prose.length > 900) errors.push(`${section.title} has ${prose.length} characters of prose; keep it under about 900.`);
  }
  for (const fence of extractFences(markdown)) {
    if (/\bfile\b/.test(fence.info) && !/\btitle=["'][^"']+["']/.test(fence.info)) errors.push(`File block at line ${fence.line} needs a title path.`);
    if (/\bverify=["']?run\b/.test(fence.info) && !/^(bash|sh|powershell)\b/.test(fence.info)) errors.push(`Executable block at line ${fence.line} needs bash, sh, or powershell.`);
  }
  const commonErrors = sections.find(({ title }) => title === "Common errors")?.body ?? "";
  if ([...commonErrors.matchAll(/^### .+/gm)].length < 3) errors.push("Common errors needs at least three error cases.");
  const quiz = sections.find(({ title }) => title === "Quiz")?.body ?? "";
  if ([...quiz.matchAll(/^### Q\d+/gm)].length < 5) errors.push("Quiz needs at least five questions.");
  const recap = sections.find(({ title }) => title === "Recap")?.body ?? "";
  if ([...recap.matchAll(/^\s*-\s+\S/gm)].length !== 3) errors.push("Recap must contain exactly three bullets.");
  if (/\b(?:TODO|TBD)\b/.test(markdown) || /\b(?:lorem|etc\.)\b/i.test(markdown)) {
    errors.push("Remove placeholder text (TODO, TBD, lorem, or etc.).");
  }
  if (/\b(?:mkdir\s+-p|export\s+\w+=|cat\s+>|Set-Content|\$env:|Remove-Item)\b/.test(markdown) &&
      !/tab=["'](?:macOS \/ Linux|Windows PowerShell)["']/.test(markdown)) {
    errors.push("OS-specific commands need macOS/Linux and Windows PowerShell tabs.");
  }
  if (/verify="manual"/.test(markdown) && !/verify="manual"[^>\n]*\b(?:manual checked|manual review required)\s+\d{4}-\d{2}-\d{2}\s+(?:Linux|Windows|macOS)\b/i.test(markdown)) {
    errors.push("Manual blocks must state whether review is pending or checked, with a date and OS.");
  }
  return errors;
}

export async function loadLessons({ withHighlights = false } = {}) {
  let entries;
  try {
    entries = await readdir(lessonsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return Promise.all(entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).sort((a, b) => a.name.localeCompare(b.name)).map(async (entry) => {
    const source = await readFile(join(lessonsDir, entry.name), "utf8");
    const lesson = parseLesson(source);
    return {
      ...lesson.metadata,
      markdown: lesson.markdown,
      ...(withHighlights ? { highlightedCode: await highlightLesson(extractFences(lesson.markdown)) } : {})
    };
  }));
}

async function lint() {
  const programs = await loadPrograms();
  const programCodes = new Map(programs.map((program) => [program.code, program]));
  const names = (await readdir(lessonsDir)).filter((name) => name.endsWith(".md")).sort();
  let failed = false;
  for (const name of names) {
    const source = await readFile(join(lessonsDir, name), "utf8");
    const errors = validateLesson(source, name, programCodes);
    if (errors.length) {
      failed = true;
      console.error(`${name}:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
    } else console.log(`PASS ${name}`);
  }
  if (!names.length) throw new Error("No lesson files found.");
  if (failed) process.exitCode = 1;
  else console.log(`Validated ${names.length} lesson(s).`);
}

async function verify(id) {
  const names = (await readdir(lessonsDir)).filter((name) => name.endsWith(".md") && (!id || name === `${id}.md`)).sort();
  if (!names.length) throw new Error(id ? `No lesson found for ${id}.` : "No lesson files found.");
  const programs = await loadPrograms();
  const codes = new Map(programs.map((program) => [program.code, program]));
  const workspace = await mkdtemp(join(tmpdir(), "aistack-lessons-"));
  let failed = false;
  try {
    for (const name of names) {
      const source = await readFile(join(lessonsDir, name), "utf8");
      const errors = validateLesson(source, name, codes);
      if (errors.length) {
        failed = true;
        console.error(`FAIL ${name}: ${errors.join("; ")}`);
        continue;
      }
      const { markdown } = parseLesson(source);
      const blocks = extractFences(markdown);
      const workdir = join(workspace, name.replace(/\.md$/, ""));
      await mkdir(workdir);
      let currentDirectory = workdir;
      let commandsRun = 0;
      for (let index = 0; index < blocks.length; index += 1) {
        const block = blocks[index];
        if (!/\bfile\b/.test(block.info)) {
          if (!/\bverify=["']?run\b/.test(block.info)) continue;
          const shell = block.info.startsWith("powershell") ? ["pwsh", ["-NoProfile", "-Command", block.body]] : ["bash", ["-e", "-o", "pipefail", "-c", block.body]];
          if (shell[0] === "bash") shell[1][shell[1].length - 1] += '\nprintf "\\n__LESSON_PWD__%s\\n" "$PWD"';
          const result = spawnSync(shell[0], shell[1], { cwd: currentDirectory, encoding: "utf8", timeout: 20_000, maxBuffer: 1024 * 1024 });
          commandsRun += 1;
          const expectedFailure = /\bexpect="failure"/.test(block.info);
          if (result.error || (expectedFailure ? result.status === 0 : result.status !== 0)) {
            failed = true;
            console.error(`FAIL ${name}:${block.line}: command exited ${result.status ?? "with an error"}${expectedFailure ? " (a failure was expected)" : ""}\n${result.stderr || result.error?.message || ""}`);
            continue;
          }
          let actualText = `${result.stdout}${result.stderr}`.replace(/\r\n/g, "\n");
          const currentDirectoryMatch = actualText.match(/__LESSON_PWD__([^\r\n]+)/);
          if (currentDirectoryMatch) {
            const nextDirectory = resolve(currentDirectoryMatch[1]);
            const relativeDirectory = relative(workspace, nextDirectory);
            if (relativeDirectory.startsWith(`..${sep}`) || relativeDirectory === ".." || isAbsolute(relativeDirectory)) {
              failed = true;
              console.error(`FAIL ${name}:${block.line}: command changed into a directory outside its temporary workspace.`);
              continue;
            }
            currentDirectory = nextDirectory;
            actualText = actualText.replace(/\n?__LESSON_PWD__[^\r\n]*/g, "");
          }
          actualText = actualText.trim();
          let expectedIndex = index + 1;
          while (blocks[expectedIndex] && /\btab=/.test(blocks[expectedIndex].info) && !/\btitle=["']Expected output["']/.test(blocks[expectedIndex].info)) expectedIndex += 1;
          const expected = blocks[expectedIndex];
          if (!expected || !/\btitle=["']Expected output["']/.test(expected.info)) {
            failed = true;
            console.error(`FAIL ${name}:${block.line}: executable block needs an Expected output fence after its command block.`);
            continue;
          }
          const expectedLines = expected.body.split("\n").map((line) => line.trim()).filter((line) => line && !/^(?:#|.*(?:varies|unique to you).*)$/i.test(line));
          const matchesExpected = (line) => {
            const pattern = new RegExp(line.split("...").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*"), "s");
            return pattern.test(actualText);
          };
          if (expectedLines.some((line) => !matchesExpected(line))) {
            failed = true;
            console.error(`FAIL ${name}:${block.line}: command output did not match the expected output.\nExpected:\n${expected.body}\nActual:\n${actualText}`);
          }
        } else {
          const match = block.info.match(/\btitle=["']([^"']+)["']/);
          if (!match) continue;
          const filename = resolve(currentDirectory, match[1]);
          const rel = relative(currentDirectory, filename);
          if (!rel || rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) {
            failed = true;
            console.error(`FAIL ${name}:${block.line}: file path escapes the temporary lesson directory.`);
            continue;
          }
          await mkdir(dirname(filename), { recursive: true });
          await writeFile(filename, block.body);
        }
      }
      if (commandsRun) console.log(`PASS ${name}: ${commandsRun} command(s) executed.`);
      else console.log(`PASS ${name}: structure valid; all execution is marked manual or illustrative.`);
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
  if (failed) process.exitCode = 1;
}

async function coverage() {
  const [programs, lessons] = await Promise.all([loadPrograms(), loadLessons()]);
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  for (const program of programs) {
    const lesson = lessonById.get(program.code);
    if (!lesson) {
      console.log(`— ${program.code} ${program.title}`);
      continue;
    }
    const verifyBody = extractSections(lesson.markdown).find(({ title }) => title === "Verify against the requirements")?.body ?? "";
    const mappings = [...verifyBody.matchAll(/^\s*-\s*\[[ x]\]\s*(.+?(?:→|->)\s*Steps?\s*\d+.*)$/gm)].map((match) => match[1]);
    const criteria = extractAcceptanceCriteria(program.body);
    console.log(`✓ ${program.code} ${program.title} — ${criteria.length} source criterion/criteria; ${mappings.length} step-linked evidence item(s)`);
    for (const criterion of criteria) console.log(`  Acceptance: ${criterion}`);
    for (const mapping of mappings) console.log(`  Evidence: ${mapping}`);
  }
  console.log(`\n${lessonById.size}/${programs.length} programs have lessons.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, id] = process.argv.slice(2);
  if (command === "lint") await lint();
  else if (command === "verify") await verify(id);
  else if (command === "coverage") await coverage();
  else {
    console.error("Usage: node apps/web/lessons.mjs <lint|verify [ID]|coverage>");
    process.exitCode = 2;
  }
}
