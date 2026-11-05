# Backend Developer Course — Program Requirements Specification

**Scope:** 191 unique programs — 12 Foundations (FD-01 to FD-12), 100 TypeScript (TS-01 to TS-100), 42 NestJS/Redis/BullMQ/AI (NS-01 to NS-42), 16 PostgreSQL (PG-01 to PG-16), and 21 Python topics (PY-01 to PY-21).
**Beginner note:** Start with Part 0 and follow the *Recommended Learning Order* table in it.
**Source:** "Backend Developer Course for AI.txt". Duplicates removed: the PostgreSQL list appeared three times in the source (kept once), and the second NestJS 'Top 30' list overlapped with the first in 28 of 30 items (only 2 new programs added). The third list, a 'Top 50', overlapped in 39 of 50 items and added 11 new programs (NS-33 to NS-42 and PG-16). All overlaps are mapped in Part C.
**How to use:** Each program has the same blocks: **Objective**, **Requirements** (what to build), **Input → Output**, **Acceptance criteria** (what "done" means), and **Tests** (minimum checks to write). Tick the checkbox when done.

---

## Global Conventions (apply to every program unless the program says otherwise)

**TypeScript (TS-xx)**
- Node.js 20+ and TypeScript 5.x. `tsconfig.json` must have `"strict": true`, `"noImplicitAny": true`, `"noUncheckedIndexedAccess": true`.
- Do not use `any` unless the program is explicitly about `any`. Use `unknown` and narrow it.
- One folder per program: `ts-XX-name/src/index.ts` (code), `ts-XX-name/src/index.test.ts` (tests). Run with `tsx` or `ts-node`; test with Vitest or Jest.
- Type-level programs (Levels 4 and 7) are tested with compile-time assertions (an `Equal<A, B>` / `Expect<T>` helper, or `expectTypeOf`), not only runtime tests.
- "Compile error expected" tests use `// @ts-expect-error` so the test file fails to compile if the error disappears.

**NestJS (NS-xx)**
- NestJS 10+, Node.js 20+, TypeScript strict mode, pnpm or npm. Generate with the Nest CLI. One app (or one module in a shared monorepo) per program.
- Each program ships a `README.md` with run steps, env variables and sample `curl` calls. Use `.env.example` for configuration; never commit secrets.
- Use Docker Compose for any external service (Postgres, Redis, RabbitMQ, etc.).

**PostgreSQL (PG-xx)**
- PostgreSQL 15+ (16 recommended). Run in Docker. Each program is delivered as ordered SQL scripts: `01_schema.sql`, `02_seed.sql`, `03_queries.sql`, `99_cleanup.sql` plus a short `NOTES.md` with the results observed.
- Scripts must be re-runnable (use `DROP ... IF EXISTS` in cleanup or `CREATE ... IF NOT EXISTS`).

**Assumptions about unclear source wording** (corrected silently where the source text looked garbled):
- TS-35 means `getLength<T extends { length: number }>(arg: T): number`.
- TS-36 means `getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`.
- TS-38 means `PaginatedResult<T = string>` (a default generic argument).
- TS-49 means `MyPick<T, K extends keyof T>`.
- TS-56 means `` type Event = `${"click" | "hover"}:${"button" | "link"}` ``.

---

## Contents
- Part 0 — Beginner Foundations: FD-01 … FD-12 (plus a recommended learning order)
- Part A — TypeScript: TS-01 … TS-100
- Part B — NestJS Roadmap A: NS-01 … NS-30
- Part C — NestJS additions (NS-31 … NS-42) and duplicate mapping tables for the 2nd and 3rd lists
- Part D — PostgreSQL: PG-01 … PG-16
- Part E — Python: PY-01 … PY-21

---

# PART 0 — Foundations for Beginners (FD-01 to FD-12)

*Do these first if you are new to backend development. They need no frameworks and build the habits that every later program assumes. Folder convention: `fd-XX-name/` with a `README.md` stating how to run it.*

### FD-01 Git & npm Essentials
- [ ] **Objective:** Use version control and the Node package manager confidently.
- **Requirements:**
  - Create a repo with `git init`; make at least 5 meaningful commits with clear messages; create and merge a feature branch; resolve one deliberate merge conflict.
  - Add a `.gitignore` (`node_modules`, `.env`, `dist`); push to a GitHub repo.
  - `npm init`; install one dependency and one dev dependency; add `scripts` for `start`, `dev`, `test`, `build`; explain `package.json` vs `package-lock.json`.
  - Use `.env` plus `.env.example`; show that `.env` is never committed.
- **Input → Output:** A pushed repository with a readable history.
- **Acceptance criteria:** Fresh clone + `npm install` + `npm start` works; `git log --oneline` shows 5+ commits; no secrets in history.
- **Tests:** Clone into a new folder and run the scripts.

### FD-02 HTTP & REST Basics (curl and Postman)
- [ ] **Objective:** Understand requests, responses and REST conventions before writing a server.
- **Requirements:**
  - Using a public practice API (e.g. JSONPlaceholder or httpbin), send `GET`, `POST`, `PUT`, `PATCH`, `DELETE` requests with `curl` and Postman.
  - Record in a `NOTES.md` table: method, URL, request headers, body, response status, key response headers (`Content-Type`, `Cache-Control`).
  - Demonstrate status classes: 200, 201, 204, 301, 400, 401, 403, 404, 429, 500.
  - Demonstrate query params vs path params vs JSON body; send a header-based auth token; create a Postman collection with 8+ requests and environment variables; export it.
  - Write a one-page REST naming guide (plural nouns, nesting, idempotency of each method).
- **Input → Output:** Postman collection (`.json`) and `NOTES.md`.
- **Acceptance criteria:** Each status class demonstrated with a real response; idempotency of `PUT` vs `POST` proven by repeating the call.
- **Tests:** Run the collection with Newman (`newman run`) and see all checks pass.

### FD-03 Node.js Basics: Modules, `fs`, `path` & a Small CLI
- [ ] **Objective:** Get comfortable with Node's runtime and core modules.
- **Requirements:**
  - Build a CLI `notes` with commands `add "text"`, `list`, `done <id>`, `remove <id>` storing data in `notes.json` using `fs/promises` and `path`.
  - Read arguments from `process.argv`; exit with code 1 and a clear message on bad input.
  - Use ES modules (`import`) and split code into at least 3 files.
  - Handle missing/corrupt JSON file without crashing.
  - Read config from `process.env`.
- **Input → Output:** `node notes.js add "Buy milk"` → `Added note #1`.
- **Acceptance criteria:** Data persists between runs; IDs never repeat; invalid commands print usage.
- **Tests:** Run the commands in sequence against a temp file; at least 5 automated tests with `node:test` or Vitest.

### FD-04 Async JavaScript: Callbacks → Promises → `async/await`
- [ ] **Objective:** Understand how asynchronous code actually runs.
- **Requirements:**
  - Explain and demonstrate the event loop with `setTimeout`, `setImmediate`, `process.nextTick` and promise microtasks; predict the log order, then verify it.
  - Implement the same task (read three files, then sum their numbers) three ways: nested callbacks, promise chains, `async/await`.
  - Show sequential vs parallel execution with `Promise.all`; measure the time difference.
  - Demonstrate error handling: `try/catch` with `await`, `.catch`, unhandled rejection, and `Promise.allSettled`.
  - Write a `sleep(ms)` helper and a `retry(fn, times)` helper.
- **Input → Output:** Console output with timings and ordering explanations.
- **Acceptance criteria:** Predicted vs actual order written down and correct; parallel version is measurably faster; no unhandled rejections.
- **Tests:** Tests for `sleep` and `retry` (succeeds on 3rd try, fails after the limit).

### FD-05 A Plain Node.js HTTP Server (No Framework)
- [ ] **Objective:** See what frameworks hide.
- **Requirements:**
  - Use only the built-in `http` module. Routes: `GET /` (HTML), `GET /api/time` (JSON), `GET /api/echo?msg=...`, `POST /api/echo` (JSON body), anything else → 404 JSON.
  - Parse the URL and query string manually (`URL` / `URLSearchParams`); read and parse the request body stream; return 400 on invalid JSON; set `Content-Type` correctly.
  - Add a request log line (method, path, status, ms).
  - Graceful shutdown on `SIGINT`.
- **Input → Output:** `curl localhost:3000/api/echo?msg=hi` → `{"msg":"hi"}`.
- **Acceptance criteria:** Correct status codes (200/400/404/405); server does not crash on malformed input or large bodies (limit body to 1 MB → 413).
- **Tests:** 6+ tests with Node's `fetch` against a started server.

### FD-06 Express CRUD API (In-Memory)
- [ ] **Objective:** Build a first REST API with Express.
- **Requirements:**
  - Resource `books` (`id`, `title`, `author`, `year`): `GET /books` (with `?author=` filter and `?page=&limit=`), `GET /books/:id`, `POST /books`, `PUT /books/:id`, `PATCH /books/:id`, `DELETE /books/:id`.
  - Correct status codes (201 on create with `Location` header, 204 on delete, 404 when missing).
  - Routes in a router file, logic in a service file, data in an in-memory array (three layers).
  - A logging middleware and a 404 handler.
  - Write the whole thing in TypeScript.
- **Input → Output:** JSON responses per endpoint.
- **Acceptance criteria:** All 6 endpoints behave per REST conventions; restarting the server resets data (documented).
- **Tests:** Supertest tests for every endpoint including not-found cases.

### FD-07 Express Validation & Error Handling
- [ ] **Objective:** Make the API safe and predictable.
- **Requirements:**
  - Validate bodies with Zod (or Joi): `title` required string 1–100, `year` integer 0–current year; reject unknown fields.
  - Central error-handling middleware returning `{ error: { code, message, details? } }`; custom `AppError` classes (`NotFoundError`, `ValidationError`).
  - Wrap async handlers so rejected promises reach the error handler.
  - `helmet`, `cors` (explicit origin), JSON body size limit.
  - Never return stack traces when `NODE_ENV=production`.
- **Input → Output:** Invalid POST → 400 with a list of field errors.
- **Acceptance criteria:** Every failure path returns the same error shape; server stays up after any bad request.
- **Tests:** Valid, each invalid field, unknown field, malformed JSON, unexpected thrown error.

### FD-08 SQL Basics: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- [ ] **Objective:** Learn core SQL on PostgreSQL.
- **Requirements:**
  - Create tables `students(id, name, email UNIQUE, age, enrolled_at)` and `courses(id, title, credits)` with sensible types, `PRIMARY KEY`, `NOT NULL`, `DEFAULT`.
  - Insert ≥ 20 students and ≥ 8 courses (single and multi-row inserts).
  - Write ≥ 15 queries: `WHERE` with `AND/OR/IN/BETWEEN/LIKE/IS NULL`, `ORDER BY`, `LIMIT/OFFSET`, `DISTINCT`, aggregates `COUNT/SUM/AVG/MIN/MAX`.
  - `UPDATE` and `DELETE` with `WHERE`; show what happens without `WHERE` on a copy of the table (inside a transaction that you `ROLLBACK`).
  - Show `NULL` behaviour (`= NULL` vs `IS NULL`).
- **Input → Output:** `queries.sql` with a comment above each query stating the question it answers and its expected result.
- **Acceptance criteria:** All queries run without error; each has the expected result written next to it; unique constraint violation demonstrated.
- **Tests:** Compare row counts to the expected values noted in the file.

### FD-09 SQL Intermediate: `JOIN`s, `GROUP BY`, `HAVING` & Subqueries
- [ ] **Objective:** Combine tables and summarise data.
- **Requirements:**
  - Add `enrollments(student_id, course_id, grade, enrolled_on)` with composite PK and foreign keys.
  - Queries: `INNER`, `LEFT`, `RIGHT`, `FULL` join; students with no enrollment (`LEFT JOIN … IS NULL`); average grade per course; courses with more than 3 students (`HAVING`); top 3 students by average grade.
  - Subqueries in `WHERE`, `FROM` and `SELECT`; `EXISTS` vs `IN`; a simple CTE (`WITH`).
  - Create one `VIEW` and one index; show the effect with `EXPLAIN`.
- **Input → Output:** `queries.sql` with expected results.
- **Acceptance criteria:** Each join type's difference is shown with a result-count comparison; FK prevents enrolling a non-existent student.
- **Tests:** Result checks for each query.

### FD-10 PostgreSQL in Docker + Node with `pg` (Parameterised Queries)
- [ ] **Objective:** Connect an app to a real database safely, without an ORM.
- **Requirements:**
  - `docker-compose.yml` running PostgreSQL with a named volume; DB credentials in `.env`.
  - Migration script creating a `todos` table; seed script.
  - Express (from FD-06) rewritten to use `pg` `Pool` with **parameterised queries only** (`$1, $2`).
  - Repository layer (`TodoRepository`) separate from routes.
  - Demonstrate SQL injection: show a vulnerable string-concatenated query being exploited in a test, then the parameterised fix.
  - Graceful pool shutdown; transaction example (`BEGIN`/`COMMIT`/`ROLLBACK`).
- **Input → Output:** CRUD API persisting to Postgres; data survives restarts.
- **Acceptance criteria:** No string-built SQL anywhere in the app code; injection attempt returns no extra data; `docker compose down` + `up` keeps data.
- **Tests:** Integration tests against a test database; injection test.

### FD-11 Docker Basics
- [ ] **Objective:** Containerise and run services.
- **Requirements:**
  - Run Postgres and Redis containers with `docker run` (ports, env vars, volumes); inspect with `docker ps`, `logs`, `exec`, `stop`, `rm`.
  - Write a `Dockerfile` for the Express app (FD-06/FD-10): `node:20-alpine`, copy `package*.json` first for layer caching, `npm ci`, non-root user, `CMD`.
  - Write `.dockerignore`.
  - `docker-compose.yml` with `app`, `db`, `redis`; service names as hostnames; `depends_on` with a healthcheck.
  - Explain image vs container, layers, volumes vs bind mounts, and port mapping in `NOTES.md`.
- **Input → Output:** `docker compose up` starts the full stack.
- **Acceptance criteria:** App container reaches the DB by service name; rebuild after a code change is fast (cache hit on dependencies); container runs as non-root.
- **Tests:** `curl` health endpoint after `compose up`; `docker image ls` size recorded.

### FD-12 Redis Basics & a Simple Node Cache
- [ ] **Objective:** Learn core Redis commands and one practical use.
- **Requirements:**
  - Practise in `redis-cli`: strings (`SET/GET/INCR/EXPIRE/TTL`), lists (`LPUSH/RPOP`), hashes (`HSET/HGETALL`), sets, sorted sets (leaderboard with `ZADD/ZRANGE`); save commands in `commands.md` with explanations.
  - In Node (`ioredis`), cache the "get book by id" query from FD-10: check Redis first, otherwise read the DB and store with a 60 s TTL (cache-aside).
  - Delete the cache key on update/delete.
  - Add `X-Cache: HIT|MISS` response header and log the timing difference.
- **Input → Output:** Second identical request is faster and reports `HIT`.
- **Acceptance criteria:** No stale data after update; app still works (falls back to DB) if Redis is down.
- **Tests:** Hit/miss, invalidation, Redis-down fallback.

---

## Recommended Learning Order

| Stage | Programs | Notes |
|---|---|---|
| 1. Setup & web basics | FD-01, FD-02 | Tools and HTTP concepts. |
| 2. JavaScript/Node core | FD-03, FD-04, FD-05 | Needed before any framework. |
| 3. TypeScript basics | TS-01 → TS-30 | Primitives, functions, interfaces, unions. |
| 4. First APIs | FD-06, FD-07 | Express in TypeScript. |
| 5. SQL & databases | FD-08, FD-09, FD-10 | Do SQL before an ORM. |
| 6. Infra basics | FD-11, FD-12 | Docker and Redis. |
| 7. TypeScript intermediate | TS-31 → TS-45, TS-61 → TS-68, TS-76 → TS-80 | Generics, OOP, async, Node integration. |
| 8. NestJS core | NS-01 → NS-15 | Now the framework makes sense. |
| 9. PostgreSQL intermediate | PG-01 → PG-08 | Schema design, window functions, transactions. |
| 10. Queues, caching, real-time | NS-16 → NS-20, NS-33 → NS-37 | Redis and BullMQ. |
| 11. Testing & docs | NS-22 → NS-24 | Swagger, unit and e2e tests. |
| 12. Advanced | NS-21, NS-25 → NS-32, NS-38 → NS-42, PG-09 → PG-16 | Architecture, AI, operations. |

**Safe to skip or postpone as a beginner:** TS-46 → TS-60 and TS-86 → TS-92 (advanced type-level programming), TS-69 → TS-71 (decorators, until you reach NestJS), NS-39 (Redis Sentinel), NS-42 (Kafka), PG-14 → PG-16 (scaling and replication).

---

# PART A — TypeScript (100 programs)

## Level 1: Core Primitives & Functions (TS-01 to TS-15)

### TS-01 Hello World & Strict Typing
- [ ] **Objective:** Set up a strict TypeScript project and use every primitive type with explicit annotations.
- **Requirements:**
  - Declare one variable each of `string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol` with explicit annotations.
  - Print them with a `describe()` helper that returns `"<name>: <typeof value>"`.
  - Show that assigning a wrong type (e.g. `let n: number = "x"`) fails compilation, using `@ts-expect-error`.
  - Demonstrate `strictNullChecks`: `let s: string = null` must be an error.
- **Input → Output:** None (script) → console lines such as `age: number`.
- **Acceptance criteria:** `tsc --noEmit` passes; each deliberate error is covered by `@ts-expect-error`; no `any` in the code.
- **Tests:** `describe()` returns correct strings for all 7 primitives.

### TS-02 Typed Functions
- [ ] **Objective:** Write fully typed functions and prove runtime safety separately from compile-time safety.
- **Requirements:**
  - Implement `add(a: number, b: number): number`; also `subtract`, `multiply`, `divide`.
  - `divide` must throw `Error("Division by zero")` when divisor is `0`.
  - Add a runtime guard so that calling `add("1" as any, 2)` from untyped JS throws `TypeError`.
  - Show one arrow-function and one function-expression version with explicit return types.
- **Input → Output:** `add(2, 3)` → `5`; `divide(1, 0)` → throws.
- **Acceptance criteria:** Return types are explicit; compile fails when a string is passed; runtime guard works for JS callers.
- **Tests:** normal values, negatives, decimals, divide-by-zero, wrong runtime type.

### TS-03 Optional & Default Parameters
- [ ] **Objective:** Practise optional and default parameters.
- **Requirements:**
  - `greet(firstName: string, lastName: string, middleName?: string, title = "Guest"): string`.
  - Middle name appears only when provided; title defaults to `"Guest"`.
  - Passing `undefined` explicitly for `title` must still use the default.
- **Input → Output:** `greet("Ada","Lovelace")` → `"Guest Ada Lovelace"`; `greet("Ada","Lovelace","Augusta","Countess")` → `"Countess Ada Augusta Lovelace"`.
- **Acceptance criteria:** No extra spaces when middle name is missing; the optional param is typed `string | undefined`.
- **Tests:** with/without middle name, custom title, explicit `undefined`, empty-string middle name (treated as missing).

### TS-04 Rest Parameters
- [ ] **Objective:** Use rest parameters with typed arrays.
- **Requirements:**
  - `sumAll(...numbers: number[]): number`; returns `0` for no arguments.
  - Add `joinAll(separator: string, ...parts: string[]): string`.
  - Show spreading an existing array into the call.
  - Ignore (or reject, your choice, documented) `NaN`.
- **Input → Output:** `sumAll(1,2,3)` → `6`; `joinAll("-", "a","b")` → `"a-b"`.
- **Acceptance criteria:** Rest param is typed as an array; spread call compiles; empty call returns `0`.
- **Tests:** zero, one, many args; spread array; negative numbers; `NaN` behaviour.

### TS-05 Union Types & `typeof` Narrowing
- [ ] **Objective:** Narrow a union using `typeof`.
- **Requirements:**
  - `formatID(id: string | number): string`.
  - Number → zero-padded to 6 digits (`42` → `"ID-000042"`); string → trimmed and upper-cased (`" ab12 "` → `"ID-AB12"`).
  - Reject negative / non-integer numbers and empty strings with an `Error`.
  - Use an exhaustive `else` branch that TypeScript sees as `never`.
- **Input → Output:** `formatID(7)` → `"ID-000007"`.
- **Acceptance criteria:** Compiler knows the type inside each branch (no casts); invalid input throws.
- **Tests:** number, string, negative, float, empty/whitespace string.

### TS-06 Literal Types
- [ ] **Objective:** Restrict inputs with string and numeric literal types.
- **Requirements:**
  - `type Direction = "NORTH" | "SOUTH" | "EAST" | "WEST"`.
  - `move(pos: {x:number;y:number}, dir: Direction, steps = 1)` returns the new position (NORTH = +y, EAST = +x).
  - `turnRight(dir: Direction): Direction` and `turnLeft`.
  - Add `type DiceRoll = 1|2|3|4|5|6` and a `roll(): DiceRoll`.
- **Input → Output:** `move({x:0,y:0},"NORTH",3)` → `{x:0,y:3}`.
- **Acceptance criteria:** `move(p, "UP")` is a compile error; `turnRight("WEST")` returns `"NORTH"`.
- **Tests:** all four directions, four turn-right and turn-left cycles, `@ts-expect-error` for invalid literal.

### TS-07 Basic Arrays
- [ ] **Objective:** Work with typed arrays using both syntaxes.
- **Requirements:**
  - Declare `number[]` and `Array<string>` collections.
  - Write `filterEven(nums: number[])`, `toUpperAll(words: Array<string>)`, `unique<T>(items: T[])` (generic optional), `chunk(nums, size)`.
  - Do not mutate inputs; return new arrays.
  - Handle empty arrays and `size <= 0` (throw).
