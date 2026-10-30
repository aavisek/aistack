import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("portal shell exposes the planned navigation", async () => {
  const html = await readFile(new URL("./public/index.html", import.meta.url), "utf8");
  for (const label of ["Today", "Learning path", "Review", "Saved", "Me"]) {
    assert.match(html, new RegExp(label));
  }
});

test("portal includes the four roadmap track totals", async () => {
  const app = await readFile(new URL("./public/app.js", import.meta.url), "utf8");
  for (const total of ["count: 12", "count: 100", "count: 42", "count: 16"]) {
    assert.match(app, new RegExp(total));
  }
});
