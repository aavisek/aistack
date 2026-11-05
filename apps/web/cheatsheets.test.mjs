import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cheatSheetFor, cheatSheetInfo, renderCheatSheetPage } from "./cheatsheets.mjs";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

test("cheat sheets are connected to their lessons only", () => {
  assert.equal(cheatSheetFor("PY-02")?.title, "Python Numbers, Booleans & Operators");
  assert.equal(cheatSheetFor("PY-03")?.title, "Python Strings: Index, Slice & Encoding");
  assert.equal(cheatSheetFor("PY-01")?.title, "Python Tuples & Membership Testing");
  assert.equal(cheatSheetFor("PY-04")?.title, "Python Lists");
  for (const id of Array.from({ length: 17 }, (_, index) => `PY-${String(index + 5).padStart(2, "0")}`)) assert.ok(cheatSheetFor(id), id);
  assert.equal(cheatSheetFor("FD-01"), undefined);
  assert.equal(cheatSheetFor("__proto__"), undefined);
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
  assert.doesNotMatch(app, /\/course_details\//);
});