- **Input → Output:** `chunk([1,2,3,4,5], 2)` → `[[1,2],[3,4],[5]]`.
- **Acceptance criteria:** Inputs unchanged after calls (assert with deep equality); pushing a wrong type is a compile error.
- **Tests:** empty array, single element, duplicates, immutability check, invalid chunk size.

### TS-08 Typed Tuples
- [ ] **Objective:** Model fixed-length tuples with named members.
- **Requirements:**
  - `type Point = [x: number, y: number]`; `type HttpStatus = [code: number, message: string]`.
  - `distance(a: Point, b: Point): number`; `describeStatus(s: HttpStatus): string`.
  - A `statuses` lookup returning `HttpStatus` for 200, 404, 500.
  - Add an optional-element tuple `[number, number, number?]` for 2D/3D points and a rest tuple example.
- **Input → Output:** `distance([0,0],[3,4])` → `5`; `describeStatus([404,"Not Found"])` → `"404 Not Found"`.
- **Acceptance criteria:** `[1]` or `[1,2,3]` for `Point` fails to compile; labels visible in editor hints.
- **Tests:** distance cases, known and unknown status codes, 2D vs 3D point.

### TS-09 Enums (Numeric vs String)
- [ ] **Objective:** Compare numeric and string enums with a real workflow.
- **Requirements:**
  - `enum OrderStatus { Pending, Paid, Shipped, Delivered, Cancelled }` (numeric) and a string-enum version.
  - `updateStatus(current, next)` allows only: Pending→Paid|Cancelled, Paid→Shipped|Cancelled, Shipped→Delivered. Everything else throws.
  - Show reverse mapping on the numeric enum and explain (in a comment) why string enums have none.
  - Provide `isTerminal(status)`.
- **Input → Output:** `updateStatus(OrderStatus.Pending, OrderStatus.Paid)` → `Paid`.
- **Acceptance criteria:** All illegal transitions throw with a clear message; both enum kinds work.
- **Tests:** every allowed transition, a sample of illegal ones, `isTerminal`.

### TS-10 `unknown` vs `any`
- [ ] **Objective:** Safely handle untrusted data with `unknown`.
- **Requirements:**
  - `parseUser(input: unknown): { name: string; age: number }`.
  - Validate: input is an object, `name` is non-empty string, `age` is integer 0–150.
  - Throw an error listing every failed field.
  - Include a short comparison file showing the same code with `any` compiling but crashing at runtime.
- **Input → Output:** `{name:"Ann",age:30}` → same object; `"abc"` → throws.
- **Acceptance criteria:** No `any` in the safe version; no type assertions that bypass the checks.
- **Tests:** valid, null, array, missing field, wrong types, boundary ages 0/150/151.

### TS-11 Type Assertions (`as`)
- [ ] **Objective:** Use assertions responsibly with DOM-style queries.
- **Requirements:**
  - Use `jsdom` (or a mocked DOM) to run `document.getElementById("app") as HTMLInputElement`.
  - Read/write `.value`; handle the `null` case explicitly before asserting.
  - Show `as unknown as T` as a last resort and document why it is unsafe.
  - Show the `!` non-null assertion vs a proper null check.
- **Input → Output:** Input element with value `"hi"` → read `"hi"`, then set `"bye"`.
- **Acceptance criteria:** Missing element is handled without a crash; wrong element type is detected with `instanceof`.
- **Tests:** element exists, element missing, element of the wrong type.

### TS-12 `void` and `never` Return Types
- [ ] **Objective:** Understand `void` and `never` return types.
- **Requirements:**
  - Event handler `onClick(e: ClickEvent): void`.
  - `fail(message: string): never` that always throws; `infiniteLoop(): never` (documented, not run).
  - Use `fail()` inside a function so TypeScript narrows after it (e.g. `const x = maybe ?? fail("missing")`).
  - Show that a `void` callback may return a value when assigned to a `() => void` type.
- **Input → Output:** `fail("boom")` → throws `Error("boom")`.
- **Acceptance criteria:** Code after a `fail()` call is flagged unreachable where appropriate; narrowing works.
- **Tests:** `fail` throws; helper using `fail` returns value when present.

### TS-13 Array Destructuring
- [ ] **Objective:** Destructure arrays and tuples with full inference.
- **Requirements:**
  - Swap two variables via destructuring; skip elements; use defaults; use rest (`[first, ...others]`).
  - Destructure a tuple returned by `useCounter(): [number, () => void]` (React-hook style).
  - Destructure inside function parameters.
- **Input → Output:** `[a, b] = [b, a]` swaps values.
- **Acceptance criteria:** Hover/inferred types are correct (assert with `expectTypeOf`); no explicit annotations needed on destructured variables.
- **Tests:** swap, skip, defaults with `undefined`, rest, tuple return.

### TS-14 Function Overloading
- [ ] **Objective:** Write overloaded signatures with a single implementation.
- **Requirements:**
  - `formatDate(input: number): string`, `(input: Date): string`, `(input: string): string`.
  - Output format `YYYY-MM-DD` (UTC). Timestamps are milliseconds. Invalid strings throw `RangeError`.
  - Implementation signature is not publicly callable.
  - Add an overload with a second `format: "iso" | "short"` parameter.
- **Input → Output:** `formatDate(0)` → `"1970-01-01"`.
- **Acceptance criteria:** All three call shapes compile; `formatDate(true)` is a compile error.
- **Tests:** each input type, invalid date string, both `format` options.

### TS-15 Type Aliases
- [ ] **Objective:** Model data with reusable `type` aliases.
- **Requirements:**
  - `Point2D`, `Rectangle` (position + width + height), `Circle`, `Shape = Rectangle | Circle`.
  - Functions: `area(shape)`, `perimeter(shape)`, `translate(shape, dx, dy)` (immutable).
  - Use a `kind` field so `Shape` can be narrowed.
- **Input → Output:** `area({kind:"rect",...,width:2,height:3})` → `6`.
- **Acceptance criteria:** Aliases are reused (no repeated inline object types); `translate` returns a new object.
- **Tests:** area and perimeter of both shapes, translate immutability.

---

## Level 2: Interfaces & Object Modeling (TS-16 to TS-30)

### TS-16 User Interface
- [ ] **Objective:** Practise required, optional and `readonly` properties.
- **Requirements:**
  - `interface UserProfile { readonly id: string; name: string; email: string; bio?: string; }`.
  - `createUser(name, email, bio?)` generates a UUID id; `updateUser(user, patch)` returns a new object and never changes `id`.
  - Email validated with a simple regex.
- **Input → Output:** `createUser("Ann","a@x.com")` → profile with a UUID `id`, no `bio`.
- **Acceptance criteria:** `user.id = "x"` is a compile error; `bio` can be omitted.
- **Tests:** create, update, id immutability (`@ts-expect-error`), invalid email.

### TS-17 Interface Extension
- [ ] **Objective:** Build an interface hierarchy.
- **Requirements:**
  - `Vehicle { make; model; year; wheels: number }`; `Car extends Vehicle { doors: number }`; `ElectricCar extends Car { batteryKWh: number; rangeKm: number }`.
  - `describe(v: Vehicle)` works for all; `isElectric(v)` guard.
  - Provide `chargeTime(car: ElectricCar, chargerKW: number): number` in hours.
- **Input → Output:** `chargeTime({batteryKWh:60,...}, 30)` → `2`.
- **Acceptance criteria:** An `ElectricCar` can be passed anywhere a `Vehicle` is expected; missing `batteryKWh` fails to compile.
- **Tests:** describe for each level, chargeTime, guard.

### TS-18 Index Signatures
- [ ] **Objective:** Build a dynamic config cache.
- **Requirements:**
  - `interface ConfigCache { [key: string]: string | number }`.
  - `ConfigStore` with `set`, `get`, `has`, `delete`, `keys`, `getNumber(key)`/`getString(key)` that throw on wrong type.
  - Demonstrate `noUncheckedIndexedAccess` returning `T | undefined`.
  - Show a mixed interface (known keys + index signature) and why known keys must be compatible with the index type.
- **Input → Output:** `set("port",3000); getNumber("port")` → `3000`.
- **Acceptance criteria:** Reading a missing key yields `undefined` handled safely; wrong type read throws.
- **Tests:** CRUD, type mismatch, missing key.

### TS-19 Discriminated Unions
- [ ] **Objective:** Model async UI/request state.
- **Requirements:**
  - `IdleState | LoadingState | SuccessState<T> | ErrorState` each with a `status` literal; Success has `data`, Error has `error: Error`, Loading has optional `startedAt`.
  - `render(state)` returns a string per status; `reducer(state, action)` for actions `FETCH`, `RESOLVE`, `REJECT`, `RESET`.
  - Invalid transitions (e.g. `RESOLVE` while idle) are ignored or throw (document which).
- **Input → Output:** `reducer(idle, {type:"FETCH"})` → `{status:"loading"}`.
- **Acceptance criteria:** Accessing `state.data` without narrowing is a compile error.
- **Tests:** every transition, render output for every state.

### TS-20 Interface vs Type Alias Comparison
- [ ] **Objective:** Demonstrate real differences between `interface` and `type`.
- **Requirements:**
  - Build the same `Person`/`Employee` model with `interface … extends` and with `type … & …`.
  - Show: conflict handling when a property types clash (extends errors, intersection yields `never`), declaration merging (interface only), unions and mapped types (type only).
  - Write a `COMPARISON.md` summarising when to use which.
- **Input → Output:** Code + markdown table.
- **Acceptance criteria:** At least 4 differences are shown with compiling or `@ts-expect-error` examples.
- **Tests:** Compile-time assertions that both versions are mutually assignable.

### TS-21 Custom Type Guards (`is`)
- [ ] **Objective:** Write user-defined type predicates.
- **Requirements:**
  - `Fish { swim() }`, `Bird { fly() }`, `type Pet = Fish | Bird`.
  - `isFish(pet: Pet): pet is Fish`, `isBird`.
  - `move(pet: Pet)` calls `swim` or `fly` after narrowing.
  - Add `isString(x: unknown): x is string` and `isNonEmptyArray<T>(a: T[]): a is [T, ...T[]]`.
- **Input → Output:** `move(fish)` → `"swimming"`.
- **Acceptance criteria:** No casts used; guards return `false` for malformed objects.
- **Tests:** each guard with true/false inputs, `move` for both types.

### TS-22 Exhaustiveness Checking
- [ ] **Objective:** Force full coverage of a union.
- **Requirements:**
  - Use the `Shape` union (circle, square, triangle); `area(shape)` uses `switch` with a `default` that assigns `shape` to a `never` variable via `assertNever(x: never): never`.
  - Prove that adding a fourth shape makes compilation fail until handled (document with a commented example or a test using `@ts-expect-error`).
- **Input → Output:** Shapes → area numbers.
- **Acceptance criteria:** Removing a `case` causes a compile error.
- **Tests:** area for each shape; `assertNever` throws at runtime for bad JS input.

### TS-23 Nested Interfaces
- [ ] **Objective:** Model a complex nested order.
- **Requirements:**
  - `Order { id; customer: Customer; shippingAddress: ShippingAddress; items: OrderItem[]; createdAt: Date }`; `OrderItem { sku; name; unitPrice; quantity }`.
  - `orderTotal(order)`, `itemCount(order)`, `formatAddress(addr)`.
  - Validate: at least 1 item, quantity > 0, price ≥ 0.
- **Input → Output:** Order with 2 items → total as number (2 decimals).
- **Acceptance criteria:** Nested types are reused, not inlined; invalid orders throw.
- **Tests:** totals, empty items, negative quantity, address formatting.

### TS-24 Function Signatures in Interfaces
- [ ] **Objective:** Describe behaviour contracts in interfaces.
- **Requirements:**
  - `interface Calculator { add(a,b): number; subtract…; multiply…; divide… }`.
  - Provide a class implementing it and an object-literal implementation.
  - Add a call-signature interface: `interface BinaryOp { (a: number, b: number): number; label: string }`.
  - `calculate(op: keyof Calculator, a, b)`.
- **Input → Output:** `calculate("add",2,3)` → `5`.
- **Acceptance criteria:** Missing method in an implementation fails to compile.
- **Tests:** all four operations on both implementations; divide-by-zero.

### TS-25 Declaration Merging
- [ ] **Objective:** Observe interface merging.
- **Requirements:**
  - Declare `interface Settings { theme: string }` in one place and `interface Settings { language: string }` in another; an object must now provide both.
  - Merge function overloads in same-named interfaces (later declarations win ordering).
  - Show namespace + function merging.
  - Explain in comments when merging helps (extending library types) and when it is risky.
- **Input → Output:** Object with both properties compiles.
- **Acceptance criteria:** Missing either property is a compile error (`@ts-expect-error`).
- **Tests:** Compile-time checks.

### TS-26 Readonly Objects & Arrays
- [ ] **Objective:** Protect data from mutation.
- **Requirements:**
  - `Readonly<Config>` and `ReadonlyArray<string>`; functions accepting readonly inputs and returning new copies.
  - Show that `Readonly<T>` is shallow (nested object still mutable) and that `Object.freeze` gives runtime protection.
  - `updateConfig(cfg, patch)` immutably.
- **Input → Output:** Frozen config + patch → new config.
- **Acceptance criteria:** `cfg.port = 1` and `arr.push("x")` are compile errors; nested mutability is demonstrated and documented.
- **Tests:** immutability at compile and runtime (`Object.isFrozen`).

### TS-27 Object Merging with Intersections
- [ ] **Objective:** Merge objects with correct result types.
- **Requirements:**
  - `merge<A extends object, B extends object>(a: A, b: B): A & B`.
  - Right-hand values win on key collision at runtime; document the type-level behaviour on conflicts.
  - Do not mutate inputs; handle `null`/`undefined` inputs.
- **Input → Output:** `merge({a:1},{b:"x"})` → `{a:1,b:"x"}` typed `{a:number}&{b:string}`.
- **Acceptance criteria:** Result type exposes both objects' properties; inputs unchanged.
- **Tests:** disjoint keys, overlapping keys, empty object, immutability.

### TS-28 `in` Operator Narrowing
- [ ] **Objective:** Narrow unions by property existence.
- **Requirements:**
  - `Fish { swim() }`, `Bird { fly() }`, `Duck { swim(); fly() }`.
  - `act(pet: Fish | Bird | Duck): string[]` returns every ability using `"swim" in pet` and `"fly" in pet`.
  - Show that `in` also narrows `unknown` objects (with `typeof x === "object" && x !== null` first).
- **Input → Output:** Duck → `["swim","fly"]`.
- **Acceptance criteria:** No casts; correct narrowing for all three types.
- **Tests:** each animal, unknown-object case, null.

### TS-29 `instanceof` Narrowing
- [ ] **Objective:** Build a logger that handles different error classes.
- **Requirements:**
  - `class CustomValidationError extends Error { field: string }` (and one more subclass of your choice).
  - `logError(e: unknown): string` — `CustomValidationError` → `VALIDATION[field]: message`; `Error` → `ERROR: message`; other → `UNKNOWN: <String(e)>`.
  - Set prototype/name correctly so `instanceof` works after transpiling to ES5 target (document).
- **Input → Output:** `logError(new CustomValidationError("age","bad"))` → `"VALIDATION[age]: bad"`.
- **Acceptance criteria:** Handles thrown strings, numbers, null.
- **Tests:** all branches.

### TS-30 `as const` Assertions
- [ ] **Objective:** Freeze literals into deep readonly literal types.
- **Requirements:**
  - `const ROLES = ["admin","editor","guest"] as const; type Role = typeof ROLES[number]`.
  - `const CONFIG = { env: "prod", ports: [80, 443] } as const;` derive types from it.
  - `isRole(x: string): x is Role`; build a lookup object typed from the constant.
  - Compare with `Object.freeze` and enums.
- **Input → Output:** `typeof ROLES[number]` → `"admin"|"editor"|"guest"`.
- **Acceptance criteria:** Mutation attempts fail to compile; derived union stays in sync when the array changes.
- **Tests:** `isRole` true/false; type assertions for derived types.

---
## Level 3: Generics & Type Abstraction (TS-31 to TS-45)

### TS-31 Generic Identity Function
- [ ] **Objective:** Learn generic type parameters and inference.
- **Requirements:**
  - `identity<T>(arg: T): T`; `wrapInArray<T>(item: T): T[]`; `firstOf<T>(arr: T[]): T | undefined`.
  - Call with inferred and explicit type arguments.
  - Show that `identity("a")` infers the literal `"a"` for `const` type parameters (`identity<const T>`).
- **Input → Output:** `wrapInArray(5)` → `[5]` typed `number[]`.
- **Acceptance criteria:** No `any`; return types inferred precisely.
- **Tests:** strings, numbers, objects, `undefined` for empty array; type assertions.

### TS-32 Generic Stack Class
- [ ] **Objective:** Build a typed LIFO stack.
- **Requirements:**
  - `class Stack<T>` with `push(item)`, `pop(): T | undefined`, `peek(): T | undefined`, `isEmpty()`, `size`, `clear()`, `toArray()` (copy).
  - Optional max capacity in the constructor; pushing past it throws.
  - Internal storage is private.
- **Input → Output:** push 1,2 → pop → `2`.
- **Acceptance criteria:** `Stack<number>().push("x")` fails to compile; `toArray()` cannot mutate internals.
- **Tests:** LIFO order, empty pop/peek, capacity overflow, immutability of `toArray`.

### TS-33 Generic Queue Class
- [ ] **Objective:** Build a typed FIFO queue.
- **Requirements:**
  - `Queue<T>` with `enqueue`, `dequeue`, `peek`, `isEmpty`, `size`, iterable (`[Symbol.iterator]`).
  - `dequeue` must be O(1) amortised (use head index or linked nodes, not `shift()` in a loop).
- **Input → Output:** enqueue 1,2,3 → dequeue → `1`.
- **Acceptance criteria:** FIFO order; iteration does not consume the queue; 100,000-item benchmark runs under 100 ms.
- **Tests:** order, empty behaviour, iteration, performance smoke test.

### TS-34 Generic API Response
- [ ] **Objective:** Standard response envelope.
- **Requirements:**
  - `interface ApiResponse<T> { data: T; status: number; timestamp: number }`.
  - Helpers `ok<T>(data)` (status 200) and `fail(status, message)` returning `ApiResponse<null>` with an `error` field; use a discriminated union `ApiSuccess<T> | ApiFailure`.
  - `unwrap<T>(res)` returns data or throws.
- **Input → Output:** `ok({id:1})` → `{data:{id:1},status:200,timestamp:<ms>}`.
- **Acceptance criteria:** `data` type flows through to the caller; failure type cannot be read as data without narrowing.
- **Tests:** ok, fail, unwrap both paths, timestamp is recent.

### TS-35 Generic Constraints (`extends`)
- [ ] **Objective:** Constrain a generic by shape.
- **Requirements:**
  - `getLength<T extends { length: number }>(arg: T): number`.
  - Works for strings, arrays and custom objects with `length`; numbers are a compile error.
  - Add `longest<T extends { length: number }>(a: T, b: T): T`.
- **Input → Output:** `getLength("abc")` → `3`.
- **Acceptance criteria:** `getLength(5)` fails to compile.
- **Tests:** string, array, custom object, `@ts-expect-error` for number.

### TS-36 Property Access with `keyof`
- [ ] **Objective:** Type-safe property access.
- **Requirements:**
  - `getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`.
  - `setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): T` (immutable).
  - `pluck<T, K extends keyof T>(items: T[], key: K): T[K][]`.
- **Input → Output:** `getProperty({a:1,b:"x"},"b")` → `"x"` typed `string`.
- **Acceptance criteria:** Unknown key and wrong value type are compile errors.
- **Tests:** get/set/pluck; `@ts-expect-error` for bad keys.

### TS-37 Generic Array Helpers
- [ ] **Objective:** Re-implement `map`, `filter`, `reduce`.
- **Requirements:**
  - `myMap<T,U>(arr: readonly T[], fn: (item:T,index:number)=>U): U[]`; `myFilter` (with type-guard overload); `myReduce<T,U>(arr, fn, initial: U): U`.
  - Also `groupBy`, `zip`.
  - No use of the native methods inside the implementations.
- **Input → Output:** `myReduce([1,2,3],(a,b)=>a+b,0)` → `6`.
- **Acceptance criteria:** Results match native behaviour for a set of random inputs; `myFilter` with a type guard narrows the result type.
- **Tests:** compare each to native on sample data, empty arrays, index argument.

### TS-38 Default Generic Arguments
- [ ] **Objective:** Use default type parameters.
- **Requirements:**
  - `interface PaginatedResult<T = string> { items: T[]; page: number; pageSize: number; total: number; hasNext: boolean }`.
  - `paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T>`.
  - Validate `page >= 1`, `pageSize` 1–100.
- **Input → Output:** 25 items, page 2, size 10 → items 11–20, `hasNext: true`.
- **Acceptance criteria:** `PaginatedResult` with no argument means `string`; `hasNext` is correct on the last page.
- **Tests:** first/middle/last page, out-of-range page returns empty `items`, invalid args throw.

### TS-39 Generic Storage Wrapper
- [ ] **Objective:** Typed JSON storage on top of a `Storage`-like object.
- **Requirements:**
  - `class LocalStorageWrapper<T>` with `constructor(key, storage = inMemoryStorage)`, `get(): T | null`, `set(value: T)`, `remove()`.
  - Serialize with JSON; if parsing fails return `null` (or accept an optional validator `(x: unknown) => x is T`).
  - Provide an in-memory `Storage` implementation for tests.
- **Input → Output:** `set({a:1}); get()` → `{a:1}`.
- **Acceptance criteria:** Corrupted JSON does not throw; validator rejects wrong shapes.
- **Tests:** round-trip, missing key, corrupted value, validator failure.

### TS-40 Generic Event Emitter
- [ ] **Objective:** Strongly typed pub/sub.
- **Requirements:**
  - `class TypedEmitter<Events extends Record<string, unknown>>` with `on(event, handler)`, `off`, `once`, `emit(event, payload)`.
  - Example `Events = { login: {userId:string}; logout: void; error: Error }`.
  - `on` returns an unsubscribe function; emitting with the wrong payload is a compile error.
