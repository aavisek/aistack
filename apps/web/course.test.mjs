import test from "node:test";
import assert from "node:assert/strict";
import { loadPrograms, parsePrograms } from "./course.mjs";

test("source content has 172 unique readable programs with the expected track counts", async () => {
  const programs = await loadPrograms();
  assert.equal(programs.length, 172);
  assert.equal(new Set(programs.map((program) => program.code)).size, 172);
  for (const [track, count] of Object.entries({ FD: 12, TS: 100, NS: 42, PG: 16, PY: 2 })) {
    assert.equal(programs.filter((program) => program.code.startsWith(track)).length, count);
  }
  assert.match(programs.find((program) => program.code === "TS-01").body, /strictNullChecks/);
  assert.match(programs.find((program) => program.code === "PY-01").title, /Objects - Mutable and Immutable in Python/);
  assert.match(programs.find((program) => program.code === "PY-02").title, /Numbers, Booleans & Operators in Python/);
  assert.ok(programs.every((program) => program.body.length > 0));
});

test("program content stops before unrelated roadmap headings", () => {
  const programs = parsePrograms("### FD-01 Git\n- **Objective:** Learn Git.\n## Next track\nNot part of Git\n### TS-01 Types\n- **Objective:** Learn types.\n### PY-01 Python\n- **Objective:** Learn Python.\n### PY-02 Numbers\n- **Objective:** Use numbers.");
  assert.equal(programs.length, 4);
  assert.equal(programs[0].body, "- **Objective:** Learn Git.");
  assert.equal(programs[2].code, "PY-01");
  assert.equal(programs[3].code, "PY-02");
});
