import test from "node:test";
import assert from "node:assert/strict";
import { loadPrograms, parsePrograms } from "./course.mjs";

test("source content has 170 unique readable programs with the expected track counts", async () => {
  const programs = await loadPrograms();
  assert.equal(programs.length, 170);
  assert.equal(new Set(programs.map((program) => program.code)).size, 170);
  for (const [track, count] of Object.entries({ FD: 12, TS: 100, NS: 42, PG: 16 })) {
    assert.equal(programs.filter((program) => program.code.startsWith(track)).length, count);
  }
  assert.match(programs.find((program) => program.code === "TS-01").body, /strictNullChecks/);
  assert.ok(programs.every((program) => program.body.length > 0));
});

test("program content stops before unrelated roadmap headings", () => {
  const programs = parsePrograms("### FD-01 Git\n- **Objective:** Learn Git.\n## Next track\nNot part of Git\n### TS-01 Types\n- **Objective:** Learn types.");
  assert.equal(programs.length, 2);
  assert.equal(programs[0].body, "- **Objective:** Learn Git.");
});