- **Input → Output:** `emitter.emit("login",{userId:"1"})` calls all login handlers.
- **Acceptance criteria:** Handler parameter type is inferred from the event name; one failing handler must not stop the others (catch and report).
- **Tests:** on/emit, off, once, unsubscribe, multiple handlers, compile errors.

### TS-41 Generic Dictionary / KeyValuePair
- [ ] **Objective:** Typed key-value structures.
- **Requirements:**
  - `class KeyValuePair<K, V>` with `getKey()`, `getValue()`, `setValue(v: V)`, `toString()`.
  - `class Dictionary<K, V>` built on `Map<K, V>` with `set/get/has/delete/entries/keys/values/size`.
  - Keys of object type use reference equality (document).
- **Input → Output:** `new KeyValuePair("a",1).getValue()` → `1`.
- **Acceptance criteria:** Wrong value type is a compile error; iteration order is insertion order.
- **Tests:** CRUD, size, iteration, object keys.

### TS-42 Merging Generic Objects
- [ ] **Objective:** Typed object combiner.
- **Requirements:**
  - `combineObjects<T extends object, U extends object>(obj1: T, obj2: U): T & U`.
  - Handle overlapping keys (second wins) and return a new object.
  - Add a variadic `combineAll` using a tuple-to-intersection helper (preview of TS-91).
- **Input → Output:** `combineObjects({a:1},{b:2})` → `{a:1,b:2}`.
- **Acceptance criteria:** Type of result has all props; inputs not mutated.
- **Tests:** disjoint, overlapping, nested objects (shallow), three-way `combineAll`.

### TS-43 Generic Linked List
- [ ] **Objective:** Singly linked list with node structures.
- **Requirements:**
  - `class ListNode<T> { value: T; next: ListNode<T> | null }`; `class LinkedList<T>`.
  - Methods: `append`, `prepend`, `insertAt(i)`, `removeAt(i)`, `find(predicate)`, `indexOf`, `reverse()` (in place), `toArray()`, `size`, iterator.
  - Out-of-range indexes throw `RangeError`.
- **Input → Output:** append 1,2,3; reverse → `[3,2,1]`.
- **Acceptance criteria:** All operations keep `size` correct; `append` is O(1) (keep a tail pointer).
- **Tests:** each method, empty list, single node, boundary indexes.

### TS-44 Generic Cache Strategy (TTL)
- [ ] **Objective:** In-memory TTL cache.
- **Requirements:**
  - `class TTLCache<K, V>` with `set(key, value, ttlMs?)`, `get(key)`, `has`, `delete`, `clear`, `size`.
  - Expired entries are never returned and are removed lazily on access plus an optional periodic sweep.
  - Optional `maxEntries` with least-recently-used eviction.
  - Inject a clock function so tests can control time.
- **Input → Output:** `set("a",1,1000)`; after 1001 ms `get("a")` → `undefined`.
- **Acceptance criteria:** No timers left running after `dispose()`; `maxEntries` is respected.
- **Tests:** hit, miss, expiry (fake clock), overwrite resets TTL, LRU eviction.

### TS-45 Multiple Generic Constraints
- [ ] **Objective:** Require several contracts at once.
- **Requirements:**
  - `interface Serializable { serialize(): string }`, `interface Identifiable { id: string }`.
  - `saveAll<T extends Serializable & Identifiable>(items: T[]): Record<string,string>` mapping id → serialized text.
  - Two sample classes satisfying both; one satisfying only one (compile error).
- **Input → Output:** Items with ids `a`,`b` → `{a:"…",b:"…"}`.
- **Acceptance criteria:** Missing either interface is a compile error; duplicate ids throw.
- **Tests:** valid items, duplicate ids, `@ts-expect-error` for partial implementers.

---

## Level 4: Built-in & Advanced Utility Types (TS-46 to TS-60)

> For all Level 4 programs: define an `Equal<A,B>` helper and assert each custom type equals the built-in (or expected) result using `Expect<Equal<…>>`. Include at least 3 test types per utility, including edge cases (empty object, optional props, unions).

### TS-46 Recreating `Partial<T>`
- [ ] **Objective:** Build `MyPartial<T>` as a mapped type.
- **Requirements:** `type MyPartial<T> = { [P in keyof T]?: T[P] }`; preserve `readonly` modifiers; apply to nested sample interface.
- **Input → Output:** `MyPartial<{a:number;b:string}>` → `{a?:number;b?:string}`.
- **Acceptance criteria:** `Equal<MyPartial<X>, Partial<X>>` is true for all samples.
- **Tests:** flat, readonly, optional-already, empty object.

### TS-47 Recreating `Required<T>`
- [ ] **Objective:** Build `MyRequired<T>` using `-?`.
- **Requirements:** `{ [P in keyof T]-?: T[P] }`; show it strips `undefined` from optional props only (not explicit `| undefined` on required ones).
- **Input → Output:** `{a?:number}` → `{a:number}`.
- **Acceptance criteria:** Equal to built-in `Required<T>`.
- **Tests:** optional, mixed, readonly+optional.

### TS-48 Recreating `Readonly<T>`
- [ ] **Objective:** Build `MyReadonly<T>`.
- **Requirements:** `{ readonly [P in keyof T]: T[P] }`; add `Mutable<T>` using `-readonly` as the inverse.
- **Input → Output:** `{a:number}` → `{readonly a:number}`.
- **Acceptance criteria:** Equal to built-in; assignment to a property is a compile error.
- **Tests:** flat, nested (stays shallow), `Mutable` round-trip.

### TS-49 Recreating `Pick<T, K>`
- [ ] **Objective:** Build `MyPick<T, K extends keyof T>`.
- **Requirements:** `{ [P in K]: T[P] }`; picking a non-key is a compile error.
- **Input → Output:** `MyPick<User,"id"|"name">` → `{id:…;name:…}`.
- **Acceptance criteria:** Equal to `Pick`; optional/readonly modifiers preserved.
- **Tests:** single key, union keys, optional prop, invalid key (`@ts-expect-error`).

### TS-50 Recreating `Omit<T, K>`
- [ ] **Objective:** Build `MyOmit<T, K extends keyof any>`.
- **Requirements:** Use `Pick<T, Exclude<keyof T, K>>` first, then rewrite with key remapping (`as`); explain why built-in `Omit` allows keys not in `T`.
- **Input → Output:** `MyOmit<User,"password">` → `User` without `password`.
- **Acceptance criteria:** Equal to built-in `Omit`.
- **Tests:** single/multiple keys, key not present, union type input.

### TS-51 Role Access Matrix with `Record<K, V>`
- [ ] **Objective:** Model permissions by role.
- **Requirements:**
  - `type Role = "admin"|"editor"|"guest"`; `type Feature = "read"|"write"|"delete"|"manage_users"`.
  - `const matrix: Record<Role, Record<Feature, boolean>>`; compile error if a role/feature is missing.
  - `can(role, feature): boolean`; `featuresFor(role): Feature[]`.
- **Input → Output:** `can("guest","write")` → `false`.
- **Acceptance criteria:** Adding a new `Role` forces updating the matrix at compile time.
- **Tests:** full matrix check, `featuresFor` for each role.

### TS-52 Conditional Types
- [ ] **Objective:** Learn `T extends U ? X : Y`.
- **Requirements:** `IsString<T>`, `IsArray<T>`, `ElementType<T>` (array → element else `T`), `NonFunctionKeys<T>`; show distributive behaviour over unions and how `[T] extends [U]` prevents it.
- **Input → Output:** `IsString<"a">` → `true`; `IsString<1|"a">` → `boolean`.
- **Acceptance criteria:** All results asserted with `Expect<Equal<…>>`.
- **Tests:** primitives, unions, `never`, `any`.

### TS-53 `Exclude` & `Extract`
- [ ] **Objective:** Filter unions.
- **Requirements:** Build `MyExclude` and `MyExtract`; use them to split `"click"|"hover"|"submit"|42|null` into strings vs non-strings; extract event names that start with `"on"` (using template literal).
- **Input → Output:** `MyExclude<"a"|"b"|"c","a">` → `"b"|"c"`.
- **Acceptance criteria:** Equal to built-ins.
- **Tests:** string unions, mixed unions, no match returns `never`.

### TS-54 Inferring with `infer`
- [ ] **Objective:** `UnwrapPromise<T>` recursively.
- **Requirements:** `type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T`; also `ElementOf<T>` and `Awaited` re-implementation; support `PromiseLike`.
- **Input → Output:** `UnwrapPromise<Promise<Promise<number>>>` → `number`.
- **Acceptance criteria:** Matches built-in `Awaited<T>` for samples.
- **Tests:** nested promises, non-promise, union with promise, `PromiseLike`.

### TS-55 Extracting Function Parameters
- [ ] **Objective:** Re-implement `Parameters<T>` and `ReturnType<T>`.
- **Requirements:** `MyParameters<T extends (...args:any)=>any>`, `MyReturnType`; add `FirstArg<T>`, `LastArg<T>`, `ConstructorParams<T>`.
- **Input → Output:** `MyParameters<(a:string,b:number)=>void>` → `[a:string,b:number]`.
- **Acceptance criteria:** Equal to built-ins, including optional and rest parameters.
- **Tests:** zero params, optional, rest, overloads (last signature), async returns.

### TS-56 Template Literal Types
- [ ] **Objective:** Strongly typed strings.
- **Requirements:** `type EventName = \`${"click"|"hover"}:${"button"|"link"}\``; `CssUnit = \`${number}${"px"|"rem"|"%"}\``; `Getter<K> = \`get${Capitalize<K>}\``; typed `on(event: EventName, …)`.
- **Input → Output:** Valid literal compiles; `"click:image"` errors.
- **Acceptance criteria:** Union expands to exactly 4 event strings; CSS values validate at compile time.
- **Tests:** positive and negative cases via `@ts-expect-error`.

### TS-57 Mapped Type Key Remapping
- [ ] **Objective:** Rename keys with `as`.
- **Requirements:** `Getters<T> = { [K in keyof T as \`get${Capitalize<string & K>}\`]: () => T[K] }`; also `Setters<T>`, `OmitByKey` via `as never`, and a runtime function `makeGetters(obj)` matching the type.
- **Input → Output:** `{name:string}` → `{getName():string}`.
- **Acceptance criteria:** Runtime result agrees with the declared type.
- **Tests:** type assertions plus runtime call.

### TS-58 Deep Readonly
- [ ] **Objective:** Recursive readonly.
- **Requirements:** `DeepReadonly<T>` handling objects, arrays, tuples, `Map`, `Set`, functions (left as-is); a runtime `deepFreeze`.
- **Input → Output:** Nested config → all levels readonly.
- **Acceptance criteria:** `config.db.host = "x"` and `config.list.push(1)` fail to compile; works on recursive types without hitting depth limit on 10 levels.
- **Tests:** nested object, array of objects, tuple, Map/Set, function property.

### TS-59 Deep Partial
- [ ] **Objective:** Recursive partial for config patches.
- **Requirements:** `DeepPartial<T>`; `applyPatch<T>(base: T, patch: DeepPartial<T>): T` that deep-merges without mutating `base`; arrays are replaced, not merged (document).
- **Input → Output:** patch `{db:{port:1}}` keeps other db keys.
- **Acceptance criteria:** Patch with a wrong nested type fails to compile.
- **Tests:** nested patch, empty patch, array replace, base unchanged.

### TS-60 NonNullable Utility
- [ ] **Objective:** Build `MyNonNullable<T>`.
- **Requirements:** `T extends null | undefined ? never : T`; also `NonNullableFields<T>` removing null/undefined from each property; runtime `isDefined<T>(x): x is NonNullable<T>` and `compact(arr)`.
- **Input → Output:** `MyNonNullable<string|null|undefined>` → `string`.
- **Acceptance criteria:** Equal to built-in; `compact([1,null,2])` is typed `number[]`.
- **Tests:** unions, only-null → `never`, runtime filter.

---

## Level 5: Object-Oriented Programming & Design Patterns (TS-61 to TS-75)

### TS-61 Class Access Modifiers
- [ ] **Objective:** Compare `public`, `private`, `protected`, `#private`.
- **Requirements:**
  - `BankAccount` with `public readonly accountNumber`, `private balance`, `#pin` (hard private), `protected ownerName`.
  - `deposit`, `withdraw` (no overdraft), `getBalance`, `verifyPin`.
  - `SavingsAccount extends BankAccount` accessing `protected` but not `private`.
  - Show that TS `private` is erased at runtime but `#pin` is not accessible.
- **Input → Output:** `withdraw(500)` with balance 100 → throws.
- **Acceptance criteria:** Direct access to private members is a compile error; amounts must be positive.
- **Tests:** deposit/withdraw, overdraft, pin check, subclass access, `@ts-expect-error` on private.

### TS-62 Getters and Setters
- [ ] **Objective:** Computed properties with validation.
- **Requirements:** `Temperature` stores Kelvin privately; getters/setters for `celsius`, `fahrenheit`, `kelvin`; reject below absolute zero.
- **Input → Output:** `t.celsius = 100; t.fahrenheit` → `212`.
- **Acceptance criteria:** Conversions round-trip within 1e-9; invalid set throws `RangeError`.
- **Tests:** known pairs (0°C=32°F, −40 equal), absolute zero, round-trip.

### TS-63 Abstract Classes
- [ ] **Objective:** Template class with abstract members.
- **Requirements:** `abstract class Shape { abstract calculateArea(): number; abstract calculatePerimeter(): number; describe() }`; `Circle`, `Square` (and optionally `Triangle`); `Shape` cannot be instantiated.
- **Input → Output:** `new Circle(1).calculateArea()` → `≈3.14159`.
- **Acceptance criteria:** Missing abstract method in a subclass fails to compile; `describe()` is shared.
- **Tests:** areas, perimeters, `@ts-expect-error` on `new Shape()`.

### TS-64 Static Members & Factory Methods
- [ ] **Objective:** Static factories and counters.
- **Requirements:** `User` with private constructor; `User.fromJSON(json: string)`, `User.create(name,email)`, `static count`; validation errors for malformed JSON.
- **Input → Output:** `User.fromJSON('{"name":"A","email":"a@x.com"}')` → `User`.
- **Acceptance criteria:** `new User()` outside the class does not compile; `count` increments only for valid users.
- **Tests:** valid/invalid JSON, count, missing fields.

### TS-65 Singleton Pattern
- [ ] **Objective:** Single `DatabaseConnection` instance.
- **Requirements:** Private constructor, `static getInstance()`; lazy init; `connect()`/`disconnect()` idempotent; a simulated async `connect()` must not create two connections when called concurrently (promise memoisation). Document that Node is single-threaded but async races still apply.
- **Input → Output:** `getInstance() === getInstance()` → `true`.
- **Acceptance criteria:** 100 concurrent `connect()` calls open exactly one connection.
- **Tests:** identity, concurrent connect, disconnect then reconnect.

### TS-66 Factory Pattern
- [ ] **Objective:** Notification factory.
- **Requirements:** `Notification` interface (`send(to, message): Promise<SendResult>`); `EmailNotification`, `SMSNotification`, `PushNotification`; `NotificationFactory.create(type: "email"|"sms"|"push")` with typed return via overloads or a map type.
- **Input → Output:** `create("sms")` → `SMSNotification`.
- **Acceptance criteria:** Unknown type is a compile error and a runtime error for JS callers; each class validates recipient format.
- **Tests:** each type, invalid recipient, unknown type.

### TS-67 Observer Pattern
- [ ] **Objective:** Typed subject/observer.
- **Requirements:** `Subject<T>` with `subscribe(observer): () => void`, `notify(payload: T)`; example `StockPriceSubject` with `{symbol, price}`; observers can be removed during notification safely.
- **Input → Output:** `notify({symbol:"X",price:10})` → all observers called.
- **Acceptance criteria:** Observer receives typed payload; throwing observer does not block others.
- **Tests:** subscribe/unsubscribe, multiple observers, unsubscribe during notify.

### TS-68 Strategy Pattern
- [ ] **Objective:** Swappable payment strategies.
- **Requirements:** `PaymentStrategy { pay(amount: number): Promise<PaymentResult>; validate(): void }`; `CreditCardStrategy`, `PayPalStrategy`, `CryptoStrategy` (fees differ: 2.9%, 3.4%, 1%); `PaymentProcessor.setStrategy(s)` / `checkout(amount)`.
- **Input → Output:** `checkout(100)` with crypto → result with fee 1.
- **Acceptance criteria:** Strategy switched at runtime without conditionals in the processor; invalid card/wallet rejected.
- **Tests:** each strategy, switching, invalid inputs, amount ≤ 0.

### TS-69 Class Decorator
- [ ] **Objective:** `@Sealed` / `@Freeze` class decorators.
- **Requirements:** Use TS 5 standard decorators (or `experimentalDecorators` — state which); `@Sealed` calls `Object.seal` on the constructor and prototype; `@Freeze` freezes them.
- **Input → Output:** After `@Freeze`, adding a prototype method throws in strict mode.
- **Acceptance criteria:** Instances still usable; modification attempts fail.
- **Tests:** attempt to add/delete members on class and prototype.

### TS-70 Method Decorator (Timing/Logging)
- [ ] **Objective:** `@LogExecutionTime`.
- **Requirements:** Wrap sync and async methods; log `ClassName.method took X ms`; preserve `this`, arguments, return value and thrown errors; allow an injected logger.
- **Input → Output:** Decorated method returns same value and logs time.
- **Acceptance criteria:** Works for `async` methods (measures until resolution); errors still propagate and are timed.
- **Tests:** sync, async, throwing method, `this` binding, logger spy.

### TS-71 Property Decorator (Validation)
- [ ] **Objective:** `@MinLength(5)` and friends.
- **Requirements:** `@MinLength(n)`, `@MaxLength(n)`, `@Matches(regex)`; a `validate(obj): string[]` function returning error messages; store metadata per class (no `reflect-metadata` needed, or use it and say so).
- **Input → Output:** Object with `name = "abc"` → `["name must be at least 5 characters"]`.
- **Acceptance criteria:** Multiple decorators on one property all run; subclass inherits rules.
- **Tests:** valid, too short, too long, regex, inheritance.

### TS-72 Adapter Pattern
- [ ] **Objective:** Wrap a legacy API.
- **Requirements:** A legacy function returns untyped `{ usr_nm, usr_eml, crt_dt: "DD/MM/YYYY" }`; define the modern `User` interface and `LegacyUserAdapter` that validates (`unknown` input) and maps to `{ name, email, createdAt: Date }`.
- **Input → Output:** Legacy payload → `User`.
- **Acceptance criteria:** Malformed payloads throw a descriptive error; dates parsed correctly.
- **Tests:** valid, missing fields, bad date, extra fields ignored.

### TS-73 Builder Pattern
- [ ] **Objective:** Fluent `QueryBuilder`.
- **Requirements:** `select(...cols)`, `from(table)`, `where(col, op, value)` (ops: `=`,`!=`,`<`,`>`,`LIKE`,`IN`), `orderBy`, `limit`, `offset`, `build(): { sql: string; params: unknown[] }` using parameter placeholders (never string-concatenated values).
- **Input → Output:** → `{ sql: "SELECT id,name FROM users WHERE age > $1 ORDER BY name LIMIT 10", params:[18] }`.
- **Acceptance criteria:** Methods chainable; `build()` without `from` throws; column names typed against a table schema generic.
- **Tests:** simple, multiple wheres (AND), IN list, missing from, injection attempt stays in params.

### TS-74 Command Pattern (Undo/Redo)
- [ ] **Objective:** Command queue with history.
- **Requirements:** `Command { execute(); undo() }`; `CommandManager` with `run`, `undo`, `redo`, `history`, `canUndo`, `canRedo`; running a new command clears the redo stack; sample text-editor commands (insert, delete).
- **Input → Output:** insert "Hi", insert "!" , undo → `"Hi"`.
- **Acceptance criteria:** Unlimited (or configurable max) history; history entries typed.
- **Tests:** undo/redo sequences, redo cleared after new command, empty-stack safety.

### TS-75 Repository Pattern
- [ ] **Objective:** Generic persistence abstraction.
- **Requirements:** `interface BaseRepository<T extends { id: string }>` with `findById`, `findAll(filter?)`, `create(data: Omit<T,"id">)`, `update(id, patch)`, `delete(id)`; implement `InMemoryRepository<T>`; use it for `User` and `Product`.
- **Input → Output:** `create({name:"A"})` → entity with generated id.
- **Acceptance criteria:** Switching to another implementation requires no change in calling code; `update` on a missing id throws `NotFoundError`.
- **Tests:** CRUD, filter, missing id, ids unique.

---
## Level 6: Asynchronous Programming & Node.js Integration (TS-76 to TS-85)

### TS-76 Typed Promises & Async/Await
- [ ] **Objective:** Strictly typed async data fetching.
- **Requirements:** `fetchJson<T>(url, validator: (x: unknown) => x is T): Promise<T>` using `fetch`; timeout via `AbortController` (default 5 s); `retry(fn, attempts, delayMs)` helper; `Promise.all`, `allSettled`, `race` examples with typed results.
- **Input → Output:** URL returning `{id:1}` → typed object.
- **Acceptance criteria:** Non-2xx, timeout and invalid shape each reject with distinct errors; no `any`.
- **Tests:** mock `fetch`; success, 404, timeout, bad shape, retry succeeds on 3rd attempt.

### TS-77 Custom Error Classes
- [ ] **Objective:** Error hierarchy with HTTP context.
- **Requirements:** `HttpError extends Error { status; code; context? }`; subclasses `NotFoundError`, `ValidationError`, `UnauthorizedError`; `toJSON()` safe for responses (no stack); `isHttpError()` guard; `cause` support.
- **Input → Output:** `new NotFoundError("User")` → status 404, message `"User not found"`.
- **Acceptance criteria:** `instanceof` and `name` correct; stack preserved; serialization hides internals.
- **Tests:** each subclass, `toJSON`, guard, cause chaining.

