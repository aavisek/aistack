import test from "node:test";
import assert from "node:assert/strict";
import { loadPrograms, parsePrograms } from "./course.mjs";

test("source content has 204 unique readable programs with the expected track counts", async () => {
  const programs = await loadPrograms();
  assert.equal(programs.length, 204);
  assert.equal(new Set(programs.map((program) => program.code)).size, 204);
  for (const [track, count] of Object.entries({ FD: 12, TS: 100, NS: 42, PG: 16, PY: 34 })) {
    assert.equal(programs.filter((program) => program.code.startsWith(track)).length, count);
  }
  assert.match(programs.find((program) => program.code === "TS-01").body, /strictNullChecks/);
  assert.match(programs.find((program) => program.code === "PY-01").title, /Objects - Mutable and Immutable in Python/);
  assert.match(programs.find((program) => program.code === "PY-02").title, /Numbers, Booleans & Operators in Python/);
  assert.match(programs.find((program) => program.code === "PY-03").title, /Strings, Indexing, Slicing & Encoding in Python/);
  assert.match(programs.find((program) => program.code === "PY-04").title, /Lists, Methods & Operators in Python/);
  for (const [code, title] of [["PY-05", /Sets & Frozensets in Python/], ["PY-06", /Dictionaries in Python/], ["PY-07", /The collections Module/], ["PY-08", /Choosing the Right Type/], ["PY-09", /Operator Overloading & bytearray/]]) {
    assert.match(programs.find((program) => program.code === code).title, title);
  }
  assert.ok(programs.every((program) => program.body.length > 0));
});

test("program content stops before unrelated roadmap headings", () => {
  const programs = parsePrograms("### FD-01 Git\n- **Objective:** Learn Git.\n## Next track\nNot part of Git\n### TS-01 Types\n- **Objective:** Learn types.\n### PY-01 Python\n- **Objective:** Learn Python.\n### PY-02 Numbers\n- **Objective:** Use numbers.");
  assert.equal(programs.length, 4);
  assert.equal(programs[0].body, "- **Objective:** Learn Git.");
  assert.equal(programs[2].code, "PY-01");
  assert.equal(programs[3].code, "PY-02");
});
