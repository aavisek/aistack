import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cheatSheetFor, cheatSheetId, cheatSheetInfo, cheatSheetNavigation, listCheatSheetGroups, listCheatSheets, renderCheatSheetPage } from "./cheatsheets.mjs";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

test("cheat sheets are connected to their lessons only", () => {
  assert.equal(cheatSheetFor("PY-02")?.title, "Python Numbers, Booleans & Operators");
  assert.equal(cheatSheetFor("PY-03")?.title, "Python Strings: Index, Slice & Encoding");
  assert.equal(cheatSheetFor("PY-01")?.title, "Python Tuples & Membership Testing");
  assert.equal(cheatSheetFor("PY-04")?.title, "Python Lists");
  for (const id of Array.from({ length: 17 }, (_, index) => `PY-${String(index + 5).padStart(2, "0")}`)) assert.ok(cheatSheetFor(id), id);
  assert.equal(cheatSheetFor("FD-01"), undefined);
  assert.equal(cheatSheetFor("__proto__"), undefined);
  assert.equal(cheatSheetId("22"), "PY-22");
  assert.equal(cheatSheetId("PY-22"), "PY-22");
  assert.equal(cheatSheetId("999"), undefined);
});

test("the cheat sheet index lists every topic-wise reference", () => {
  const sheets = listCheatSheets();
  assert.equal(sheets.length, 59);
  assert.deepEqual(sheets.find((sheet) => sheet.id === "PY-46"), {
    id: "PY-46",
    number: 46,
    title: "Python Imports",
    groupId: "functions",
    groupTitle: "4. Functions and modular programming",
    required: true
  });
  assert.ok(sheets.every(({ id, title }) => /^PY-\d{2}$/.test(id) && title.length > 0));
  assert.equal(new Set(sheets.map(({ number }) => number)).size, sheets.length);
  assert.deepEqual(sheets.find(({ id }) => id === "PY-22")?.number, 22);
});

test("the cheat sheet tree includes placeholders for pending curriculum groups", () => {
  const groups = listCheatSheetGroups();
  assert.equal(groups.length, 10);
  assert.deepEqual(groups.find(({ id }) => id === "functions")?.topics.map(({ id }) => id), [
    "PY-35", "PY-36", "PY-37", "PY-38", "PY-39", "PY-40",
    "PY-41", "PY-42", "PY-43", "PY-44", "PY-45", "PY-46"
  ]);
  assert.equal(groups.find(({ id }) => id === "files-data-apis-databases")?.priority, "HIGH PRIORITY");
});

test("cheat sheets provide previous and next navigation in topic order", () => {
  assert.deepEqual(cheatSheetNavigation("PY-01"), {
    position: 1,
    total: 59,
    previous: null,
    next: { id: "PY-02", title: "Python Numbers, Booleans & Operators" }
  });
  assert.deepEqual(cheatSheetNavigation("PY-02"), {
    position: 2,
    total: 59,
    previous: { id: "PY-01", title: "Python Tuples & Membership Testing" },
    next: { id: "PY-03", title: "Python Strings: Index, Slice & Encoding" }
  });
  assert.deepEqual(cheatSheetNavigation("PY-46"), {
    position: 33,
    total: 59,
    previous: { id: "PY-45", title: "Python Imports, Modules and __init__.py" },
    next: { id: "PY-47", title: "List Comprehensions" }
  });
  assert.equal(cheatSheetNavigation("FD-01"), undefined);
});

test("cheat sheet pages render as images and out-of-range pages are rejected", async () => {
  const info = await cheatSheetInfo("PY-02");
  assert.ok(info.pageCount > 0);
  const image = await renderCheatSheetPage("PY-02", 1);
  assert.deepEqual(image.subarray(0, 4), pngSignature);
  assert.equal(await renderCheatSheetPage("PY-02", info.pageCount + 1), undefined);
  assert.equal(await renderCheatSheetPage("PY-02", 0), undefined);
  assert.equal(await renderCheatSheetPage("PY-02", Number.NaN), undefined);
  assert.equal(await renderCheatSheetPage("FD-01", 1), undefined);
});

test("the lesson reader links the cheat sheet from the final recap card", async () => {
  const app = await readFile(new URL("./public/app.js", import.meta.url), "utf8");
  assert.match(app, /cards\.push\(\{ title: "Recap"[^\n]*#cheatsheet\//);
  assert.match(app, /Previous cheat sheet/);
  assert.match(app, /Next cheat sheet/);
  assert.doesNotMatch(app, /\/course_details\//);
});