### TS-78 Typed Express Middleware
- [ ] **Objective:** Type `req.user` through module augmentation.
- **Requirements:** Augment `Express.Request` with `user?: AuthUser`; `authMiddleware` verifying a Bearer token (JWT or stub) and setting `req.user`; `requireRole(role)` middleware; typed route handler using `req.user`.
- **Input → Output:** `Authorization: Bearer <valid>` → `req.user` set; invalid → 401.
- **Acceptance criteria:** `req.user.id` type-checks in handlers without casts; missing token → 401, wrong role → 403.
- **Tests:** Supertest for 200/401/403.

### TS-79 Strict Environment Configuration
- [ ] **Objective:** Validate `process.env` at startup.
- **Requirements:** Zod (or Joi) schema for `NODE_ENV`, `PORT` (number, default 3000), `DATABASE_URL` (URL), `JWT_SECRET` (min 32 chars), `LOG_LEVEL` (enum); export a frozen typed `env`; on failure print all errors and exit code 1.
- **Input → Output:** Env vars → typed config object.
- **Acceptance criteria:** `env.PORT` is `number`; secrets never printed in errors.
- **Tests:** valid, missing var, wrong type, defaults.

### TS-80 Node.js File System Utility
- [ ] **Objective:** Typed JSON file store over `fs/promises`.
- **Requirements:** `JsonFile<T>` with `read()`, `write(data)`, `update(fn)`; atomic write (temp file + rename); create file with default if missing; validator on read; concurrent `update` calls serialised.
- **Input → Output:** `update(d => ({...d, count: d.count+1}))` ×10 concurrently → `count` 10.
- **Acceptance criteria:** Corrupted JSON gives a clear error; no partial writes.
- **Tests:** temp dir; missing file, corrupt file, concurrency, atomicity.

### TS-81 WebSocket Handler
- [ ] **Objective:** Typed message frames.
- **Requirements:** `ws` server wrapper; `type ClientMessage = {type:"join";room} | {type:"chat";text} | {type:"leave"}` and `ServerMessage` union; parse and validate frames; broadcast to room; ping/pong heartbeat dropping dead clients after 30 s.
- **Input → Output:** `{type:"chat",text:"hi"}` → broadcast `{type:"chat",from,text}`.
- **Acceptance criteria:** Invalid JSON / unknown type returns `{type:"error"}` and keeps socket open; handlers exhaustively switch on `type`.
- **Tests:** two clients, join/chat/leave, malformed frame.

### TS-82 CLI Argument Parser
- [ ] **Objective:** Build a typed CLI parser (no `commander`/`yargs`).
- **Requirements:** Support `--flag`, `--key=value`, `--key value`, `-abc` short groups, `--no-flag`, positional args, `--` terminator; declare options with types (`string|number|boolean|string[]`), defaults, `required`; auto `--help`.
- **Input → Output:** `["--port","8080","-v","file.txt"]` → `{port:8080, v:true, _:["file.txt"]}`.
- **Acceptance criteria:** Result type is inferred from the option declarations; unknown or missing required flags give clear errors.
- **Tests:** each syntax, defaults, type coercion errors, help text.

### TS-83 Async Queue Pipeline
- [ ] **Objective:** Concurrency-limited task queue.
- **Requirements:** `AsyncQueue<TPayload, TResult>(worker, { concurrency })`; `add(payload): Promise<TResult>`, `onIdle()`, `pause/resume`, per-job retry count, stats; preserves FIFO start order.
- **Input → Output:** 10 jobs, concurrency 3 → never more than 3 running.
- **Acceptance criteria:** Failures reject only that job's promise; queue continues.
- **Tests:** concurrency ceiling measured, retry, pause/resume, `onIdle`.

### TS-84 REST API Client Wrapper
- [ ] **Objective:** Typed SDK over `fetch`/Axios.
- **Requirements:** `ApiClient` with base URL, default headers, auth token provider, interceptors; typed endpoint map (`{ "GET /users/:id": { response: User } … }`); retry on 5xx/429 with backoff; error mapping to `HttpError`.
- **Input → Output:** `client.get("/users/:id",{params:{id:"1"}})` → `User`.
- **Acceptance criteria:** Wrong path/params/body types fail to compile.
- **Tests:** mock server (msw/nock); success, 401 refresh, 500 retry, validation.

### TS-85 GraphQL Schema Mapper
- [ ] **Objective:** Types for a GraphQL schema.
- **Requirements:** SDL for `User`, `Post`, queries (`user(id)`, `posts(first, after)`), mutation `createPost`; matching TS types; `Resolvers` interface with typed `parent`, `args`, `context`; run on Apollo Server or graphql-yoga with an in-memory store. (Optionally compare with `graphql-codegen` output.)
- **Input → Output:** Query → JSON per schema.
- **Acceptance criteria:** Resolver returning wrong shape fails to compile; context typed.
- **Tests:** execute queries/mutations through the schema.

---

## Level 7: Type System Gymnastics & Meta-Programming (TS-86 to TS-92)

> All Level 7 programs are type-level: deliver the types, ≥6 `Expect<Equal<…>>` tests each including edge cases (empty string, empty tuple, `never`, union input), and a short note on the recursion-depth limit.

### TS-86 String Split & Join at Type Level
- [ ] **Objective:** Parse strings at compile time.
- **Requirements:** `Split<S extends string, D extends string>` → tuple; `Join<T extends readonly string[], D extends string>` → string; round-trip `Join<Split<S,D>,D>`.
- **Input → Output:** `Split<"a-b-c","-">` → `["a","b","c"]`; `Join<["a","b"],"/">` → `"a/b"`.
- **Acceptance criteria:** Handles empty string and absent delimiter.
- **Tests:** as above plus empty-delimiter case (`Split<"abc","">` → `["a","b","c"]`).

### TS-87 Tuple Length Utility
- [ ] **Objective:** `TupleLength<T extends readonly unknown[]>`.
- **Requirements:** Return the literal length; `number` for non-tuple arrays; also `IsEmptyTuple`, `Push`, `Pop`, `Shift`, `Concat`.
- **Input → Output:** `TupleLength<[1,2,3]>` → `3`.
- **Acceptance criteria:** Works with readonly tuples and optional elements (union of lengths).
- **Tests:** empty, readonly, optional, `string[]`.

### TS-88 Flat Array Type
- [ ] **Objective:** `Flatten<T>` recursive.
- **Requirements:** Full-depth flatten plus `FlattenDepth<T, N>`; runtime `flatten` function typed to return `Flatten<T>`.
- **Input → Output:** `Flatten<[1,[2,[3]]]>` → `[1,2,3]`.
- **Acceptance criteria:** Preserves literal types; runtime output matches the type.
- **Tests:** empty, deeply nested, mixed, depth-limited.

### TS-89 Object Pick By Type
- [ ] **Objective:** `PickByType<T, V>`.
- **Requirements:** Keys whose values extend `V`; also `OmitByType`; handle optional properties and unions.
- **Input → Output:** `PickByType<{a:string;b:number;c:string}, string>` → `{a:string;c:string}`.
- **Acceptance criteria:** Modifiers (`?`, `readonly`) preserved.
- **Tests:** none match → `{}`, all match, optional, union value.

### TS-90 camelCase → snake_case Converter
- [ ] **Objective:** Compile-time key conversion.
- **Requirements:** `CamelToSnake<S>`, `SnakeToCamel<S>`, `KeysToSnake<T>` (recursive over objects and arrays); runtime `toSnakeKeys(obj)` with matching type.
- **Input → Output:** `CamelToSnake<"userFirstName">` → `"user_first_name"`.
- **Acceptance criteria:** Acronyms/leading capitals are handled and documented; runtime and type agree.
- **Tests:** simple, multi-word, already snake, nested objects, arrays.

### TS-91 Tuple → Union & Union → Intersection
- [ ] **Objective:** Classic type transformations.
- **Requirements:** `TupleToUnion<T>`; `UnionToIntersection<U>` (contravariant `infer` trick); bonus `UnionToTuple<U>` with a documented caveat on ordering.
- **Input → Output:** `TupleToUnion<[string,number]>` → `string|number`; `UnionToIntersection<{a:1}|{b:2}>` → `{a:1}&{b:2}`.
- **Acceptance criteria:** Works with objects and function unions.
- **Tests:** primitives, objects, `never`, single member.

### TS-92 Compile-Time JSON Schema Parser
- [ ] **Objective:** Derive TS types from JSON Schema literals.
- **Requirements:** `FromSchema<S>` supporting `type` (string, number, integer, boolean, null, array, object), `properties`, `required`, `enum`, `items`, `oneOf`, `const`, `additionalProperties`. Schemas declared `as const`.
- **Input → Output:** `{type:"object",properties:{id:{type:"integer"}},required:["id"]}` → `{id:number}`.
- **Acceptance criteria:** Optional vs required keys correct; nested objects/arrays resolved; a runtime validator (e.g. Ajv) agrees with the derived type on sample data.
- **Tests:** each keyword, nesting, enum literal union.

---

## Level 8: Full Applications & Real-World Projects (TS-93 to TS-100)

> Level 8 programs are multi-module. Each must include: a `README.md`, a clear module split (`domain/`, `services/`, `ui-or-api/`), ≥80 % test coverage on domain logic, and zero `any`.

### TS-93 Typed Mini Finite State Machine
- [ ] **Objective:** FSM that blocks invalid transitions at compile time and runtime.
- **Requirements:** `createMachine({ initial, states: { idle:{on:{START:"running"}}, … } })`; `send(event)` accepts only events valid for the current state (typed); guards, entry/exit actions, context; `can(event)`; transition history; sample machines: traffic light, order lifecycle.
- **Input → Output:** `send("START")` from idle → state `running`.
- **Acceptance criteria:** `send("INVALID")` and impossible transitions are compile errors (when state is statically known) and throw at runtime.
- **Tests:** every transition, guards, actions order, history.

### TS-94 In-Memory Query Engine
- [ ] **Objective:** Mini database with key-safe queries.
- **Requirements:** `Table<Row>` with `insert`, `update`, `delete`; fluent `.where(col, op, value)`, `.select(...cols)` (result type narrows to selected cols), `.join(other, onLeft, onRight)`, `.orderBy`, `.limit`; unique-index on a column.
- **Input → Output:** `users.where("age",">",18).select("id","name")` → typed rows.
- **Acceptance criteria:** Wrong column names or value types are compile errors; join result type merges both rows.
- **Tests:** CRUD, filter ops, join (inner), ordering, index uniqueness.

### TS-95 Form Validation Engine
- [ ] **Objective:** Multi-field validator with typed error map.
- **Requirements:** Rule builders `required`, `minLength`, `email`, `matches`, `custom`, `sameAs(field)`; schema `{ [K in keyof Form]: Rule<Form[K]>[] }`; sync and async rules (e.g. username availability); `validate(values)` → `{ valid, errors: Partial<Record<keyof Form, string[]>> }`; stop-on-first-error option.
- **Input → Output:** `{email:"x"}` → `errors.email = ["Invalid email"]`.
- **Acceptance criteria:** Error map keys limited to form fields; rule types match field types.
- **Tests:** each rule, async rule, cross-field rule, multiple errors.

### TS-96 Drag-and-Drop Kanban Board Model
- [ ] **Objective:** State/action model for a Trello-style board.
- **Requirements:** Entities `Board`, `Column`, `Card`; actions `ADD_COLUMN`, `ADD_CARD`, `MOVE_CARD(cardId, fromCol, toCol, toIndex)`, `REORDER_COLUMN`, `DELETE_CARD`; pure reducer; WIP limit per column; undo/redo; optional minimal UI wired to the reducer.
- **Input → Output:** `MOVE_CARD` → card appears at the target index.
- **Acceptance criteria:** Invalid moves (missing ids, WIP exceeded) are rejected without state change; state is immutable.
- **Tests:** each action, WIP limit, undo/redo, same-column reorder.

### TS-97 Type-Safe Event Bus System
- [ ] **Objective:** Global typed bus.
- **Requirements:** Central `EventMap` interface extended through declaration merging by modules; `bus.on/off/once/emit`; wildcard listeners (`*`); async handlers with `emitAsync` awaiting all; namespaced events; dev-mode logging.
- **Input → Output:** `bus.emit("cart:add",{sku:"A"})` reaches subscribers.
- **Acceptance criteria:** Emitter/subscriber payload contract enforced at compile time; modules can register new events without editing the bus file.
- **Tests:** multi-module registration, wildcard, async errors isolated, off/once.

### TS-98 Full-Stack E-Commerce Shopping Cart
- [ ] **Objective:** Cart with pricing, tax, coupons and checkout.
- **Requirements:**
  - Backend (Express/Fastify) + minimal frontend or CLI; endpoints for products, cart, coupons, checkout.
  - `TaxStrategy` interface (flat, per-region, VAT-inclusive); coupons (percentage, fixed, free-shipping, min-spend, expiry, single-use).
  - Money in integer minor units; rounding rule documented.
  - Checkout state machine: `cart → addressed → paid → confirmed | failed`.
- **Input → Output:** Cart + coupon + region → itemised totals.
- **Acceptance criteria:** Totals deterministic; expired/invalid coupons rejected; stock decremented on confirm; no floating-point money.
- **Tests:** pricing matrix, coupon edge cases, state transitions, stock race.

### TS-99 Extensible Plugin System
- [ ] **Objective:** Host app with typed plugin contracts.
- **Requirements:** `Plugin { name; version; dependencies?; setup(ctx) }`; lifecycle hooks `onInit`, `onStart`, `onStop`, `onError`; typed hook registry and a shared `ctx` (services, config, event bus); dependency-ordered loading; plugin isolation (a failing plugin is disabled, not crashing the host); dynamic loading from a folder.
- **Input → Output:** Plugins in `/plugins` → loaded in dependency order.
- **Acceptance criteria:** Missing dependency or version mismatch detected; unload runs `onStop` in reverse order.
- **Tests:** ordering, failure isolation, hook payload types, unload.

### TS-100 Custom Declaration File (`.d.ts`) Library
- [ ] **Objective:** Type an untyped JS library and publish it as a typed package.
- **Requirements:** Choose a small untyped JS lib (or write one); author `index.d.ts` with overloads, generics, namespaces, and a module augmentation of an existing package (e.g. add a field to Express `Request`); package with `types`/`exports`; a consumer project using it; lint with `tsd` or `dtslint`.
- **Input → Output:** `npm pack` → installable typed package.
- **Acceptance criteria:** Consumer gets full IntelliSense; `tsd` tests pass; no `any` in the public API.
- **Tests:** `tsd` positive and negative type tests.

---

# PART B — NestJS Roadmap A (NS-01 to NS-30)

*Progressive path from request-lifecycle fundamentals to multi-tenant SaaS, microservices and AI integrations.*

## Level 1: Core Framework Mechanics & Fundamentals

### NS-01 Hello World & Basic CLI Routing
- [ ] **Objective:** Master controllers, HTTP method decorators and bootstrapping.
- **Key concepts:** `@Module()`, `@Controller()`, `@Get()`, `@Post()`, Nest CLI (`nest g co`).
- **Requirements:** Create a project with `nest new`; generate a module + controller with the CLI; routes `GET /hello`, `GET /hello/:name`, `POST /hello` (echo body); global prefix `/api`; port from env.
- **Input → Output:** `GET /api/hello/Ann` → `{"message":"Hello, Ann"}`.
- **Acceptance criteria:** App boots with `npm run start:dev`; correct status codes (POST → 201); unknown route → 404.
- **Tests:** default e2e spec for each route.

### NS-02 Dependency Injection & Service Provider Layer
- [ ] **Objective:** Understand IoC and constructor injection.
- **Key concepts:** `@Injectable()`, Singleton vs request scope, provider registration.
- **Requirements:** `GreetingService` injected into a controller; second service injected into the first; demonstrate a singleton (counter increments across requests) vs `Scope.REQUEST` (counter resets); inject by token with `@Inject()`.
- **Input → Output:** Repeated `GET /counter` → increasing vs constant value by scope.
- **Acceptance criteria:** No `new Service()` anywhere in the code; scope difference demonstrable and documented.
- **Tests:** unit-test the controller with a mocked service.

### NS-03 DTOs, Request Validation & Transformation
- [ ] **Objective:** Runtime payload safety.
- **Key concepts:** `ValidationPipe`, `class-validator`, `class-transformer`, `@Body()`, `@Param()`.
- **Requirements:** `CreateItemDto` (`name` string 3–50, `price` positive number, `tags` optional string array), `ParamDto` (`id` int); global `ValidationPipe({ whitelist:true, forbidNonWhitelisted:true, transform:true })`; query DTO with `page`/`limit` coerced to numbers.
- **Input → Output:** Invalid body → 400 with an array of messages.
- **Acceptance criteria:** Unknown fields rejected; numeric strings in query converted to numbers.
- **Tests:** valid, each invalid rule, extra field.

### NS-04 Custom Request Pipeline Middleware
- [ ] **Objective:** Request-level middleware.
- **Key concepts:** `NestMiddleware`, `MiddlewareConsumer`, functional middleware, global registration.
- **Requirements:** Class middleware that adds `x-request-id` (UUID, reuse incoming one) to request and response; functional middleware that logs method/path; apply to selected routes with `forRoutes` and exclude `/health`.
- **Input → Output:** Every response has an `x-request-id` header.
- **Acceptance criteria:** Middleware order is predictable; excluded routes bypass it.
- **Tests:** e2e checking headers.

### NS-05 Custom Decorators & Param Decorators
- [ ] **Objective:** Clean extraction of request data.
- **Key concepts:** `createParamDecorator()`, `ExecutionContext`.
- **Requirements:** `@ClientIp()`, `@UserAgent()`, `@CurrentUser('id')` (optional property key); a composed decorator via `applyDecorators` (e.g. `@Auth(role)`).
- **Input → Output:** `@ClientIp()` returns the caller IP (respect `x-forwarded-for` when trusted).
- **Acceptance criteria:** Decorators work on HTTP; unit-test with a mocked `ExecutionContext`.
- **Tests:** present/absent header, property key variant.

## Level 2: The Request Lifecycle & Enterprise Guardrails

### NS-06 Global Exception Filters & Uniform Error Handling
- [ ] **Objective:** Centralised error format.
- **Key concepts:** `ExceptionFilter`, `@Catch()`, `HttpException`, `ArgumentsHost`.
- **Requirements:** Filter catching `HttpException` and unknown errors; response `{statusCode, timestamp, path, message, requestId}`; unknown errors → 500 with a generic message (stack only in logs); custom `BusinessException` mapped to 422.
- **Input → Output:** Throw anywhere → uniform JSON.
- **Acceptance criteria:** No stack traces leak in production mode; validation errors keep their message array.
- **Tests:** HttpException, thrown `Error`, business exception.

### NS-07 Guards & Custom Metadata Authorization
- [ ] **Objective:** Route protection.
- **Key concepts:** `CanActivate`, `ExecutionContext`, `Reflector`, `@SetMetadata()`.
- **Requirements:** `AuthGuard` reading `Authorization: Bearer <token>`; `@Public()` metadata to skip; `@Roles(...)` + `RolesGuard`; register globally via `APP_GUARD`.
- **Input → Output:** No token → 401; wrong role → 403.
- **Acceptance criteria:** Handler-level metadata overrides controller-level.
- **Tests:** unit tests with a mocked `Reflector`; e2e matrix.

### NS-08 Interceptors for Response Transformation & Timing
- [ ] **Objective:** Pre/post-handler logic.
- **Key concepts:** `NestInterceptor`, RxJS `map`/`tap`/`catchError`, `@UseInterceptors()`.
- **Requirements:** `TransformInterceptor` wrapping to `{data, meta:{timestamp}}`; `TimingInterceptor` adding `x-response-time`; `TimeoutInterceptor` (5 s → 408); optional `ClassSerializerInterceptor` hiding `@Exclude()` fields.
- **Input → Output:** Any success response is wrapped.
- **Acceptance criteria:** Errors are not wrapped as success; timeout cancels the handler.
- **Tests:** wrapped payload, header present, slow handler → 408.

### NS-09 Custom Pipes for Parameter Sanitization
- [ ] **Objective:** Per-parameter transform/validate.
- **Key concepts:** `PipeTransform`, `ArgumentMetadata`, `BadRequestException`.
- **Requirements:** `ParseIntPipe`-like custom `PositiveIntPipe`; `TrimPipe` for strings; `ParseBoolPipe` for `?active=true|false`; `ParseCsvPipe` (`?ids=1,2,3` → `number[]`).
- **Input → Output:** `?ids=1,2,x` → 400 naming the bad value.
- **Acceptance criteria:** Pipes reusable on `@Param`, `@Query`, `@Body`.
- **Tests:** unit test each pipe.

### NS-10 Dynamic Modules & Async Provider Configuration
- [ ] **Objective:** Configurable reusable modules.
- **Key concepts:** `DynamicModule`, `forRoot()`, `registerAsync()`, `useFactory`.
- **Requirements:** `NotifierModule.forRoot({ prefix })` and `registerAsync({ imports, inject, useFactory })`; `isGlobal` option; options provided via an injection token; consumer app uses `ConfigService` to feed it.
- **Input → Output:** Same service behaves per supplied options.
- **Acceptance criteria:** Both sync and async registration work; module has no hard-coded config.
- **Tests:** two apps with different options.

## Level 3: Security, Configuration & Persistence

### NS-11 Type-Safe Environment Management
- [ ] **Objective:** Validate config at startup.
- **Key concepts:** `@nestjs/config`, `ConfigService`, Zod/Joi.
- **Requirements:** Schema for `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`; `ConfigModule.forRoot({ isGlobal:true, validate })`; typed `ConfigService<Env, true>`; `.env.example`; per-environment files.
- **Input → Output:** Missing var → app refuses to start with a clear message.
- **Acceptance criteria:** No `process.env` access outside the config layer.
- **Tests:** valid and invalid env.

### NS-12 Relational Database Management with Prisma / TypeORM
- [ ] **Objective:** Type-safe CRUD, relations, transactions.
- **Key concepts:** Repositories, migrations, one-to-many / many-to-many.
- **Requirements:** Entities `User`, `Post`, `Tag` (posts↔tags many-to-many); migrations (no `synchronize` in prod); CRUD endpoints with pagination; a transactional operation (create post + tags atomically); seed script.
- **Input → Output:** `POST /posts` with tags → persisted atomically.
- **Acceptance criteria:** Failure mid-transaction rolls back; N+1 avoided with eager/`include` loads.
- **Tests:** e2e against a test database.

### NS-13 MongoDB Integration with Mongoose
- [ ] **Objective:** NoSQL in NestJS.
- **Key concepts:** `@nestjs/mongoose`, `@Schema()`, `@Prop()`, model injection.
- **Requirements:** `Product` schema (name, price, tags, nested `specs`, timestamps); CRUD; text index search; indexes declared in schema; `lean()` reads; validation at DTO and schema level.
- **Input → Output:** CRUD over products.
- **Acceptance criteria:** Invalid ObjectId → 400; missing doc → 404.
- **Tests:** e2e with `mongodb-memory-server`.

### NS-14 Authentication (JWT & Passport Strategies)
- [ ] **Objective:** Registration, login, token issuance.
- **Key concepts:** `@nestjs/jwt`, `@nestjs/passport`, strategies, bcrypt.
- **Requirements:** `POST /auth/register`, `/auth/login`, `/auth/refresh`, `GET /auth/me`; bcrypt (cost ≥ 10); access token 15 min, refresh token 7 days (hashed in DB); `LocalStrategy` + `JwtStrategy`; logout invalidates refresh token.
- **Input → Output:** Valid credentials → `{accessToken, refreshToken}`.
- **Acceptance criteria:** Passwords never returned or logged; duplicate email → 409; same message for bad email/password.
- **Tests:** unit + e2e of the full flow.

### NS-15 Role-Based & Attribute-Based Access Control
- [ ] **Objective:** Fine-grained authorisation.
- **Key concepts:** `@Roles()`, `Reflector`, CASL.
- **Requirements:** Roles `admin|editor|viewer`; RBAC guard; CASL abilities such as "editor can update own posts only"; `@CheckAbility()` decorator; ability factory per user.
- **Input → Output:** Editor updating someone else's post → 403.
- **Acceptance criteria:** Rules defined in one place; adding a role needs no controller edits.
- **Tests:** ability matrix unit tests, e2e.

## Level 4: Real-Time Systems, Queues & Performance

### NS-16 Bi-Directional Communication with WebSockets
- [ ] **Objective:** Real-time channels.
- **Key concepts:** `@nestjs/websockets`, `@WebSocketGateway()`, Socket.IO/WS adapters.
- **Requirements:** Chat gateway with rooms, `join`, `message`, `typing`; JWT auth on handshake; message DTO validation; presence list; reconnect-safe; broadcast to room only.
- **Input → Output:** Client message → delivered to room members.
- **Acceptance criteria:** Unauthenticated sockets disconnected; invalid payload returns an error event.
- **Tests:** `socket.io-client` e2e with two clients.

### NS-17 Asynchronous Task Queues (Redis + BullMQ)
- [ ] **Objective:** Background jobs.
- **Key concepts:** `@nestjs/bullmq`, processors, delayed jobs, retries.
- **Requirements:** `email` queue; processor simulating send; retries (3, exponential backoff); delayed welcome email (10 s); failed-job dead-letter handling; optional Bull Board UI; job progress.
- **Input → Output:** `POST /register` → returns immediately, job processed async.
- **Acceptance criteria:** Retries observable; idempotent job IDs to avoid duplicates.
- **Tests:** processor unit tests; integration with Redis container.

### NS-18 Task Scheduling & Cron Jobs
- [ ] **Objective:** Scheduled jobs.
- **Key concepts:** `@nestjs/schedule`, `@Cron()`, `@Interval()`, `@Timeout()`.
- **Requirements:** Hourly cleanup of expired tokens; 5-minute metrics snapshot; dynamic job add/remove through `SchedulerRegistry`; overlap protection (skip if running); distributed lock (Redis) so only one instance runs.
- **Input → Output:** Jobs fire per schedule and log runs.
- **Acceptance criteria:** Two instances do not run the same job simultaneously; exceptions don't kill the scheduler.
- **Tests:** fake timers; lock behaviour.

### NS-19 Distributed Caching & Invalidation (Redis)
- [ ] **Objective:** Faster reads.
- **Key concepts:** `@nestjs/cache-manager`, `CacheInterceptor`, TTL invalidation.
- **Requirements:** Redis store; cache `GET /products` (60 s); key per query string; invalidate on create/update/delete; `X-Cache: HIT|MISS` header; cache-aside in a service.
- **Input → Output:** 2nd identical GET served from cache.
- **Acceptance criteria:** Writes immediately invalidate related keys; no stale data after update.
- **Tests:** hit/miss, invalidation, TTL expiry.

### NS-20 Rate Limiting & DDoS Throttling
- [ ] **Objective:** Abuse protection.
- **Key concepts:** `@nestjs/throttler`, `ThrottlerGuard`, Redis storage.
- **Requirements:** Global 100 req/min; stricter 5/min on `/auth/login`; `@SkipThrottle()` on health; Redis-backed so limits hold across instances; custom key (user id or IP); `429` with `Retry-After`.
- **Input → Output:** 6th login in a minute → 429.
- **Acceptance criteria:** Limits are per client; headers show remaining quota.
- **Tests:** burst test e2e.

## Level 5: Architecture, Testing & Distributed Systems

### NS-21 GraphQL Services (Code-First)
- [ ] **Objective:** GraphQL alongside REST.
- **Key concepts:** `@nestjs/graphql`, `@ObjectType()`, `@Resolver()`, `@Query()`, `@Mutation()`.
- **Requirements:** `Book`/`Author` types; queries with pagination; mutations; field resolver for `author`; DataLoader to prevent N+1; auth guard on mutations; generated `schema.gql`.
- **Input → Output:** Query returns exactly the requested fields.
- **Acceptance criteria:** N+1 verified fixed (query count log); input validation active.
- **Tests:** resolver unit tests; e2e queries.

### NS-22 Automated OpenAPI / Swagger Documentation
- [ ] **Objective:** Generated API docs.
- **Key concepts:** `@nestjs/swagger`, `DocumentBuilder`, `@ApiProperty()`, `@ApiResponse()`.
- **Requirements:** Swagger UI at `/docs`; DTOs annotated (examples, enums); bearer auth scheme; tags per controller; error response schemas; export `openapi.json`.
- **Input → Output:** Browsable docs with "Try it out".
- **Acceptance criteria:** Every endpoint documented with request, response, and errors; JSON validates with an OpenAPI linter.
- **Tests:** CI check that `openapi.json` generates.

### NS-23 Unit Testing with Jest
- [ ] **Objective:** Isolated tests.
- **Key concepts:** `Test.createTestingModule()`, `jest.fn()`, repository mocking.
- **Requirements:** Unit tests for a service, controller and guard; mock repositories and external clients; arrange-act-assert; coverage ≥ 80 % on the service.
- **Input → Output:** Coverage report.
- **Acceptance criteria:** No real DB/network in unit tests; tests fast (< 5 s total).
- **Tests:** happy path, not found, error propagation, guard allow/deny.

### NS-24 End-to-End Testing with Supertest
- [ ] **Objective:** Full-pipeline tests.
- **Key concepts:** `INestApplication`, Supertest, DB teardown.
- **Requirements:** Test app mirrors production setup (pipes, filters); Dockerised test DB; reset DB between tests; login → protected call → CRUD flow; tests run in CI.
- **Input → Output:** Passing e2e suite.
- **Acceptance criteria:** Tests independent and order-agnostic; no leftover data.
- **Tests:** auth, validation errors, 404, 403.

### NS-25 Event-Driven Architecture (CQRS)
- [ ] **Objective:** Separate commands and queries.
- **Key concepts:** `@nestjs/cqrs`, command/query handlers, event publishers.
- **Requirements:** `CreateOrderCommand`, `GetOrderQuery`, `OrderCreatedEvent`; separate write and read models; event handler updates the read model; saga example (order → reserve stock).
- **Input → Output:** `POST /orders` → command → event → read model updated.
- **Acceptance criteria:** Controllers use only `CommandBus`/`QueryBus`; handlers independently testable.
- **Tests:** handler unit tests; flow integration test.

## Level 6: Advanced Cloud, SaaS & Agentic AI Systems

### NS-26 Event-Driven Microservices (RabbitMQ / NATS / Kafka)
- [ ] **Objective:** Async service split.
- **Key concepts:** `@nestjs/microservices`, `@MessagePattern()`, `@EventPattern()`, `ClientProxy`.
- **Requirements:** API gateway + two services (orders, notifications); request/response pattern and fire-and-forget events; broker via Docker Compose; acks, retries, dead-letter queue; correlation ID propagated.
- **Input → Output:** `POST /orders` → event consumed by notifications.
- **Acceptance criteria:** A service can be down and process messages on recovery; duplicate message is handled idempotently.
- **Tests:** contract tests of message shapes; integration with broker.

### NS-27 Multi-Tenant SaaS Database Isolation
- [ ] **Objective:** Per-tenant data safety.
- **Key concepts:** request-scoped `AsyncLocalStorage`, dynamic connection pools, RLS.
- **Requirements:** Tenant resolved from subdomain or `x-tenant-id` header/JWT claim; ALS holds tenant context; data access layer sets `SET LOCAL app.current_tenant_id`; document three strategies (shared schema+RLS, schema-per-tenant, DB-per-tenant) and implement the first.
- **Input → Output:** Same endpoint returns different data per tenant.
- **Acceptance criteria:** Cross-tenant read/write impossible, even with a buggy query (proven by test); no tenant → 400.
- **Tests:** two-tenant isolation e2e.

### NS-28 Building MCP Servers in NestJS
- [ ] **Objective:** Expose backend capabilities to LLM clients.
- **Key concepts:** `@modelcontextprotocol/sdk`, SSE/HTTP transports, tools, resources, prompts.
- **Requirements:** MCP server with ≥2 tools (e.g. `search_orders`, `create_ticket`) with Zod input schemas, ≥1 resource, ≥1 prompt; HTTP/SSE transport with auth; per-user permission checks; audit log of tool calls; test with MCP Inspector and Claude Desktop.
- **Input → Output:** Client lists tools and calls one → JSON result.
- **Acceptance criteria:** Invalid args return a protocol error; unauthorised user cannot call tools.
- **Tests:** SDK client integration test.

### NS-29 Permission-Aware Vector Search RAG Pipelines
- [ ] **Objective:** Secure retrieval.
- **Key concepts:** `pgvector`, cosine/HNSW, identity-filtered RAG.
- **Requirements:** Ingest endpoint (chunk → embed → store with `owner`/`acl` metadata); search endpoint embedding the question then querying `top-K` with ACL filter in SQL; generate answer with citations; no unauthorised chunk ever reaches the LLM.
- **Input → Output:** Question → answer + source list.
- **Acceptance criteria:** User A cannot retrieve user B's private chunks (proven by test); HNSW index used (`EXPLAIN`).
- **Tests:** ACL tests, retrieval relevance smoke test.

### NS-30 Distributed Tracing & Health Monitoring
- [ ] **Objective:** Observability.
- **Key concepts:** `@nestjs/terminus`, OpenTelemetry, APM.
- **Requirements:** `/health/live` and `/health/ready` (DB, Redis, disk); OTel auto-instrumentation for HTTP, DB, Redis; custom spans around LLM calls; trace IDs in logs; exporter to Jaeger/Tempo or Datadog/LangSmith; basic metrics endpoint.
- **Input → Output:** One request → one trace spanning API → DB → external call.
- **Acceptance criteria:** Readiness fails when DB is down; spans carry meaningful attributes (no secrets/PII).
- **Tests:** health endpoint e2e; span presence check.

---

# PART C — NestJS Additions from the Second "Top 30" and "Top 50" Lists (NS-31 to NS-42)

The second NestJS list had 30 items. 28 of them duplicate programs already in Part B (see the mapping table below), so they were **not** repeated. Only the two genuinely new programs were added.

### NS-31 Multi-Cloud LLM Provider Gateway (Fallback & Resiliency)
- [ ] **Objective:** Route LLM requests across providers (e.g. Azure OpenAI → Anthropic Claude) with automatic fallback.
- **Key concepts:** Circuit breaker, retry with exponential backoff and jitter, RxJS `Observable` streaming, Server-Sent Events (SSE).
- **Requirements:**
  - Provider interface `LlmProvider { name; complete(req); stream(req): Observable<Chunk> }` with two or more implementations (real or mocked).
  - Ordered fallback list from config; on 429 / 5xx / timeout switch to the next provider; honour `Retry-After`.
  - Circuit breaker per provider (closed → open after N failures → half-open probe after a cool-down).
  - `POST /v1/chat` (JSON) and `POST /v1/chat/stream` (SSE) with a provider-neutral request/response schema.
  - Response includes which provider served it; log latency, tokens and fallbacks (no prompt content in logs by default).
  - API keys only from config/secret store; per-client rate limit.
- **Input → Output:** Chat request → completion (or SSE token stream) from the first healthy provider.
- **Acceptance criteria:** With the primary mocked to return 429, the request is served by the secondary with no client error; open circuit skips the failed provider without waiting; stream continues or fails cleanly if a provider dies mid-stream.
- **Tests:** unit tests for breaker states and backoff timing (fake timers); e2e with mock providers for 429, 500, timeout, mid-stream failure.

### NS-32 Enterprise Containerization & Kubernetes Orchestration
- [ ] **Objective:** Productionise a NestJS app with containers and Kubernetes.
- **Key concepts:** Docker multi-stage builds, `@nestjs/terminus` health endpoints, Kubernetes Deployment/Service/ConfigMap/Secret, Helm.
- **Requirements:**
  - Multi-stage `Dockerfile` (build → prune dev deps → minimal runtime), non-root user, `.dockerignore`, image < 250 MB, graceful shutdown (`enableShutdownHooks`, handle `SIGTERM`).
  - Health endpoints `/health/live` and `/health/ready` (readiness checks DB/Redis).
  - Kubernetes manifests: Deployment (≥ 2 replicas, `RollingUpdate` with `maxUnavailable: 0`), Service, ConfigMap, Secret, liveness/readiness/startup probes, resource requests/limits, HPA, PodDisruptionBudget.
  - Helm chart with `values.yaml` for image tag, replicas, env.
  - Run locally on kind or minikube.
- **Input → Output:** `helm install` → running, reachable service.
- **Acceptance criteria:** A rolling update (new image tag) causes zero failed requests under a continuous load test; killing a pod does not drop traffic; a failing readiness check removes the pod from the Service.
- **Tests:** `docker run` smoke test; `kubectl rollout status`; `hey`/`k6` load test during rollout; `helm lint` and `kubeconform`.

---

## Duplicate Mapping — Second NestJS List → Programs Above

Use the "Extra task detail" as an alternative or additional exercise when you build the matching program.

| 2nd-list # | Title in 2nd list | Already covered by | Extra task detail worth adding |
|---|---|---|---|
| 1 | Hello World, Controllers & Route Decorators | NS-01 | Build a task-management API (create, retrieve, update tasks, in-memory) |
| 2 | DI & Custom Providers | NS-02 | `useValue` / `useFactory` / `useClass` tokens; `ProductsService` with logging and metrics providers chosen by environment |
| 3 | DTOs, Class Validation | NS-03 | `UserRegistrationDto` (email format, min password length, optional metadata) with automatic stripping of unknown properties |
| 4 | Custom Middleware & Request Logging | NS-04 | Log latency, method, path and client IP |
| 5 | Custom Parameter Decorators | NS-05 | `@CurrentUser()` extracting the validated user |
| 6 | Global Exception Filters | NS-06 | Schema `{ statusCode, timestamp, path, message }` |
| 7 | Route Guards & Metadata | NS-07 | `ApiKeyGuard` on `x-api-key` plus `@Roles('admin')` |
| 8 | Interceptors | NS-08 | `TransformInterceptor` wrapping all responses |
| 9 | Custom Pipes | NS-09 | Pipe converting an ID string into an entity or throwing 404 (also `ParseUUIDPipe`) |
| 10 | Dynamic Modules | NS-10 | `MailerModule` or `StorageModule` with `apiKey` and `endpoint` via `registerAsync()` |
| 11 | Type-Safe Env Management | NS-11 | `PORT`, `DATABASE_URL`, `JWT_SECRET` validated at startup |
| 12 | Relational Persistence | NS-12 | Blog platform `Users → Posts → Comments` with transactional queries |
| 13 | Auth & Passport (JWT + Bcrypt) | NS-14 | Protected routes using `AuthGuard('jwt')` |
| 14 | Async Task Queues | NS-17 | Offload email sending or image processing on registration |
| 15 | WebSockets | NS-16 | Group chat or live system-metrics dashboard |
| 16 | Rate Limiting | NS-20 | Per-minute limit per IP or per tenant on public endpoints |
| 17 | Swagger | NS-22 | UI hosted at `/api/docs` |
| 18 | Unit Testing | NS-23 | Tests for `AuthService` with mocked repositories |
| 19 | E2E Testing | NS-24 | E2E test of `POST /auth/login` (status codes and token payload) |
| 20 | Event-Driven Microservices | NS-26 | API Gateway + Order Fulfillment service over RabbitMQ or TCP |
| 21 | PostgreSQL JSONB & Expression Indexing | PG-02 | — |
| 22 | PostgreSQL Range Types, Exclusion Constraints & CTEs | PG-03 and PG-04 | Booking engine plus nested category hierarchy |
| 23 | PostgreSQL Transactions & Locking | PG-08 | Inventory reservation or banking transfer |
| 24 | Multi-Tenant Isolation & RLS | NS-27 and PG-13 | NestJS data-access layer with ALS + `SET LOCAL app.current_tenant_id` |
| 25 | MCP Server in NestJS | NS-28 | Database query tool and action tool over JSON-RPC 2.0 / SSE; also support stdio |
| 26 | Permission-Aware Vector RAG | NS-29 and PG-12 | HNSW index with ACL filters in SQL |
| 27 | Event Sourcing & CQRS | NS-25 | Order placement commands vs high-throughput order queries |
| 28 | Multi-Cloud LLM Gateway | **NS-31 (new)** | — |
| 29 | Distributed Tracing & Observability | NS-30 | Track latency across DB calls and external AI API calls |
| 30 | Containerization & Kubernetes | **NS-32 (new)** | — |

---

## Additions from the "Top 50" List (NS-33 to NS-42)

The Top 50 list was checked item by item. 38 of its 50 items duplicated programs already in this document (mapping table below). The 11 genuinely new programs are NS-33 to NS-42 and PG-16.

### NS-33 Session Management & Distributed State in Redis
- [ ] **Objective:** Store session state and distributed locks in Redis.
- **Key concepts:** Redis String/Hash types, TTL, `SETEX`, `SET NX PX`, Redlock, `ioredis`.
- **Requirements:**
  - `SessionService` storing sessions as Redis hashes keyed `sess:<id>` with sliding TTL (renewed on activity) and absolute max lifetime.
  - Session ID is a cryptographically random value; cookie `HttpOnly`, `Secure`, `SameSite`.
  - Store short-lived MFA challenge tokens (5 min TTL, single-use, deleted on verify).
  - `LockService.withLock(key, ttlMs, fn)`: acquire with `SET key token NX PX ttl`, release with a Lua script that checks the token; optional Redlock across several Redis nodes.
  - Demonstrate two app instances competing for one lock (only one runs the critical section).
  - Session list and "log out everywhere" per user.
- **Input → Output:** Login → session cookie; second instance validates the same session.
- **Acceptance criteria:** Expired session rejected; a lock cannot be released by a non-owner; lock auto-expires if the holder crashes; MFA token cannot be reused.
- **Tests:** TTL expiry (fake clock or short TTL), lock contention with 2+ workers, token reuse.

### NS-34 Pub/Sub Engine & Distributed Event Signaling (Redis)
- [ ] **Objective:** Fan out events across multiple app instances.
- **Key concepts:** `PUBLISH`/`SUBSCRIBE`/`PSUBSCRIBE`, channel naming, dedicated subscriber connection.
- **Requirements:**
  - `EventBusService.publish(channel, payload)` and `subscribe(pattern, handler)` using separate publisher and subscriber connections.
  - JSON envelope `{ id, type, source (instance id), timestamp, payload }`; ignore own messages when appropriate.
  - Run 3 instances via Docker Compose; a state change in one is observed by all.
  - Handle subscriber reconnect and resubscribe automatically.
  - Document at-most-once delivery and when to use Streams instead (include a small Redis Streams consumer-group variant for reliable delivery).
  - Bridge to a WebSocket gateway so clients on any instance get the event.
- **Input → Output:** Event published on node A → handlers fire on nodes A, B, C.
- **Acceptance criteria:** Pattern subscriptions work (`orders:*`); messages missed during a disconnect are documented as lost for Pub/Sub and recovered in the Streams variant.
- **Tests:** multi-instance integration test; reconnect test.

### NS-35 Concurrent Queue Processing & Job Rate Limiting (BullMQ)
- [ ] **Objective:** Control worker concurrency and execution rate.
- **Key concepts:** worker `concurrency`, queue `limiter`, rate-limit-aware processing.
- **Requirements:**
  - Processor with `concurrency: 10` calling a (mock) external API.
  - Limiter `{ max: 100, duration: 60000 }`.
  - Instrument max in-flight jobs and jobs-per-minute; expose as metrics.
  - Handle the external API's own 429 by calling `worker.rateLimit(ms)` and throwing `Worker.RateLimitError`.
  - Scale to two worker processes and show the limiter still holds globally.
  - Graceful shutdown (`worker.close()` waits for active jobs).
- **Input → Output:** 1,000 enqueued jobs drain without exceeding limits.
- **Acceptance criteria:** Never > 10 concurrent; never > 100 executions in any 60-second window; no jobs lost on shutdown.
- **Tests:** load test with timestamps recorded by the mock API.

### NS-36 Complex Queue Workflows: Parent-Child Job Flows (BullMQ)
- [ ] **Objective:** Orchestrate dependent job trees.
- **Key concepts:** `FlowProducer`, parent/child jobs, `getChildrenValues()`.
- **Requirements:**
  - Video-pipeline simulation: parent `finalize` waits for children `encode-720p`, `encode-1080p`, `thumbnail`, `extract-audio` (run concurrently).
  - Parent processor reads child results and writes an aggregated manifest.
  - Failure policy: configurable `failParentOnFailure` vs `ignoreDependencyOnFailure`; retry individual child steps.
  - Optional nested flow (child that is itself a parent).
  - Endpoint `GET /pipelines/:id` showing status of each step.
- **Input → Output:** `POST /pipelines` → flow created → manifest when all children complete.
- **Acceptance criteria:** Parent never runs before all children finish; one failed child behaves per the configured policy; results aggregated correctly.
- **Tests:** success flow, child failure, retry of a single step.

### NS-37 Job Events, Progress Tracking & WebSocket Dashboard
- [ ] **Objective:** Real-time job progress in the browser.
- **Key concepts:** `job.updateProgress()`, `QueueEvents` (`progress`, `completed`, `failed`), Socket.IO rooms.
- **Requirements:**
  - Export job that processes rows in batches and reports progress 0–100 plus a message.
  - `QueueEvents` listener forwarding events to a Socket.IO gateway; clients join room `job:<id>` (only the job owner may join — verify with JWT).
  - Minimal web page with progress bar, completed state and download link, failure state with retry button.
  - Works when API and worker are separate processes.
- **Input → Output:** Starting an export shows a live progress bar.
- **Acceptance criteria:** Progress is monotonic; a user cannot subscribe to another user's job; page reconnect restores current progress.
- **Tests:** socket client test asserting event sequence; authorisation test.

### NS-38 Database Migrations & Zero-Downtime Deployment
- [ ] **Objective:** Change a schema without downtime.
- **Key concepts:** Expand and Contract, backward-compatible migrations, CI/CD automation.
- **Requirements:**
  - Perform a column rename (e.g. `users.fullname` → `users.full_name`) in stages: (1) add new column, (2) deploy app version that writes both and reads new-with-fallback, (3) backfill in batches, (4) deploy version that uses only the new column, (5) drop the old column.
  - Keep a trigger or dual-write in the expand phase so old and new app versions stay consistent.
  - Use `ALTER TABLE … ADD COLUMN` safely (no table rewrite), `CREATE INDEX CONCURRENTLY`, and `lock_timeout`.
  - Run a continuous request loop (k6/hey) during the whole sequence with two app versions running side by side.
  - CI pipeline (GitHub Actions or similar) running migrations before deploy and failing on unsafe statements (e.g. `squawk` linter).
  - Write a rollback plan for every stage.
- **Input → Output:** Migration scripts for each release plus a runbook.
- **Acceptance criteria:** Zero failed requests during the sequence; each intermediate state is compatible with both the previous and next app versions.
- **Tests:** load-test error count = 0; schema checks after each stage.

### NS-39 Redis Cluster & High-Availability Failover (Sentinel)
- [ ] **Objective:** Resilient Redis for production.
- **Key concepts:** Sentinel, primary–replica replication, Cluster sharding, failover, `ioredis` sentinel config.
- **Requirements:**
  - Docker Compose with 1 primary, 2 replicas, 3 Sentinels (quorum 2).
  - NestJS connects through Sentinel (`sentinels`, `name`) with reconnect and retry strategy; cache and BullMQ both survive a failover.
  - Kill the primary: verify promotion time, application behaviour (errors vs retries) and data loss window; document `min-replicas-to-write` trade-off.
  - Short section and demo on Redis Cluster (hash slots, hash tags for multi-key operations) and when to choose it over Sentinel.
  - Health indicator reporting the current primary.
- **Input → Output:** Failover log and application availability graph.
- **Acceptance criteria:** After killing the primary, the app recovers automatically within a documented time; queued jobs are not lost.
- **Tests:** scripted failover test with continuous reads/writes counting failures.

### NS-40 GraphQL Federation & Real-Time Subscriptions
- [ ] **Objective:** Unified supergraph across microservices.
- **Key concepts:** `@nestjs/graphql`, Apollo Federation 2, `@key`, `@ResolveReference`, subscriptions (`graphql-ws`).
- **Requirements:**
  - Subgraphs: `users` and `orders` (orders extends `User` with `orders` field); Apollo Gateway or Router composing them.
  - Subscription `orderStatusChanged(orderId)` using a pub/sub (Redis-backed in production).
  - Authentication context propagated from gateway to subgraphs; subscription auth on connection init.
  - DataLoader in reference resolvers.
  - Schema composition check in CI (`rover subgraph check` or equivalent).
- **Input → Output:** One query across both services; subscription pushes updates.
- **Acceptance criteria:** Query for user + orders resolves in a single request without N+1; unauthorised subscription rejected.
- **Tests:** e2e through the gateway; subscription event test.

### NS-41 Zero-Data-Retention & PII Redaction Pipeline
- [ ] **Objective:** Sanitise sensitive data before storage or LLM calls.
- **Key concepts:** regex masking, NER, redaction vs tokenisation, compliant logging.
- **Requirements:**
  - `RedactionService` detecting email, phone, SSN, credit card (Luhn-validated), IP, names/addresses via an NER library or service (e.g. Presidio or a local model).
  - Modes: mask (`[EMAIL]`), partial (`****1234`), reversible tokenisation (`<EMAIL_1>` with a per-request vault so the response can be re-hydrated).
  - NestJS interceptor/middleware applied to prompts going to an LLM and to log output; DTO-level decorator `@Redact()`.
  - Configurable allow/deny lists; per-tenant policy.
  - Ensure raw PII never reaches logs, traces or error messages; zero-retention: the token vault is in memory with TTL only.
  - Measure precision/recall on a labelled sample set.
- **Input → Output:** "Email me at ann@x.com, card 4111 1111 1111 1111" → "Email me at [EMAIL], card [CARD]".
- **Acceptance criteria:** ≥ 99 % recall on structured PII (email, card, SSN) in test set; no false-positive redaction of non-Luhn numbers; round-trip re-hydration works.
- **Tests:** unit tests per detector; log-scrubbing test; performance test (latency overhead).

### NS-42 Distributed Event Sourcing with Kafka & BullMQ Bridge
- [ ] **Objective:** Turn Kafka events into reliable background jobs.
- **Key concepts:** Kafka consumer groups and offsets, idempotent consumers, BullMQ job IDs, retries, DLQ.
- **Requirements:**
  - Kafka (KRaft) via Docker Compose; topic `orders.events` with several partitions; NestJS Kafka consumer (`@nestjs/microservices` or `kafkajs`).
  - For each message, enqueue a BullMQ job with `jobId` derived from the event ID (de-duplicates redeliveries); commit the offset only after the job is safely enqueued.
  - Worker processes jobs with retries/backoff; permanent failures go to a DLQ queue and a Kafka dead-letter topic.
  - Preserve per-key ordering where required (document how, e.g. group by `orderId` or partition → queue mapping).
  - Idempotency store (Redis/Postgres) so processing twice has no extra effect.
  - Metrics: consumer lag, queue depth, failure rate.
- **Input → Output:** Event published to Kafka → job completed exactly-once-in-effect.
- **Acceptance criteria:** Restarting the consumer mid-stream causes no lost or double-applied events; poison message lands in the DLQ without blocking others.
- **Tests:** replay the same event twice; kill the consumer; poison message.

---

## Duplicate Mapping — "Top 50" List → Programs in This Document

| Top-50 # | Title | Already covered by | Extra detail worth adding |
|---|---|---|---|
| 1 | Hello World, Controllers & Modular Architecture | NS-01 | In-memory task management API |
| 2 | DI & Service Provider Layer | NS-02 | Environment-based logging and metrics providers |
| 3 | DTOs & Class Validation | NS-03 | `UserRegistrationDto` with `@Type()` |
| 4 | Custom Middleware | NS-04 | Latency, method, path, client IP logging |
| 5 | Custom Parameter Decorators | NS-05 | `@CurrentUser()` |
| 6 | Global Exception Filters | NS-06 | `{ statusCode, timestamp, path, message }` |
| 7 | Guards & Custom Metadata | NS-07 | `ApiKeyGuard` + `@Roles('admin')` |
| 8 | Interceptors | NS-08 | `TransformInterceptor` |
| 9 | Custom Pipes | NS-09 | ID → entity pipe with 404 |
| 10 | Dynamic Modules | NS-10 | `StorageModule` / `MailerModule` |
| 11 | Type-Safe Environment | NS-11 | Add `REDIS_HOST` to the schema |
| 12 | Relational Persistence | NS-12 | Users → Posts → Comments with transactions |
| 13 | JSONB & Expression Indexing | PG-02 | — |
| 14 | Range Types, Exclusion Constraints & CTEs | PG-03, PG-04 | — |
| 15 | Transactions & Locking | PG-08 | — |
| 16 | Window Functions | PG-05 | Ledger-log dataset |
| 17 | PL/pgSQL & Triggers | PG-07 | — |
| 18 | Full-Text Search | PG-11 | — |
| 19 | `EXPLAIN ANALYZE` | PG-10 | — |
| 20 | Partitioning & High-Volume Ingestion | PG-14 and PG-06 | Combine: bulk `COPY` + upsert into the partitioned table |
| 21 | Distributed Caching & Invalidation | NS-19 | Add cache-stampede prevention (single-flight lock or probabilistic early refresh) |
| 22 | Session Management & Distributed State | **NS-33 (new)** | — |
| 23 | Rate Limiting (Redis sliding window) | NS-20 | Use a sliding-window algorithm and per-tenant-token keys |
| 24 | Pub/Sub Engine | **NS-34 (new)** | — |
| 25 | Authentication (JWT + Bcrypt) | NS-14 | — |
| 26 | RBAC / ABAC | NS-15 | Action-level permissions vs ownership rules |
| 27 | Asynchronous Job Ingestion (BullMQ) | NS-17 | Email or image processing on registration |
| 28 | Delayed Jobs, Scheduled Tasks & Retries | NS-17 | Order-processing queue, delayed follow-up notifications, webhook retry up to 5 times, DLQ and job cleanup |
| 29 | Concurrent Queue Processing & Rate Limiting | **NS-35 (new)** | — |
| 30 | Parent-Child Job Flows | **NS-36 (new)** | — |
| 31 | Job Events, Progress & WebSocket Dashboard | **NS-37 (new)** | — |
| 32 | WebSockets | NS-16 | — |
| 33 | Event-Driven Microservices | NS-26 | — |
| 34 | Swagger | NS-22 | — |
| 35 | Unit Testing | NS-23 | — |
| 36 | E2E Testing | NS-24 | — |
| 37 | Event Sourcing & CQRS | NS-25 | Consider adding an event store (append-only table) to make it true event sourcing |
| 38 | Connection Pooling, PgBouncer & Read Replicas | **PG-16 (new)** | — |
| 39 | Multi-Tenant Isolation & RLS | NS-27, PG-13 | — |
| 40 | MCP Server in NestJS | NS-28 | — |
| 41 | Permission-Aware Vector RAG | NS-29, PG-12 | — |
| 42 | Multi-Cloud LLM Gateway | NS-31 | — |
| 43 | Distributed Tracing | NS-30 | — |
| 44 | Containerization & Kubernetes | NS-32 | — |
| 45 | Zero-Downtime Migrations | **NS-38 (new)** | — |
| 46 | Redis Sentinel / Cluster | **NS-39 (new)** | — |
| 47 | CDC with Logical Replication | PG-15 | Add Debezium → search database (e.g. OpenSearch) as a stretch goal |
| 48 | GraphQL Federation & Subscriptions | **NS-40 (new)**; basic GraphQL in NS-21 | — |
| 49 | PII Redaction Pipeline | **NS-41 (new)** | — |
| 50 | Kafka + BullMQ Bridge | **NS-42 (new)** | — |

---

# PART D — PostgreSQL (PG-01 to PG-16)

> Each program: PostgreSQL 15+, Docker, scripts in `01_schema.sql`, `02_seed.sql`, `03_queries.sql`, `99_cleanup.sql`, and `NOTES.md` with observed results. Every constraint or policy must be proven by at least one statement that is **expected to fail** (show the error message in `NOTES.md`).

## Level 1: Fundamentals, Schema Design & Advanced Data Types

### PG-01 Tables, Constraints & Referential Integrity
- [ ] **Objective:** Normalised schema enforcing business rules.
- **Key concepts:** PK, composite keys, FK cascades (`ON DELETE CASCADE`/`SET NULL`), `CHECK`, `EXCLUDE` with `btree_gist`.
- **Requirements:**
  - Tables `users`, `products`, `orders`, `order_items`, plus `reservations` (with a date range).
  - `CHECK (stock >= 0)`, `CHECK (price >= 0)`, pricing tiers must not have `min_qty >= max_qty`; composite PK on `order_items(order_id, product_id)`.
  - `EXCLUDE USING gist` preventing overlapping reservations for the same product.
  - FK behaviours chosen and justified (deleting an order cascades items; deleting a user sets `orders.user_id` NULL or is restricted — document).
  - Unique email (case-insensitive via `citext` or lower() index); timestamps with `timestamptz`.
- **Input → Output:** Seed data loads; invalid inserts rejected.
- **Acceptance criteria:** Negative stock, overlapping reservation, orphan order item, and invalid tier are each rejected with the expected error; schema in 3NF (explain).
- **Tests:** SQL script of 8+ failing and passing statements with expected results.

### PG-02 Advanced Data Types: JSONB & Unstructured Querying
- [ ] **Objective:** Semi-structured data inside relational tables.
- **Key concepts:** `JSONB` vs `JSON`, `@>`, `?`, `?|`, expression indexes, `jsonb_path_query`.
- **Requirements:**
  - `products.attributes JSONB` and `user_settings.config JSONB` with 10k+ generated rows.
  - Queries: containment, key existence, nested path filter, array element match.
  - Updates: `jsonb_set`, `||` merge, `#-` delete key, never rewriting the whole document unnecessarily.
  - A GIN index (`jsonb_path_ops`) and an expression index (`(attributes->>'brand')`); show with `EXPLAIN` that each is used.
  - A `CHECK` constraint validating required JSON keys.
- **Input → Output:** Query results + before/after plans.
- **Acceptance criteria:** Indexed queries use Index/Bitmap scans; update changes only the target key.
- **Tests:** Result-count assertions and `EXPLAIN` output captured.

### PG-03 Arrays, Ranges & Composite Custom Types
- [ ] **Objective:** Non-scalar native types.
- **Key concepts:** arrays (`ANY()`, `unnest()`), `DATERANGE`/`TSTZRANGE`, `@>`, `&&`, `CREATE TYPE`.
- **Requirements:**
  - Booking system: `resources`, `bookings(resource_id, period TSTZRANGE)` with `EXCLUDE USING gist (resource_id WITH =, period WITH &&)`.
  - Tags as `TEXT[]` with GIN index; query "has all tags" (`@>`) and "has any tag" (`&&`).
  - Composite type `address` and an enum type for booking status.
  - Query for free slots (gaps) using range functions.
- **Input → Output:** Overlapping booking insert fails; free-slot query returns gaps.
- **Acceptance criteria:** Overlap is blocked by the DB, even under two concurrent sessions; `[)` bound convention documented.
- **Tests:** Passing and failing inserts; two-session overlap test.

## Level 2: Advanced SQL, Analytics & Data Processing

### PG-04 Complex Joins, CTEs & Recursive Queries
- [ ] **Objective:** Hierarchical and multi-step SQL.
- **Key concepts:** inner/outer/cross/lateral joins, `WITH`, `WITH RECURSIVE`.
- **Requirements:**
  - `comments(id, parent_id, body)` and `employees(id, manager_id)` with ≥ 1,000 rows and depth ≥ 5.
  - Recursive CTE returning full tree with `depth` and `path` (array or text), ordered for display.
  - Cycle protection (`CYCLE` clause or path check).
  - A `LATERAL` join "top 3 comments per post"; a `FULL OUTER JOIN` anti-join report.
- **Input → Output:** Tree listing with indentation levels.
- **Acceptance criteria:** Subtree-of-X query works; inserting a cycle does not loop forever.
- **Tests:** Known expected tree compared to output.

### PG-05 Window Functions & Analytical Aggregations
- [ ] **Objective:** Analytics without collapsing rows.
- **Key concepts:** `OVER (PARTITION BY … ORDER BY …)`, `ROW_NUMBER`, `RANK`, `LAG`/`LEAD`, windowed aggregates.
- **Requirements:** `transactions` table (100k+ rows). Deliver: month-over-month sales growth %, top-N products per category, customer inter-purchase intervals (`LAG`), retention flag, 7-day moving average (`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`), running total, percentiles with `NTILE`.
- **Input → Output:** Result tables per metric.
- **Acceptance criteria:** Each metric verified against a hand-calculated small dataset; `RANK` vs `DENSE_RANK` difference shown with ties.
- **Tests:** Small fixture with known answers.

### PG-06 Upserts, Bulk Operations & Returning Clauses
- [ ] **Objective:** Idempotent high-throughput ingestion.
- **Key concepts:** `INSERT … ON CONFLICT DO UPDATE/NOTHING`, `RETURNING`, `COPY`.
- **Requirements:**
  - Staging table loaded with `COPY` from CSV (100k rows); merge into target with upsert only updating when data actually changed (`WHERE target IS DISTINCT FROM EXCLUDED`).
  - `RETURNING` (with `xmax = 0` trick or equivalent) to classify inserted vs updated rows and write them to `audit_log`.
  - Running the load twice yields zero updates the second time.
  - Optional: `MERGE` (PG 15) comparison.
- **Input → Output:** Counts of inserted/updated/unchanged rows.
- **Acceptance criteria:** Idempotent; audit rows match actual changes.
- **Tests:** Run-twice test; modified-row test.

## Level 3: Programmatic Database Logic & Transactions

### PG-07 Stored Procedures, PL/pgSQL Functions & Triggers
- [ ] **Objective:** Logic and integrity inside the DB.
- **Key concepts:** `CREATE FUNCTION/PROCEDURE`, PL/pgSQL, triggers, `NEW`/`OLD`.
- **Requirements:**
  - `audit_logs(table_name, row_pk, operation, changed_by, changed_at, old_data JSONB, new_data JSONB, diff JSONB)`.
  - Generic `AFTER INSERT OR UPDATE OR DELETE` trigger function usable on any table; for updates store only the changed columns.
  - `BEFORE UPDATE` trigger maintaining `updated_at`.
  - One procedure with transaction control (`CALL archive_old_orders(days)` committing in batches).
  - Raise meaningful exceptions with `RAISE EXCEPTION … USING ERRCODE`.
- **Input → Output:** Updating a row writes one audit record with the diff.
- **Acceptance criteria:** No-op updates produce no audit row; trigger works on at least 2 tables.
- **Tests:** Insert/update/delete scenarios and expected audit content.

### PG-08 Transaction Isolation Levels & Concurrency Control
- [ ] **Objective:** Prevent races and anomalies.
- **Key concepts:** ACID, `READ COMMITTED`/`REPEATABLE READ`/`SERIALIZABLE`, `SELECT … FOR UPDATE`/`FOR SHARE`/`SKIP LOCKED`, deadlocks.
- **Requirements:**
  - `accounts` transfer function and `inventory` reservation function.
  - Reproduce lost update, non-repeatable read and write skew using two `psql` sessions; fix each with the appropriate level or lock.
  - Deterministic lock ordering to avoid deadlocks; reproduce and observe one deadlock.
  - Concurrency test: 50 parallel workers (pgbench or script) doing transfers; total money unchanged and no negative balance.
  - Retry loop for serialization failures (`40001`).
- **Input → Output:** Final balances and stock counts.
- **Acceptance criteria:** Invariants hold after the stress test; no double-spend.
- **Tests:** `pgbench` custom script plus invariant-check query.

## Level 4: Indexing, Query Optimization & Performance Tuning

### PG-09 Advanced Indexing Strategies
- [ ] **Objective:** Pick the right index.
- **Key concepts:** B-Tree, Hash, GIN, GiST, partial and expression indexes.
- **Requirements:** `logs` table with ≥ 1,000,000 rows (status, level, created_at, tags `TEXT[]`, payload JSONB). Create: partial index for `status='active'`, GIN for tags and JSONB, expression index on `lower(email)`, covering index (`INCLUDE`), BRIN on `created_at`. Benchmark queries before/after (timings and plans); report index sizes and write overhead.
- **Input → Output:** Benchmark table (query, before ms, after ms, index size).
- **Acceptance criteria:** Each index shows measurable improvement for its target query; unused index identified via `pg_stat_user_indexes`.
- **Tests:** `EXPLAIN` output captured per query.

### PG-10 Execution Plan Analysis (`EXPLAIN ANALYZE`) & Tuning
- [ ] **Objective:** Diagnose and fix slow queries.
- **Key concepts:** `EXPLAIN (ANALYZE, BUFFERS)`, seq/index/bitmap scans, nested loop/hash/merge join, `work_mem`.
- **Requirements:** Start with a deliberately slow query (correlated subquery over 3+ tables, ≥ 1M rows); capture the plan; identify the bottleneck node; apply fixes (rewrite to join/CTE, add index, `ANALYZE`, tune `work_mem`, avoid sort spill to disk); document each iteration with plan snippets.
- **Input → Output:** Optimisation report.
- **Acceptance criteria:** ≥ 10× speedup, no sequential scan on the large table, no disk sort in the final plan; explanation of estimate vs actual row differences.
- **Tests:** Final timing vs baseline.

### PG-11 Full-Text Search (FTS) & Text Processing
- [ ] **Objective:** Native search engine.
- **Key concepts:** `tsvector`, `tsquery`, stemming, `to_tsvector`, `phraseto_tsquery`, GIN, `ts_rank`.
- **Requirements:** `articles(title, body)` with ≥ 10k rows; generated `tsvector` column weighting title (A) over body (B); GIN index; search with `websearch_to_tsquery`; ranked results with `ts_rank_cd`; highlighted snippets via `ts_headline`; fuzzy/typo matching with `pg_trgm`; pagination.
- **Input → Output:** Query "running databases" → ranked articles matching "run"/"database".
- **Acceptance criteria:** Stemming works; title matches rank above body-only; index is used; typo query returns near matches.
- **Tests:** Expected top results for 5 sample queries.

## Level 5: Vector Search, SaaS Architecture & Enterprise Security

### PG-12 PGVector & Hybrid Vector-Relational Search
- [ ] **Objective:** Vector similarity in Postgres.
- **Key concepts:** `vector` type, `<=>`, `<->`, `<#>`, HNSW vs IVFFlat.
- **Requirements:** `CREATE EXTENSION vector`; `documents(id, category, content, embedding vector(N))` (N matches your embedding model); generate embeddings with an LLM embedding API (or a local model) for ≥ 1,000 chunks; HNSW index with `vector_cosine_ops` (and compare IVFFlat); hybrid query `WHERE category='tech' ORDER BY embedding <=> $1 LIMIT k`; tune `hnsw.ef_search`; measure recall vs exact search.
- **Input → Output:** Top-K most similar chunks.
- **Acceptance criteria:** Index used (`EXPLAIN`); recall ≥ 90 % at chosen settings; filtered search returns only the category requested (note the filtering + ANN trade-off).
- **Tests:** Recall measurement script.

### PG-13 Row-Level Security (RLS) & Multi-Tenant SaaS Isolation
- [ ] **Objective:** DB-enforced tenant isolation.
- **Key concepts:** `CREATE POLICY`, `ENABLE ROW LEVEL SECURITY`, `current_setting()`, `SET LOCAL app.current_tenant_id`.
- **Requirements:** Shared tables with `tenant_id`; app role without `BYPASSRLS` and not the table owner (or use `FORCE ROW LEVEL SECURITY`); policies for `SELECT`/`INSERT`/`UPDATE`/`DELETE` with `USING` and `WITH CHECK`; fail-closed when the setting is missing; tenant context set inside each transaction; pooled-connection safety (`SET LOCAL`, not `SET`).
- **Input → Output:** Same query returns different rows per tenant.
- **Acceptance criteria:** Cross-tenant read, update and insert are blocked; no tenant set → zero rows; superuser/owner bypass explained.
- **Tests:** Two-tenant scripted checks, including a forged `tenant_id` on insert.

### PG-14 Connection Pooling, Scaling & Partitioning
- [ ] **Objective:** Scale large tables and connections.
- **Key concepts:** declarative partitioning (range/list/hash), PgBouncer (transaction vs session mode), read replicas.
- **Requirements:** `telemetry_data` partitioned by month on `recorded_at` with ≥ 12 partitions and 10M+ rows (generated); default partition; automatic creation of future partitions (script or `pg_partman`); show partition pruning in `EXPLAIN`; drop an old partition instantly; PgBouncer in front of Postgres, benchmark with and without it (`pgbench -c 200`); document what breaks in transaction mode (session state, prepared statements).
- **Input → Output:** Plans and benchmark table.
- **Acceptance criteria:** Date-bounded query scans only relevant partitions; pooled run sustains more clients with lower connection count.
- **Tests:** `EXPLAIN` output; benchmark results.

### PG-15 Backup, Recovery, Extensions & Logical Replication
- [ ] **Objective:** Operational resilience and CDC.
- **Key concepts:** `pg_dump`/`pg_restore`, WAL, PITR, publications/subscriptions, `CREATE EXTENSION`.
- **Requirements:**
  - Logical dump and restore of a database into a fresh instance with row counts verified.
  - Base backup (`pg_basebackup`) + WAL archiving; perform PITR to a chosen timestamp after an accidental `DELETE`.
  - Two Postgres containers: `wal_level=logical`, publication on selected tables, subscription on the analytics DB; demonstrate insert/update/delete replication and an initial sync; show replication lag and slot status; document DDL not being replicated.
  - List and manage extensions used in this course (`btree_gist`, `pg_trgm`, `vector`).
- **Input → Output:** Replicated changes visible on the subscriber within seconds.
- **Acceptance criteria:** Restore equals source; PITR recovers the deleted rows; subscriber stays in sync after restart.
- **Tests:** Row-count/checksum comparison queries.

---

### PG-16 PgBouncer Connection Pooling with Read/Write Query Routing
- [ ] **Objective:** Absorb connection spikes and route reads to replicas.
- **Key concepts:** PgBouncer pool modes (transaction vs session), streaming replication, read replicas, query routing, replication lag.
- **Requirements:**
  - Docker Compose: 1 primary + 1–2 streaming replicas (`pg_basebackup`, `primary_conninfo`), PgBouncer in front of each role (or one config with two databases: `app_rw`, `app_ro`).
  - PgBouncer in transaction mode: `default_pool_size`, `max_client_conn`, `server_reset_query` choices documented; list features that break (session `SET`, advisory locks, `LISTEN`, prepared statements → `max_prepared_statements` in recent versions).
  - NestJS data layer with two connection pools: writes and anything inside a transaction → primary; plain reads (opt-in `@ReadOnly()` decorator or `readReplica` flag) → replica.
  - "Read-your-writes" handling: after a write, pin the user's next reads to the primary for N seconds (or until replica LSN catches up).
  - Fail over reads to the primary when the replica is down or lagging beyond a threshold.
  - Benchmark with `pgbench -c 500` direct vs through PgBouncer; show `SHOW POOLS;` stats.
- **Input → Output:** Benchmark table and routing log showing which node served each query.
- **Acceptance criteria:** Writes never reach a replica (verified by the replica's read-only error if attempted); reads are served by the replica under normal conditions; 500 client connections handled with ≤ 50 server connections.
- **Tests:** routing unit tests with mocked pools; integration test checking `pg_is_in_recovery()` result per route; replica-down test.

---

---

# PART E — Python (PY-01 to PY-21)

### PY-01 Objects - Mutable and Immutable in Python
- [ ] **Objective:** Explain how Python names refer to objects and distinguish in-place mutation from rebinding.
- **Key concepts:** Object identity versus equality; mutable lists and dictionaries; immutable integers, strings, and tuples; aliases; shallow immutability of containers.
- **Requirements:** Write a runnable Python script that demonstrates two names referring to the same list, a list changing in place, an integer name being rebound without changing its former value, and a tuple containing a mutable list.
- **Input → Output:** A short script with printed values that make mutation and rebinding visible.
- **Acceptance criteria:** The demonstration shows an aliased list after in-place mutation, preserves the old integer value after rebinding, and shows that a tuple can contain a mutable object.
- **Tests:** Run the script and confirm each printed value matches the expected object behavior.

### PY-02 Numbers, Booleans & Operators in Python
- [ ] **Objective:** Choose numeric types and operators appropriately, and predict how Python evaluates Boolean expressions.
- **Key concepts:** Integers, floats, complex numbers, booleans, conversions, floor division and modulo, floating-point approximation, Decimal, Fraction, truthiness, short-circuiting, comparisons, identity, membership, bitwise operators, precedence, and common exceptions.
- **Requirements:** Write a runnable Python script that demonstrates numeric literals and conversions, arithmetic including negative floor division and modulo, floating-point comparison with `math.isclose`, Boolean short-circuiting and truthiness, chained comparisons, and one formatted result.
- **Input → Output:** A compact set of printed examples with values that illustrate Python's numeric and Boolean rules.
- **Acceptance criteria:** The examples show that `/` produces a float, `//` floors toward negative infinity, `and`/`or` return operands, and float comparisons should use `math.isclose` when approximate equality is intended.
- **Tests:** Run the script and compare its output with the expected results in the lesson.

### PY-03 Strings, Indexing, Slicing & Encoding in Python
- [ ] **Objective:** Select and rebuild string content and exchange Unicode text as correctly encoded bytes.
- **Key concepts:** Immutable Unicode strings, positive and negative indexing, substring searches, exclusive slice bounds, strides, reversal, encoding and decoding, UTF-8, bytes and bytearray, normalization, casefold, and explicit file encodings.
- **Requirements:** Write runnable examples that search strings, index and slice text, rebuild immutable strings, round-trip UTF-8 data, compare text and byte lengths, handle encoding errors explicitly, normalize equivalent Unicode sequences, and read and write a UTF-8 file.
- **Input → Output:** Small standalone scripts with printed results demonstrating text selection and correct conversion between strings and bytes.
- **Acceptance criteria:** Positive and negative indexing preserve string immutability; searches distinguish missing matches from position zero; slices demonstrate exclusive stops, clipped bounds, strides, and reversal; UTF-8 examples distinguish code points from bytes; encoding failures are surfaced without silent data loss; normalization and file I/O use explicit text conventions.
- **Tests:** Run every script and compare its output with the lesson, including missing substrings, empty slices, incomplete UTF-8 bytes, and equivalent composed and decomposed text.

### PY-04 Lists, Methods & Operators in Python
- [ ] **Objective:** Create, read, change, combine, and convert Python lists, and predict which operations change a list in place and which return a new object.
- **Key concepts:** Ordered mutable sequences, list literals and constructors, positive and negative indexing, slicing and strides, `len`, `in`, `index`, `count`, `min`, `max`, `append`, `insert`, `remove`, `pop`, `extend`, `sort`, `reverse`, `sorted`, `copy`, `clear`, `+` and `*`, `split` and `join`, aliasing, shallow copies, and common exceptions.
- **Requirements:** Write runnable examples that create lists in several ways, index and slice them, call the seven core in-place methods, combine lists with `+` and `*`, convert between strings and lists with `split` and `join`, avoid the common list mistakes, and finish with a movie watchlist program that prints its list after each of eleven tasks.
- **Input → Output:** Small standalone scripts with printed list values, ending with a program that prints eleven numbered lines.
- **Acceptance criteria:** Lists are created from literals, constructors, and `split`; indexing and slicing return items or new lists without changing the original; the seven core methods change the list in place and only `pop` returns a value; `+` and `*` build new lists and leave the originals unchanged; `split` and `join` convert between strings and lists; the common mistakes are demonstrated with their fixes; the watchlist program prints the expected eleven lines.
- **Tests:** Run every script and compare its output with the lesson, including the `ValueError` and `IndexError` cases and the final eleven-line watchlist output.

### PY-05 Sets & Frozensets in Python
- [ ] **Objective:** Create, update, combine, and compare Python sets, remove duplicates with them, and use frozensets as immutable, hashable sets.
- **Key concepts:** Unordered collections of unique hashable items, set literals, `set()` and set comprehensions, the empty-set rule (`{}` is a dict), hashability and `TypeError: unhashable type`, `1`, `1.0` and `True` collapsing, `add`, `update`, `remove`, `discard`, `pop`, `clear`, `copy`, `in` and `len`, union, intersection, difference and symmetric difference as operators and methods, subset, superset and `isdisjoint`, in-place set updates, operators versus methods accepting any iterable, duplicate removal with `set` and `dict.fromkeys`, `frozenset`, frozensets as dictionary keys and set elements, average costs, and gotchas such as set order and `RuntimeError` when changing a set while iterating.
- **Requirements:** Write runnable examples that create sets in several ways, show which items are hashable, call the core add, remove and update methods, apply the four set operations as operators and as methods, test subset, superset and disjoint relations, remove duplicates and sort sets for display, demonstrate frozenset immutability and its use as a dictionary key, show the common gotchas, and finish with a student course enrollments program that compares two course groups and protects a frozenset of mandatory courses.
- **Input → Output:** Small standalone scripts with printed set values, ending with a program that prints twelve lines about two course groups.
- **Acceptance criteria:** Sets are created from literals, `set()`, and comprehensions, duplicates vanish, and an empty set needs `set()`; only hashable items can be set elements, and equal values such as `1`, `1.0`, and `True` collapse into one; `add`, `update`, `remove`, `discard`, `pop`, `clear`, and `copy` work as described, with `KeyError` only from `remove` and `pop`; union, intersection, difference, and symmetric difference give the same results as operators and as methods; subset, superset, and disjoint tests and in-place updates work, and operators need sets while methods accept any iterable; sets remove duplicates, count distinct values, and are sorted into lists for display; a frozenset supports read-only operations, rejects changes with `AttributeError`, and works as a dictionary key or set element; the common gotchas and the course enrollments program print the expected output.
- **Tests:** Run every script and compare its output with the lesson, including the `TypeError`, `KeyError`, `RuntimeError`, and `AttributeError` cases and the final twelve-line course enrollments output.

### PY-06 Dictionaries in Python
- [ ] **Objective:** Create, read, change, merge, loop over, copy, and convert Python dictionaries, and predict which operations change a dictionary in place, which return a new object, and which raise `KeyError`.
- **Key concepts:** Insertion-ordered key-value mappings, hashable and unique keys, `1`, `1.0` and `True` as one key, dict literals, `dict()`, `fromkeys`, and comprehensions, `d[k]`, `get`, `in`, `len`, `setdefault`, `update`, `|` and `|=`, `del`, `pop`, `popitem`, `clear`, live `keys`, `values` and `items` views, sorting by value, inverting and filtering, counting and grouping patterns, nested access, aliasing, shallow copies versus `deepcopy`, `json.dumps` and `json.loads`, and common exceptions.
- **Requirements:** Write runnable examples that create dictionaries in several ways, choose valid keys, read values safely with `get` and `setdefault`, add, update, merge, and remove pairs, loop over views, apply counting, grouping, and nested-lookup patterns, copy dictionaries and convert them to JSON, avoid the common dictionary mistakes, and finish with a customer profile program that prints its dictionary after nine tasks and a short bonus section.
- **Input → Output:** Small standalone scripts with printed dictionary values, ending with a program that prints nine numbered outputs and a formatted bonus listing.
- **Acceptance criteria:** Dictionaries are created from literals, `dict()`, `fromkeys`, and comprehensions, and keys must be hashable; values are read with `d[k]`, `get`, `in`, and `setdefault`, and only `d[k]` raises `KeyError` for a missing key; pairs are added, updated, merged, and removed with assignment, `update`, `|`, `del`, `pop`, and `popitem`; loops and views read the dictionary while sorting, inversion, and filtering build new objects; counting, grouping, and nested lookups use `get` and `setdefault`; copies and JSON conversion are demonstrated, including a shallow copy versus `deepcopy`; the gotchas are demonstrated with their fixes; the customer profile program prints the expected nine numbered outputs.
- **Tests:** Run every script and compare its output with the lesson, including the `TypeError`, `KeyError`, and `RuntimeError` cases and the final customer profile output.

### PY-07 The collections Module: Advanced Data Types in Python
- [ ] **Objective:** Choose and use the specialised containers in the `collections` module to build records, queues, frequency tables, grouped data, caches, and layered settings with less code than plain lists and dicts.
- **Key concepts:** `namedtuple` (`_asdict`, `_replace`, `_fields`, `defaults`), `deque` (`appendleft`, `popleft`, `rotate`, `maxlen`), `Counter` (`most_common`, `update`, arithmetic, `elements`), `defaultdict` and its factory, `OrderedDict` (`move_to_end`, `popitem(last=False)`, order-sensitive equality), an LRU cache, `ChainMap` layering, the `UserDict`, `UserList`, and `UserString` wrappers, and related tools (`heapq`, `dataclass`, `NamedTuple`, `lru_cache`).
- **Requirements:** Write runnable examples for each collections type, demonstrate its main methods and its gotchas (immutable fields, empty-deque `IndexError`, `Counter` subtraction dropping non-positive counts, `defaultdict` creating keys on read, `ChainMap` writing to the first map, `dict` subclasses bypassing overrides), build a small LRU cache with `OrderedDict`, and finish with a program that combines `Counter`, `defaultdict`, `namedtuple`, and `deque`.
- **Input → Output:** Small standalone scripts with printed values, ending with a program that prints four lines about a sample sentence.
- **Acceptance criteria:** namedtuple records are read by name or position, unpack like tuples, convert with `_asdict`, and change only through `_replace`; deque adds and removes at both ends, rotates, and a `maxlen` deque drops the oldest items; Counter counts hashable items, treats a missing item as 0, ranks with `most_common`, and supports arithmetic that keeps only positive counts; defaultdict groups and counts without `KeyError`, and reading a missing key creates it while `get` does not; OrderedDict provides `move_to_end`, `popitem(last=False)`, and order-sensitive equality, and they power an LRU cache; ChainMap searches maps left to right and writes only to the first map; the User* wrappers send every operation through overridden methods, unlike a dict subclass; the combined program prints the four expected lines.
- **Tests:** Run every script and compare its output with the lesson, including the empty-deque `IndexError`, the `Counter` subtraction result, the LRU eviction output, the `dict` versus `UserDict` `update` difference, and the four-line final program.

### PY-08 Python Data Types: Choosing the Right Type
- [ ] **Objective:** Identify Python's built-in types, convert between them safely, and choose the right type for a job while avoiding the common type traps.
- **Key concepts:** Dynamic and strong typing; the built-in type map; mutable versus immutable types; `type`, `isinstance`, and conversion constructors; integer, float, complex, and Boolean behavior; floor division, `math.isclose`, `Decimal`, and tie-to-even rounding; immutable strings and f-string format specs; list, tuple, and range; truthiness and `None`; identity versus equality; shallow copies; mutable default arguments; hashability; type hints that are not enforced at runtime.
- **Requirements:** Write runnable examples that print the type map with mutability, check and convert types (including the failing `int("3.7")` and `"5" + 5` cases), compute with numbers, strings, lists, tuples, and ranges, test truthiness and `is None`, show aliasing, copying, and the mutable default argument fix, show unenforced type hints, choose a type for several jobs, and finish with one program that uses every type family.
- **Input → Output:** Small standalone scripts with printed values and caught exceptions, ending with a program that prints numbered lines for each type family.
- **Acceptance criteria:** The built-in type map names each type and marks it mutable or immutable; types are checked with `type()` and `isinstance()` and converted with constructors, including the failing conversions; numbers show true and floor division, exact `Decimal` arithmetic, float approximation, and tie-to-even rounding; strings are immutable, their methods return new strings, and f-strings format values; lists change in place while `sorted()` returns a new list, and tuples and ranges are immutable; truthiness and the `is None` test are shown with the falsy values; aliases, shallow copies, and the mutable default argument fix are demonstrated; type hints are shown as not enforced, and a type is chosen for each job.
- **Tests:** Run every script and compare its output with the lesson, including the `ValueError`, `TypeError`, and unhashable-key cases and the final numbered program output.

### PY-09 Operator Overloading & bytearray in Python
- [ ] **Objective:** Teach custom classes to work with Python operators and built-in functions through special methods, and create, edit, and convert mutable binary data with `bytearray`.
- **Key concepts:** Special (dunder) methods, `__add__`, reflected `__radd__`, in-place `__iadd__`, returning `NotImplemented`, `__repr__` and `__str__`, `__eq__` and `__hash__`, `__bool__`, `__len__`, `__getitem__`, `__setitem__`, `__contains__`, `__iter__`, `__call__`, `functools.total_ordering`, `sum()` support, `bytes` versus `bytearray`, indexing and slicing, in-place editing, `encode` and `decode`, `hex`, `to_bytes`, `int.from_bytes`, `struct`, `memoryview`, `readinto`, and common gotchas.
- **Requirements:** Write runnable examples of a `Vector` class with arithmetic, equality, hashing, truthiness, and indexing; a `Version` class using `@total_ordering`; in-place and `sum()` support; the equality and hashing rule; and protocol methods. Then demonstrate `bytes` and `bytearray` creation, in-place editing, methods and conversions, `memoryview` and `readinto`, the gotchas, and finish with a `ByteBuffer` class that supports `+`, `+=`, `^`, `==`, `len()`, indexing, slicing, and `bytes()`.
- **Input → Output:** Small standalone scripts with printed values, ending with a program that prints seven labeled lines for a `ByteBuffer` packet.
- **Acceptance criteria:** Operators call special methods, with `NotImplemented` and reflected methods as the fallback; `Vector` supports arithmetic, equality, hashing, truthiness, indexing, and unpacking; `@total_ordering` generates the missing comparisons and enables `sorted()` and `max()`; in-place operators return `self`, and `sum()` works through `__radd__`; `__eq__` and `__hash__` are kept consistent, and protocol methods support `len()`, `in`, loops, and calls; `bytes` is immutable and hashable while `bytearray` is mutable and can be edited in place; text, hex, integers, and `struct` convert to and from bytes, with `memoryview` and the common gotchas; `ByteBuffer` prints the expected seven lines.
- **Tests:** Run every script and compare its output with the lesson, including the `TypeError` and `ValueError` cases and the final seven-line `ByteBuffer` output.

### PY-10 Conditionals in Python
- [ ] **Objective:** Make decisions in Python with `if`, `elif`, `else`, comparison and logical operators, the ternary expression, and `match`/`case`, and avoid the classic conditional mistakes.
- **Key concepts:** `if`/`elif`/`else` with the first true branch winning, colons and 4-space indentation, truthy and falsy values (`0`, `0.0`, `""`, `[]`, `{}`, `()`, `set()`, `None`, `False`), comparison operators and chained comparisons, `is` and `is not`, `in` and `not in`, `and`, `or`, `not` with short-circuiting, operands returned instead of `True`/`False`, `and` binding tighter than `or`, flat versus nested conditions, the ternary `a if cond else b`, `is None` checks, `match`/`case` with `|` alternatives, the `_` default and `if` guards, and classic mistakes such as `x = 5`, `x == 1 or 2`, `== True`, `== None`, and overlapping `if` statements.
- **Requirements:** Write runnable examples that choose a grade with `if`/`elif`/`else`, test truthy and falsy values, apply every comparison operator, combine tests with `and`, `or`, and `not`, flatten a nested condition, use the ternary expression, check membership and `None`, route commands with `match`/`case`, show each classic mistake with its fix, and finish with a cinema desk program that prices tickets, applies coupons, and sets access levels.
- **Input → Output:** Small standalone scripts with printed results, ending with a program that prints six visitor lines, a total line, and a line for an empty visitor list.
- **Acceptance criteria:** `if`/`elif`/`else` runs only the first true branch and branches are ordered from most specific to most general; truthy and falsy values work as conditions; comparison, chained, `is`, and `in` operators give the expected results; `and`, `or`, and `not` short-circuit, return operands, and follow precedence; flat conditions and the ternary replace nested pyramids and simple `if`/`else` assignments; `match`/`case` handles `|` alternatives, the `_` default, and guards; the classic mistakes are demonstrated with their fixes and the cinema desk program prints the expected output.
- **Tests:** Run every script and compare its output with the lesson, including the short-circuit `noisy ran` line, the `0 or 5` result, the guarded `match` cases, and the final eight-line cinema desk output.

### PY-11 Smart Thermostat System in Python
- [ ] **Objective:** Build a rule-based smart thermostat in Python that decides between ALERT, OFF, COOLING, HEATING, and IDLE, and explain why the order of the rules is their priority.
- **Key concepts:** Guard clauses and early `return`, priority by order, combined tests with `or` and `and`, membership with `in`, ternary expressions, default and keyword arguments, negative thresholds, chained comparisons, `assert` tests, named constants, dict results, hysteresis, and scripted input.
- **Requirements:** Write a `thermostat(temp, target, mode="auto", home=True)` function that checks safety first, then the off switch, picks a comfort band of 1 degree at home and 4 away, and returns COOLING, HEATING, or IDLE; add a `target_for(hour, home)` extension, test every branch with `assert`, and finish with the complete example program.
- **Input → Output:** Temperature, target, mode, and presence values passed as arguments or from a scripted list of answers, printed as one of `ALERT: check sensor`, `OFF`, `COOLING`, `HEATING`, or `IDLE`.
- **Acceptance criteria:** Rules are checked in priority order with early-return guard clauses and the safety alert comes before the off switch; the comfort band uses a ternary expression and default arguments for mode and home; COOLING and HEATING use membership tests and the negative threshold and anything else is IDLE; the eight sample calls print COOLING, HEATING, IDLE, IDLE, IDLE, COOLING, ALERT, and OFF; target_for returns 22, 19, and 17 for the three sample calls; assert tests cover every branch and print all tests passed; named constants, dict results, hysteresis, and the scripted interactive version work as extensions.
- **Tests:** Run every script and compare its output with the lesson, including the eight sample calls, the `22 19 17` time-of-day line, the `AssertionError` message, and the final program output.

### PY-12 Loan Eligibility Checker in Python
- [ ] **Objective:** Build a loan eligibility checker that validates input, applies hard rejection rules with early returns, picks a tiered outcome from a credit score, and formats the decision with f-strings.
- **Key concepts:** Chained comparisons such as `21 <= age <= 60`, `not` with a chained comparison, named constants for policy numbers, early `return`, `if`/`elif`/`else` threshold chains tested from the highest value down, inclusive and strict boundaries, debt-to-income ratio, f-string format specs (`:.0%`, `:,`, `:.1f`, `:.2f`, `:>6`), collecting failures in a list, the chained ternary expression, input validation with `isdigit()` before `int()`, and boundary-value testing.
- **Requirements:** Write runnable examples that test the age rule with a chained comparison, format numbers with f-string specs, apply the four hard rules (age, income, debt ratio, loan amount) as early returns, map a credit score to three outcomes with `if`/`elif`, test every limit exactly, one below and one above, gather every failing reason in a list, rewrite the tiers as a chained ternary, validate text input with `isdigit()`, and finish with a `check_loan(age, income, score, emi, amount)` program that prints a decision for six applicants.
- **Input → Output:** Applicant values (age, monthly income, credit score, monthly EMI, loan amount) → a decision string such as `Approved at 9.5%`, `Manual review`, or `Rejected: DTI 67% > 50%`, ending with a program that prints six decisions.
- **Acceptance criteria:** The chained comparison `21 <= age <= 60` and named constants express the age rule and the policy numbers; f-string format specs print percentages, thousands separators, fixed decimals, and padded widths; the four hard rules run in order as early returns, each with its own message; the score tiers use `if`/`elif` with the highest threshold first and a final default return; every boundary value lands on the correct side of its limit; the collect-all-reasons variation and the chained ternary tier return the expected values; text input is checked with `isdigit()` before `int()` and the six-applicant program prints the expected decisions.
- **Tests:** Run every script and compare its output with the lesson, including the boundary table (ages 20, 21, 60, 61, income 24999 and 25000, DTI 0.50 and 0.51, scores 749 and 750), the `['age', 'income', 'credit score']` result, and the six final decisions.

### PY-13 Introduction to Loops in Python
- [ ] **Objective:** Repeat work with `for` loops and `range()`, apply the accumulator and maximum patterns, and choose between `for` and `while`.
- **Key concepts:** `for` loop anatomy, `range(stop)`, `range(start, stop)` and `range(start, stop, step)`, exclusive stop values, negative steps, the accumulator pattern, finding a maximum, iterating lists, tuples, sets, strings, dictionaries, ranges, and file lines, nested loops, indentation as the loop body, the surviving loop variable, `_` for unused values, `pass`, `for` versus `while`, and common loop mistakes.
- **Requirements:** Write runnable examples that loop with `range()` in all three forms, build totals and extremes with the accumulator and maximum patterns, loop over every kind of iterable on the sheet, nest one loop inside another to print a multiplication table, show that the loop variable survives the loop and that `_` marks an unused value, contrast `for` with `while`, demonstrate the common mistakes with their fixes, and finish with a loop toolkit program that combines the sheet's ideas.
- **Input → Output:** Small standalone scripts with hardcoded values and printed results, ending with a program that prints a deterministic report.
- **Acceptance criteria:** A `for` loop runs its body once per value and `range` yields the requested numbers without the stop value; the accumulator and find-the-maximum patterns produce a total and the largest or smallest value; a `for` loop walks lists, tuples, sets, strings, dictionaries, ranges, and the lines of a file; nested loops run the inner loop completely for every pass of the outer loop; the loop variable survives the loop, `_` marks an unused value, and `for` or `while` is chosen by what is known; the common loop mistakes are demonstrated with their fixes; the loop toolkit program prints the expected output.
- **Tests:** Run every script and compare its output with the lesson, including the four `range` forms, the 15 total, the 3 x 3 multiplication table, the `NameError` for an empty loop, the list that changes while it is looped over, and the final toolkit output.

### PY-14 Looping Through Lists in Python
- [ ] **Objective:** Loop through Python lists safely to read, total, filter, transform, and nest their items, and choose the right loop pattern for each job.
- **Key concepts:** `for` loops over items, the loop variable, empty lists, accumulator totals and averages, `ZeroDivisionError` guard, filtering with `append`, list comprehensions with `if`, tuple unpacking in the loop header, `range(len())` index loops, `enumerate`, slices, `reversed()`, `sorted(reverse=True)`, removing items while looping, copies with `a[:]`, lists of lists, nested comprehensions, and the built-ins `len`, `sum`, `min`, `max`, `sorted`, `any`, `all`, `in`, `count`, and `index`.
- **Requirements:** Write runnable examples that loop over items directly, total and average numbers, filter into a new list with a loop and with a comprehension, unpack tuples in the loop header, loop by index and with `enumerate`, loop over a slice, a reversed list, and a sorted list, show why removing items while looping skips neighbours and the two fixes, loop over lists of lists and flatten them, use the handy built-ins, and finish with a class gradebook program that combines the patterns.
- **Input → Output:** Small standalone scripts with printed values, ending with a program that prints a report, the passing students, the combined marks, the ranking, and a cleanup count.
- **Acceptance criteria:** A `for` loop reads each item directly and an empty list skips the loop body; loops total, average, filter, and transform items into results, and a list comprehension does the same in one line; tuples are unpacked in the loop header, and index loops and `enumerate` give the position when it is needed; slices, `reversed()`, and `sorted(reverse=True)` loop over part of a list or a different order without changing the list; removing items while looping skips neighbours and is fixed by building a new list or looping over a copy; lists of lists are looped with nested loops and flattened with a comprehension; the built-ins replace hand-written loops and the gradebook program prints the expected output.
- **Tests:** Run every script and compare its output with the lesson, including the `ZeroDivisionError` and unpacking `ValueError` cases, the `[3, 2]` result of the removal bug, and the final gradebook output.

### PY-15 Why Use enumerate in Python
- [ ] **Objective:** Replace manual counters and `range(len(x))` loops with `enumerate`, and use it to number items, find positions, and change list items in place.
- **Key concepts:** The manual counter and `range(len())` patterns and their off-by-one risks, `enumerate(iterable, start=0)` as a lazy iterator of `(index, item)` tuples, `next()` and `list()` on an iterator, iterator exhaustion, unpacking in the loop header, use on lists, tuples, strings, files, generators and dict views, `start=1` for human-friendly numbering, first, last and every-other tests with the index, position lists with comprehensions, assigning through the index, nested unpacking `for i, (a, b)` with `zip` and `dict.items()`, and when a plain `for` loop is enough.
- **Requirements:** Write runnable examples that show the manual counter and `range(len())` loops, inspect what `enumerate` returns with `list()` and `next()`, loop with `enumerate` over several kinds of iterable, use `start=1` and avoid the `names[n]` slip, select the first, last and every-other items, collect positions with a comprehension, change list items through the index, combine `enumerate` with `zip` and `dict.items()`, and finish with a class roster report that combines these ideas.
- **Input → Output:** Small standalone scripts with printed indexes and items, ending with a program that prints a numbered ranking, a roster with scores, matching positions, curved scores, and the remaining lazy pairs.
- **Acceptance criteria:** The manual counter and `range(len())` loops are shown with their risks; `enumerate` returns a lazy iterator of `(index, item)` tuples that is used up once consumed; `enumerate` works on lists, tuples, strings, files, generators, and dict views; `start=1` changes only the counter, so `names[n]` runs past the end while `names[n - 1]` is correct; index tests and comprehensions find the first, last, and every-other item and the positions that match a condition; assigning through the index changes the list while assigning to the loop variable does not; nested pairs from `zip` and `dict.items()` need parentheses, a plain loop is enough when only items matter, and the roster program prints the expected output
- **Tests:** Run every script and compare its output with the lesson, including the `IndexError` after `start=1`, the `ValueError` from the missing parentheses, and the final class roster report.

### PY-16 Combining Lists with zip in Python
- [ ] **Objective:** Use `zip` to walk several sequences in step, pair them, build dictionaries, unzip and transpose data, and avoid the single-use and different-length traps.
- **Key concepts:** `zip` as a lazy iterator of tuples, pairing by position, looping with unpacking, three or more sequences, stopping at the shortest input, `strict=True` (Python 3.10+), `itertools.zip_longest` and `fillvalue`, `dict(zip(keys, values))`, unzipping with `zip(*pairs)`, transposing with `zip(*matrix)`, computing across lists, comparing neighbours with `temps[1:]`, `enumerate(zip(...))`, and single-use iterators.
- **Requirements:** Write runnable examples that loop over two and three lists together, show pairing by position, handle lists of different lengths with plain `zip`, `strict=True`, and `zip_longest`, build a dictionary, unzip a list of pairs, add and multiply across lists, compare neighbours, transpose a matrix, show that a zip is consumed after one pass, combine `zip` with `enumerate`, and finish with a score report program that uses every idea.
- **Input → Output:** Small standalone scripts with printed pairs, lists, and dictionaries, ending with a program that prints fifteen labeled lines.
- **Acceptance criteria:** `zip` pairs items by position and loops over two or more lists in step; lists of different lengths stop at the shortest, and `strict=True` and `zip_longest` handle mismatches; `dict(zip(keys, values))` builds a dictionary from two lists; `zip(*pairs)` unzips a list of pairs into columns; zip computes across lists and compares neighbours with a shifted copy; `zip(*matrix)` transposes rows to columns and `enumerate(zip(...))` adds a counter; a zip object is single-use, so `list(zip(...))` is stored when it is needed twice.
- **Tests:** Run every script and compare its output with the lesson, including the `ValueError` and `TypeError` cases, the empty second pass over a consumed zip, and the final fifteen-line score report output.

### PY-17 Introducing while Loops in Python
- [ ] **Objective:** Repeat code for as long as a condition holds with `while` loops, choose between `for` and `while`, and write loops that start, test, update, and end safely.
- **Key concepts:** The `while` statement, initialise-test-update anatomy, the test running before every pass, zero-pass loops, `for` versus `while`, counting up and down, loop-until-goal, input validation, sentinel loops, `while True` with `break`, compound conditions with `and` and `not`, the causes of endless loops, `<` and `<=` versus `!=`, float comparison with `math.isclose`, and `KeyboardInterrupt` from Ctrl+C.
- **Requirements:** Write runnable examples that show the loop anatomy, compare `for` and `while`, count down, loop until a compound-interest goal is met, validate input, read until a sentinel, use `while True` with `break`, combine conditions, and demonstrate the four causes of loops that never stop with safe fixes. Simulate every `input()` reply with a hardcoded list, and finish with a program that chains six loop patterns.
- **Input → Output:** Small standalone scripts with printed values, ending with a program that prints eighteen lines from simulated replies.
- **Acceptance criteria:** A `while` loop uses a starting value, a test checked before each pass, and an update, and a false test means the body never runs; the choice between `for` and `while` is explained and shown on a known count, a collection, and an unknown number of passes; counting up, counting down, and loop-until-goal examples print the expected results; input validation and a sentinel loop repeat until a valid reply or the sentinel arrives, with replies simulated by a list; `while True` with `break` and compound conditions with `and` and `not` control when a loop ends; the four causes of loops that never stop are shown safely, with fixes, `KeyboardInterrupt`, and the `for` alternative; the final program chains six patterns and prints the expected output.
- **Tests:** Run every script and compare its output with the lesson, including the zero-pass loop, the float and `!=` stepping cases, and the final eighteen-line output.

### PY-18 Break, Continue & Loop Else in Python
- [ ] **Objective:** Control Python loops mid-flight with `break`, `continue`, and `pass`, and use the loop `else` clause as a built-in "no break" fallback for searches and bounded retries.
- **Key concepts:** `break` exits the nearest loop, `continue` skips to the next iteration, `pass` as an empty-body placeholder, loop `else` meaning "no break happened", `for`/`else` and `while`/`else`, searching with `return` and a fallback, retry with a limit, prime check with nested loops, `break` leaving only one loop level, escaping nested loops with a flag or a function `return`, `continue` jumping over a `while` counter update, and an empty loop still running its `else`.
- **Requirements:** Write runnable examples that stop a loop early with `break`, skip passes with `continue`, use `pass` as a placeholder, add a loop `else` fallback, search with a fallback, retry with a limit, check primes with nested loops, escape nested loops, use `else` and `continue` safely in `while` loops, show the common `else` mistakes with their fixes, and finish with an order-desk program that combines these ideas on hardcoded data.
- **Input → Output:** Small standalone scripts with printed progress lines, ending with a program that prints a five-report order-desk summary.
- **Acceptance criteria:** `break` leaves the nearest loop immediately and `continue` skips only the current pass; `pass` is a do-nothing placeholder that differs from `continue`; loop `else` runs only when no `break` happened and works as a search fallback; retry and prime-check programs combine `break` with loop `else`; `break` leaves only one loop level so nested loops need a flag or a function `return`; `while` loops also have `else` and `continue` must not jump over the counter update; the empty-loop and misaligned-`else` mistakes are shown with their fixes
- **Tests:** Run every script and compare its output with the lesson, including the retry, prime-check, nested-loop, and `while` examples and the final order-desk output.

### PY-19 Dictionary in Place of Match Case in Python
- [ ] **Objective:** Replace long `if/elif` and `match/case` chains with dictionary lookups and dispatch tables, and decide when a dictionary is the right tool.
- **Key concepts:** Lookup tables, keys as cases and values as results, `d[key]`, `d.get(key)`, `d.get(key, default)`, `in`, `KeyError`, the `case _` equivalent, `match/case`, dispatch tables of functions, lambdas, menus with actions, grouping many keys with one value, hashable keys, ranges and conditions, loading cases from JSON, and O(1) average lookup.
- **Requirements:** Write runnable examples that replace a day-type `if/elif` chain with a dictionary, handle missing keys with `get()` and a default, compare the result with an equivalent `match/case`, store functions without parentheses in a calculator dispatch table and a menu, group several keys under one value with a loop, show when ranges and type tests need `if` or `match`, and finish with an order router program that combines these ideas.
- **Input → Output:** Small standalone scripts with printed lookup results, ending with a program that prints five lines.
- **Acceptance criteria:** A long `if/elif` chain is replaced by a dictionary whose keys are the cases and whose values are the results; `d[key]`, `d.get(key)`, `d.get(key, default)`, and `in` handle a missing key differently, and `get()` with a default mimics `case _`; the dictionary version gives the same results as the equivalent `match/case`; functions are stored without parentheses in dispatch tables and menus, and the chosen one is called; several keys sharing one value are grouped with a loop; keys must be hashable and equal the tested value, and ranges and shape tests stay in `if` or `match`; the order router program prints the expected five lines.
- **Tests:** Run every script and compare its output with the lesson, including the `KeyError`, `TypeError`, and unhashable-key cases and the final five-line order router output.

### PY-20 The Walrus Operator in Python
- [ ] **Objective:** Use the assignment expression `:=` to assign and reuse a value in one step, apply it in `if`, `while`, comprehensions, regex matches, and `any()`/`all()`, and avoid its syntax and precedence pitfalls.
- **Key concepts:** Assignment expressions (Python 3.8+), `name := expression` returning its value, parentheses rules, plain-name targets only, lowest precedence, avoiding repeated calls, `while` loops with `iter`/`next` and `read(n)`, comprehension filters, scope leak of walrus names, `re.search` with `:=`, `any()`/`all()` capture, and readability limits.
- **Requirements:** Write runnable examples that show the operator assigning and returning a value, test each syntax rule (bare statement, parenthesised, `if`/`while`, subscript, attribute, tuple), avoid a double call, replace a read-twice input loop, read chunks until end-of-file, filter a comprehension while keeping the computed value, match a regex then use the match, capture an item with `any()` and `all()`, show the precedence gotcha, and finish with a log scanner program that uses the operator in five places.
- **Input → Output:** Small standalone scripts with hardcoded data and printed results, ending with a program that prints six lines.
- **Acceptance criteria:** `:=` assigns a value and returns it, and the syntax rules for parentheses and plain-name targets are shown; a computed value is tested and reused without calling the function twice; `while` loops read input or chunks with `:=` and stop on an empty result; comprehension filters keep the computed value and the assigned name leaks into the enclosing scope; `if m := re.search(...)` and `any()`/`all()` capture the matching item; the precedence gotcha and the readability limits are demonstrated; the log scanner prints the expected lines using the walrus five ways
- **Tests:** Run every script and compare its output with the lesson, including the `compile()` verdict table, the `True` versus `2` precedence case, and the final six-line log scanner output.

### PY-21 Loops in Python: Complete Reference
- [ ] **Objective:** Choose and write the right Python loop for each job: repeat over collections and ranges, repeat until a condition changes, control loop flow, and build new collections with comprehensions while avoiding the common loop bugs.
- **Key concepts:** `for` and `while`, loop `else`, `range()` with one, two, and three arguments, `enumerate`, `zip`, `reversed`, `dict.items()`, `while True` with `break`, `break`, `continue`, `pass`, accumulate, transform, filter, and count patterns, looping over dictionaries, strings, and files, list, dictionary, set, and generator comprehensions, nested loops, `itertools.product` and `islice`, the pitfalls checklist, and the `:=` walrus operator.
- **Requirements:** Write runnable examples for `for` and `while` with the loop `else`; the `range()` forms; the "pick the right tool" table; the four loop-control keywords; the four common patterns; loops over dictionaries, strings, and files; the comprehension family; nested loops with `product` and `islice`; each pitfall with its fix; and a walrus chunk-reading loop. Finish with the cheat sheet's common-patterns program.
- **Input → Output:** Small standalone scripts with hardcoded data and printed values, ending with a program that prints two lines: `27 [0, 1, 4, 9] [8, 15]` and `{'b': 1, 'a': 3, 'n': 2}`.
- **Acceptance criteria:** `for` and `while` loops, including the loop `else` clause, repeat the right number of times and stop correctly; `range()` works with one, two, and three arguments, excludes the stop value, counts down with a negative step, and can be empty; `enumerate()`, `zip()`, `reversed()`, and `.items()` are matched to the job they do; `break`, `continue`, loop `else`, and `pass` control the flow of a loop; the accumulate, transform, filter, and count patterns work, and loops run over dictionaries, strings, and files; the list, dictionary, set, and generator comprehensions are shown with nested loops and `itertools`; the pitfalls checklist and the walrus loop test are demonstrated with their fixes; the combined loop programs and the cheat sheet's common-patterns program print the expected output
- **Tests:** Run every script and compare its output with the lesson, including the `ValueError` for a zero step, the skipped item when removing from a list in a loop, the empty second pass over an iterator, and the final two-line common-patterns output.

*End of document.*
