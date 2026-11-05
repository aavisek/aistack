# AI Mastery Learning Platform — Project Plan

> **Audience:** GitHub Copilot (Chat / Agent mode / Coding Agent) and the developer.
> **How to use this file:** Put it at the repo root as `PLAN.md`. Work **one phase at a time**. For each phase, open a GitHub issue from the task list, let Copilot implement it, then check the acceptance criteria before moving on. The companion file `copilot-instructions.md` goes to `.github/copilot-instructions.md`.

---

## 1. Vision

A personal, mobile-first web app where I **read and understand** a curated roadmap of backend programs every day by scrolling swipeable study cards, **without re-writing code each time**. The app is the home of my learning path to becoming a backend developer and, later, an AI engineer.

- **Today (v1):** Learn from a fixed catalogue of 172 programs (Foundations, Python, TypeScript, NestJS/Redis/BullMQ, PostgreSQL) shown as study cards, with progress tracking, spaced-repetition review, notes, bookmarks and a daily feed.
- **Later (v2+):** Add the AI stack on top of the same platform: embeddings and semantic search (pgvector), an AI tutor with permission-aware RAG, an MCP server exposing my study data, an LLM gateway with fallback, tracing and PII redaction.

**Guiding idea — dogfooding:** the platform's own features are the programs I am learning (auth = NS-14, queues = NS-17, caching = NS-19, RLS = PG-13, FTS = PG-11, tracing = NS-30, …). Building each feature **is** practising that program, and the app then teaches the program. Section 11 maps features to programs.

## 2. Goals and Non-Goals

**Goals**
1. Understand one program in 3–7 minutes of mobile scrolling (no coding required).
2. Solid, long-term retention via spaced-repetition quizzes.
3. Clean, production-style backend that doubles as a reference implementation.
4. Easy to extend with AI features later without rewrites.

**Non-goals for v1**
- No in-browser code editor or code execution sandbox.
- No multi-user sign-up, teams, payments, or social features (single user; auth exists to protect my data).
- No native mobile app (a PWA is enough).
- No AI features yet (only extension points).

**Approved scope addition (2026-10-29):** JD Intelligence is a local-first
extension to the current plain-Node vertical slice, independent of the later
full-stack migration. It adds PostgreSQL-backed job/screenshot/technology
records, local Tesseract OCR, human-reviewed grouping and extraction, distinct-job
demand counts and a provisional quarterly learning sequence. No external model
calls, tutor, embeddings or market forecasting are introduced. The implementation
uses `pg` directly until the planned NestJS/Prisma migration. See the README for
setup, review workflow and limitations.

## 3. Tech Stack (decisions are final unless stated)

| Layer | Choice | Notes |
|---|---|---|
| Monorepo | **pnpm workspaces** + Turborepo (optional) | One repo, shared types |
| Frontend | **Next.js 15** (App Router), React 19, TypeScript strict | Mobile-first PWA, Tailwind CSS, shadcn/ui, Framer Motion for swipe |
| Data fetching (web) | TanStack Query + generated typed client from OpenAPI | |
| Backend API | **NestJS 10+**, TypeScript strict, Express adapter | REST + Swagger at `/api/docs` |
| Workers | **NestJS standalone app** (`apps/worker`) | BullMQ processors, cron |
| Database | **PostgreSQL 16** with `pgvector` image (`pgvector/pgvector:pg16`) | pgvector enabled now, used later |
| ORM / migrations | **Prisma** for schema + migrations; raw SQL (`$queryRaw`) for FTS, window functions, RLS | Keep SQL visible: it's a learning goal |
| Queue | **BullMQ** on Redis | |
| Cache / state | **Redis 7** | Cache-aside, rate limiting, refresh-token store |
| Validation | Zod in `packages/shared`; `class-validator` DTOs in API | Keep them in sync via shared schemas where practical |
| Auth | JWT access (15 min) + rotating refresh (7 days) in HttpOnly cookie, bcrypt | Single user seeded from env |
| Tests | Jest (API), Vitest + Testing Library (web), Playwright (e2e), Supertest | |
| Local infra | **Docker Compose** (postgres, redis, api, worker, web) | |
| CI | GitHub Actions: lint, typecheck, test, build | |
| Observability (later phase) | OpenTelemetry + `@nestjs/terminus` | |

## 4. Repository Layout

```
ai-mastery/
├─ apps/
│  ├─ web/                 # Next.js PWA
│  ├─ api/                 # NestJS REST API
│  └─ worker/              # NestJS standalone: BullMQ processors + cron
├─ packages/
│  ├─ shared/              # Zod schemas, DTO types, enums, constants
│  ├─ eslint-config/
│  └─ tsconfig/
├─ content/
│  ├─ source/
│  │  └─ Backend_Course_Program_Requirements.md   # source of truth (172 programs)
│  └─ lessons/             # authored Markdown lessons, one per program: FD-01.md ...
├─ docs/
│  └─ lesson-format.md     # lesson metadata, section, and code-fence conventions
├─ infra/
│  ├─ docker-compose.yml
│  └─ postgres/init.sql    # CREATE EXTENSION vector, pg_trgm, citext, btree_gist
├─ docs/                   # ADRs, API notes, runbooks
├─ .github/
│  ├─ copilot-instructions.md
│  ├─ workflows/ci.yml
│  └─ ISSUE_TEMPLATE/phase-task.md
├─ PLAN.md
└─ README.md
```

## 5. Content Model (the heart of the app)

### 5.1 Source content
`content/source/Backend_Course_Program_Requirements.md` already contains, for each program: **ID, title, objective, key concepts, requirements, input→output, acceptance criteria, tests**, grouped by Part and Level. IDs: `FD-01…12`, `TS-01…100`, `NS-01…42`, `PG-01…16`.

### 5.2 Lesson cards
Each program's authored lesson is shown as an ordered, vertically swipeable
stack:

| Order | Card kind | Source | Purpose |
|---|---|---|---|
| 1 | `intro` | `Why this matters` + `What you will build` | Why it matters and the finished result |
| 2 | `setup` | `Before you start` | Tools and prerequisites |
| 3+ | `step` | One card per `Step N: ...` section | A guided walkthrough, one idea at a time |
| next | `concept` | `How it works` | Plain-language summary and analogy |
| next | `verify` | `Verify against the requirements` | Acceptance criteria mapped to evidence |
| next | `errors` | `Common errors` | Searchable error accordion |
| next | `practice` | `Try it yourself (optional)` | Small independent variations |
| next | `quiz` | One card per question in `Quiz` | Immediate feedback and explanation |
| final | `recap` | `Recap` | Three bullets and a **Mark understood** action |

The source-derived objective, requirements, input/output, acceptance criteria,
and tests remain available in an optional **Spec** tab. Render that Markdown
normally and remove source progress checkboxes such as `- [ ]`; progress
belongs to the learner rather than the specification.

### 5.3 Authored lesson file format (`content/lessons/FD-01.md`)

Full metadata, section order, quiz shape, and code-fence attributes are
documented in [`docs/lesson-format.md`](./docs/lesson-format.md). The required
sections are `Why this matters`, `What you will build`, `Before you start`,
numbered steps, `How it works`, `Verify against the requirements`, `Common
errors`, `Try it yourself (optional)`, `Quiz`, and `Recap`.

Fence attributes identify copyable terminal commands, OS variants, complete
files with paths and line numbers, expected output, and manually verified
commands. The importer splits these sections into the card types above. Longer
files remain complete and can collapse in the viewer; they are not replaced by
code fragments.

### 5.4 Import pipeline rules
- Parser reads the source Markdown with a deterministic regex/AST approach: `^### (FD|TS|NS|PG)-(\d+) (.+)$` starts a program; `- **Objective:**`, `- **Requirements:**` (with nested bullets), `- **Key concepts:**`, `- **Input → Output:**`, `- **Acceptance criteria:**`, `- **Tests:**` fill fields. Headings `## Level …`, `# PART …` give track and level.
- The checkbox `- [ ]` is ignored when displaying the source spec (progress lives in user state).
- Authored Markdown lessons in `content/lessons/*.md` are validated separately from source requirements.
- Import is **idempotent**: upsert by `code`; store a `content_hash`; only update when the hash changes; bump `version`.
- A validation report lists programs missing any required field. **Import must fail the CI check if a program has no objective or acceptance criteria.**
- Parse result must equal **172 programs** (12 FD, 100 TS, 42 NS, 16 PG, 2 PY). Add this as a test.
- The "Duplicate Mapping" tables and the "Recommended Learning Order" table are parsed too (Section 5.5), not shown as programs.

### 5.5 Learning order
Parse the "Recommended Learning Order" table into `path_stages` (stage number, name, program codes). The **Today feed** follows this order.

## 6. Database Schema (PostgreSQL)

Prisma models (names are final; add indexes as noted).

```
Track            id, slug (fd|ts|ns|pg), name, position
Level            id, trackId, name, position
Program          id, code UNIQUE (e.g. "TS-01"), slug UNIQUE, trackId, levelId, title,
                 summary, difficulty (1-5), estMinutes, stageNo, orderInPath, contentHash,
                 version, tsv (tsvector, generated; GIN index), createdAt, updatedAt
ProgramPrereq    programId, prereqProgramId  (composite PK)
Card             id, programId, kind (enum), position, bodyMd, code, language, meta JSONB,
                 UNIQUE(programId, kind, position)
Quiz             id, cardId, type (mcq|tf|predict), question, options JSONB, answerIndex,
                 explanation
User             id, email CITEXT UNIQUE, passwordHash, displayName, timezone, createdAt
RefreshToken     id, userId, tokenHash, expiresAt, revokedAt, userAgent
Progress         userId, programId, status (not_started|learning|understood|mastered),
                 lastCardPosition, startedAt, understoodAt, PRIMARY KEY (userId, programId)
Bookmark         userId, programId, cardId NULL, createdAt
Note             id, userId, programId, cardId NULL, bodyMd, createdAt, updatedAt
ReviewItem       id, userId, quizId, easeFactor (default 2.5), intervalDays, repetitions,
                 dueAt (indexed), lastGrade, lastReviewedAt   -- SM-2 spaced repetition
StudySession     id, userId, programId, startedAt, endedAt, cardsViewed
DailyStat        userId, day DATE, minutes, cardsViewed, programsUnderstood, reviewsDone
                 PRIMARY KEY (userId, day)
Streak           userId PK, current, longest, lastActiveDay
ContentImport    id, startedAt, finishedAt, status, programsCount, errors JSONB
```

Rules:
- Foreign keys everywhere; `ON DELETE CASCADE` from Program → Card/Quiz/Progress; user data cascades from User.
- Full-text search: generated `tsv` on `Program(title, summary)` plus a join to card text via a materialised view `program_search` (title weight A, concept/objective weight B), GIN index, `pg_trgm` index on title for typo tolerance.
- **Prepare for AI later (create now, leave unused):** table `CardEmbedding(cardId PK, model, embedding vector(1536), createdAt)` with an HNSW index created in a later migration.
- **Prepare for RLS later:** every user-owned table has `userId`; keep queries user-scoped through a single data-access helper so RLS (PG-13) can be switched on in Phase 9 without rewriting code.

## 7. API Design (NestJS)

Base path `/api/v1`. All responses use `{ data, meta? }`; errors use `{ error: { statusCode, code, message, path, timestamp, requestId } }`. Swagger at `/api/docs`.

| Area | Endpoint | Notes |
|---|---|---|
| Health | `GET /health/live`, `GET /health/ready` | DB + Redis checks (terminus) |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | Single seeded user; no public register in v1 |
| Catalogue | `GET /tracks` | Tracks with levels and counts |
| | `GET /programs?track=&level=&q=&status=&page=&limit=` | Search + filters, cached |
| | `GET /programs/:code` | Program + progress |
| | `GET /programs/:code/cards` | Ordered cards (+ quizzes) |
| | `GET /path` | Learning-order stages with progress |
| Feed | `GET /feed/today` | Today's queue: continue-where-I-left + next N new programs + due reviews |
| Progress | `PUT /progress/:code` | `{status, lastCardPosition}` |
| | `POST /sessions` / `PATCH /sessions/:id` | Study time tracking |
| Bookmarks | `GET/POST/DELETE /bookmarks` | |
| Notes | `GET/POST/PATCH/DELETE /notes` | Markdown notes per program/card |
| Review | `GET /reviews/due?limit=` , `POST /reviews/:id/grade` | grade 0–5 (SM-2); enqueues scheduler job |
| Search | `GET /search?q=` | FTS ranked, snippets via `ts_headline` |
| Stats | `GET /stats/overview`, `GET /stats/heatmap` | Streak, minutes, programs per track, 90-day heatmap |
| Admin | `POST /admin/content/import` | Enqueues import job; protected by `@Roles('admin')` |

Cross-cutting (each is a learning program): global `ValidationPipe`, exception filter, response `TransformInterceptor`, request-id middleware, throttler (Redis), Swagger, config validation (Zod), structured logging (pino).

## 8. Background Jobs (BullMQ, `apps/worker`)

| Queue | Job | Trigger | Behaviour |
|---|---|---|---|
| `content` | `import-content` | Admin endpoint / on deploy | Parse source + card files, upsert, write `ContentImport`, invalidate caches |
| `reviews` | `schedule-review` | After a grade | Apply SM-2, update `ReviewItem.dueAt` (idempotent by `jobId = itemId:gradeTimestamp`) |
| `reviews` | `seed-review-items` | Program marked understood | Create `ReviewItem` rows for the program's quizzes |
| `stats` | `rollup-daily` | Cron 00:05 user timezone | Aggregate sessions into `DailyStat`, update `Streak` |
| `feed` | `build-daily-feed` | Cron 04:00 | Pre-compute and cache tomorrow's feed in Redis |
| `notify` | `daily-reminder` | Cron (configurable) | Web Push / email reminder with today's count (stub in v1) |
| `search` | `refresh-search-view` | After import | `REFRESH MATERIALIZED VIEW CONCURRENTLY program_search` |
| `ai` *(later)* | `embed-cards`, `ai-enrich-card` | Phase 10 | Generate embeddings; draft cards via LLM gateway |

Job rules: retries with exponential backoff (max 5), dead-letter handling, `removeOnComplete` limits, unique `jobId`s for idempotency, graceful shutdown, Bull Board UI at `/admin/queues` (admin only), metrics log of queue depth.

## 9. Redis Usage

- **Cache-aside** for `GET /programs`, `GET /programs/:code/cards`, `GET /path` (TTL 1 h); invalidated by content import.
- **Feed cache** per user per day (`feed:{userId}:{yyyy-mm-dd}`).
- **Rate limiting** via `@nestjs/throttler` Redis storage (login: 5/min; others: 120/min).
- **Refresh-token denylist / rotation state.**
- **BullMQ** connection (separate Redis DB index from cache; `maxRetriesPerRequest: null` for workers).
- Keys are namespaced `app:{env}:...`; every key has a TTL except BullMQ keys.

## 10. Frontend (Next.js PWA) — UX Specification

**Design principles:** one thumb, one hand, 3–7 minutes. Zero typing needed to learn. Fast (< 2 s first load on 4G, cards swipe at 60 fps). Works offline after first sync.

### 10.1 Navigation (bottom tab bar, 5 tabs)
1. **Today** — the daily feed.
2. **Path** — roadmap map (stages → tracks → levels → programs) with progress rings.
3. **Review** — spaced-repetition quiz session.
4. **Saved** — bookmarks and notes.
5. **Me** — stats, streak, heatmap, settings.

### 10.2 Study card experience
- A program opens as a **full-screen card stack**. **Swipe up** = next card, **swipe down** = previous card; progress dots along the side; tap the top bar to open the program menu (jump to any card, bookmark, add note).
- **Swipe left/right** on the last card (or use the bottom buttons) → next/previous program in the path.
- Card renderers: Markdown with syntax-highlighted code (Shiki), copy-code button, line-number callouts for annotated samples, collapsible long blocks, quiz card with instant feedback and explanation.
- Persistent footer: **"Got it"** (advance), **"Save"**, **"Note"**. After the recap card: **"Mark understood"** → seeds review items and updates progress.
- Resume exactly where I left off (`lastCardPosition`).
- Font size (S/M/L/XL), dark/light/auto theme, reduced-motion support, haptic feedback where available, keyboard shortcuts on desktop (↑/↓, `b`, `n`).

### 10.3 Today feed rules
`due reviews (max 10)` → `continue current program` → `next N new programs in path order` (N = daily goal, default 2). Show an estimated time and a progress ring for the daily goal.

### 10.4 Offline / PWA
- Web app manifest, icons, standalone display, install prompt.
- Service worker (Workbox): precache shell; runtime-cache `/programs/*/cards` (stale-while-revalidate); queue progress/grade writes while offline and flush on reconnect (Background Sync with a fallback).
- Show an "Offline" chip when disconnected.

### 10.5 Non-functional UI requirements
- Lighthouse (mobile) ≥ 90 for Performance, Accessibility, Best Practices, PWA.
- Tap targets ≥ 44 px; contrast WCAG AA; all interactive elements keyboard- and screen-reader accessible.
- No layout shift on card transitions; images lazy-loaded.

## 11. Features ↔ Learning Programs (build it, learn it)

| Platform feature | Learning program(s) practised |
|---|---|
| Monorepo, Git workflow, CI | FD-01 |
| REST conventions, Postman collection | FD-02 |
| Content parser CLI | FD-03, FD-04 |
| Controllers, DTOs, pipes, filters, interceptors, guards | NS-01 … NS-09 |
| Typed config | NS-11, TS-79 |
| Prisma + migrations + transactions | NS-12, PG-01 |
| FTS search | PG-11 |
| SM-2 review scheduling (window-function stats) | PG-05 |
| Auth (JWT + refresh rotation) | NS-14 |
| Role guard (`admin`) | NS-07, NS-15 |
| Redis cache for catalogue and feed | NS-19, FD-12 |
| Rate limiting | NS-20 |
| BullMQ imports, retries, cron | NS-17, NS-18, NS-35 |
| Import flow (parent/child) | NS-36 |
| Live import progress in admin UI | NS-37, NS-16 |
| Swagger | NS-22 |
| Unit + e2e tests | NS-23, NS-24 |
| Docker + Compose | FD-11, NS-32 |
| Health checks + tracing | NS-30 |
| Audit trigger on notes | PG-07 |
| RLS for user data | PG-13, NS-27 |
| Embeddings + semantic search | PG-12, NS-29 |
| MCP server for my study data | NS-28 |
| LLM gateway with fallback | NS-31 |
| PII redaction before LLM calls | NS-41 |

## 12. Delivery Plan (phases, tasks, acceptance criteria)

> Each phase is a milestone. Each bullet is a Copilot-sized task (one issue/PR). Do not start a phase until the previous phase's acceptance criteria pass.

### Phase 0 — Repository, Tooling & Infra
- [ ] Initialise pnpm workspace with `apps/web`, `apps/api`, `apps/worker`, `packages/shared`.
- [ ] Strict TypeScript base config; ESLint + Prettier; Husky + lint-staged; Conventional Commits.
- [ ] `infra/docker-compose.yml`: Postgres (pgvector image) + Redis with volumes and healthchecks; `infra/postgres/init.sql` enabling `vector`, `pg_trgm`, `citext`, `btree_gist`.
- [ ] `.env.example` for each app; Zod-validated config in API and worker.
- [ ] GitHub Actions: install, lint, typecheck, test, build with pnpm cache.
- [ ] README with a 5-command setup.

**Acceptance:** `pnpm i && docker compose up -d && pnpm dev` starts web (3000), api (3001), worker; CI green on an empty test suite.

### Phase 1 — Content Pipeline (no UI yet)
- [ ] Prisma schema for Track, Level, Program, ProgramPrereq, Card, Quiz, ContentImport; first migration.
- [ ] `packages/content-parser` (or `apps/worker/src/content`): parse the source Markdown into typed objects (Section 5.4).
- [ ] Unit tests with fixtures: one per program type, plus a **full-file test asserting 172 programs** with exact counts per track (12/100/42/16/2) and no missing required fields.
- [ ] Lesson importer: validate front matter and required lesson sections in `content/lessons/*.md` (Section 5.3), then map sections to `intro`, `setup`, `step`, `concept`, `verify`, `errors`, `practice`, `quiz`, and `recap` cards.
- [ ] Keep parsed source requirements available in the separate **Spec** view; remove source progress checkboxes when rendering.
- [ ] Idempotent importer (upsert, hash, version bump) as a CLI: `pnpm content:import`.
- [ ] Parse "Recommended Learning Order" into `stageNo` / `orderInPath`.

**Acceptance:** Running the import twice yields the same DB state; all 172 source programs exist; lesson cards are generated for authored lessons and the Spec view is available for every program.

### Phase 2 — API Read Side
- [ ] NestJS app skeleton: config, Prisma module, global pipes/filters/interceptors, request-id middleware, pino logging, Swagger, health endpoints.
- [ ] Catalogue endpoints (`/tracks`, `/programs`, `/programs/:code`, `/programs/:code/cards`, `/path`) with pagination and filters.
- [ ] Search endpoint using Postgres FTS (`websearch_to_tsquery`, `ts_rank_cd`, `ts_headline`) + trigram fallback.
- [ ] Redis cache-aside with invalidation hook.
- [ ] Generate OpenAPI JSON and a typed client for the web app.
- [ ] Unit tests (services) and e2e tests (Supertest) for all endpoints.

**Acceptance:** Swagger documents every endpoint; p95 `GET /programs/:code/cards` < 50 ms (cached); search for "transaction isolation" returns PG-08 in the top 3.

### Phase 3 — Web MVP (read-only, no login)
- [ ] Next.js app with Tailwind, theme tokens, layout with bottom tab bar, loading and error states.
- [ ] **Path** page: stages/tracks/levels list with search and filters.
- [ ] **Program view**: swipeable vertical card stack with progress dots, keyboard support, Markdown + Shiki rendering, copy-code.
- [ ] Local-only progress (localStorage, wrapped behind an interface so Phase 4 can swap in the API).
- [ ] Mobile QA on a real phone or device emulator; fix 60 fps issues.

**Acceptance:** I can open any program on my phone and swipe through its cards; Lighthouse mobile Performance ≥ 85.

### Phase 4 — Auth & Server-Side Progress
- [ ] User table, bcrypt, seed single user from env.
- [ ] `/auth/login`, `/auth/refresh` (rotating refresh in HttpOnly cookie, hashed in DB), `/auth/logout`, `/auth/me`.
- [ ] `AuthGuard` global with `@Public()`; `@CurrentUser()` decorator; `@Roles('admin')`.
- [ ] Login throttling (5/min).
- [ ] Progress, sessions, bookmarks, notes endpoints; web switched from localStorage to the API (with migration of local progress on first login).
- [ ] Web: login page, protected routes, silent refresh, bookmark and note UI.

**Acceptance:** Progress, bookmarks and notes persist across devices; refresh-token reuse is detected and revokes the chain; e2e auth tests pass.

### Phase 5 — Daily Feed, Quizzes & Spaced Repetition
- [ ] Quiz card renderer (MCQ, true/false, predict-output) with feedback.
- [ ] `ReviewItem` creation on "Mark understood"; SM-2 implementation as a pure, unit-tested function.
- [ ] `/reviews/due`, `/reviews/:id/grade`; **Review** tab UI with grade buttons (Again / Hard / Good / Easy).
- [ ] `/feed/today` algorithm (Section 10.3) with daily goal setting.
- [ ] Stats: streak, minutes, heatmap; **Me** tab.

**Acceptance:** SM-2 unit tests match the reference algorithm for ≥ 10 sequences; a quiz answered "Good" reappears after 1 day, then 6, then ~15; the feed is stable within a day.

### Phase 6 — BullMQ Workers & Scheduling
- [ ] `apps/worker` standalone Nest app with BullMQ module and shared Prisma.
- [ ] Move import, `schedule-review`, `seed-review-items`, `rollup-daily`, `build-daily-feed`, `refresh-search-view` into queues (Section 8).
- [ ] Retry/backoff, DLQ, idempotent job IDs, graceful shutdown.
- [ ] Bull Board at `/admin/queues` (admin only).
- [ ] Admin screen in the web app: trigger import, show live progress via WebSocket (job events).
- [ ] Metrics logs: queue depth, processing time, failure rate.

**Acceptance:** Killing the worker mid-import and restarting finishes the import without duplicates; failed jobs retry then land in the DLQ; admin sees progress live.

### Phase 7 — PWA, Offline & Mobile Polish
- [ ] Manifest, icons, install prompt; service worker with caching strategies (Section 10.4).
- [ ] Offline write queue for progress and review grades with reconciliation.
- [ ] Font size, theme, haptics, reduced motion; empty/error states; skeletons.
- [ ] Accessibility audit (axe) and fixes.
- [ ] Playwright e2e on mobile viewport: login → open program → swipe → mark understood → review.

**Acceptance:** After one online visit, today's feed and its programs are readable in airplane mode; Lighthouse mobile ≥ 90 in all four categories.

### Phase 8 — Hardening & Operations
- [ ] Security: Helmet, strict CORS, CSP for the web app, cookie flags, input size limits, dependency audit in CI.
- [ ] Observability: terminus readiness (DB, Redis), OpenTelemetry traces (HTTP, Prisma, Redis, BullMQ), trace IDs in logs.
- [ ] Production Dockerfiles (multi-stage, non-root) for web, api, worker; Compose prod profile.
- [ ] Backups: `pg_dump` cron + restore test documented in `docs/runbook.md`.
- [ ] Seed data/migration strategy with the expand-and-contract rule for schema changes.
- [ ] Choose a host (single VPS with Docker Compose, Fly.io, or Railway) and write `docs/deploy.md`.

**Acceptance:** One-command deploy; readiness fails when DB or Redis is down; restore from backup verified.

### Phase 9 — Learning-Driven Upgrades (optional, in any order)
Each item is itself a program: implement it and mark the program understood.
- [ ] Row-Level Security on user-owned tables (PG-13).
- [ ] Partition `StudySession` by month (PG-14).
- [ ] Audit trigger on notes (PG-07).
- [ ] PgBouncer + read replica routing (PG-16).
- [ ] CQRS split for the review module (NS-25).
- [ ] GraphQL read API (NS-21).

### Phase 10 — AI Stack (planned extension points, not built in v1)
Design hooks now so these drop in later:
- [ ] Embeddings job (`ai/embed-cards`) → `CardEmbedding` + HNSW index → semantic search endpoint.
- [ ] **Ask the tutor:** permission-aware RAG over my notes and cards (NS-29) with citations.
- [ ] LLM gateway module with provider fallback, circuit breaker, SSE streaming (NS-31).
- [ ] PII redaction interceptor before any external model call (NS-41).
- [ ] MCP server exposing "today's feed", "search programs", "log progress" to Claude Desktop (NS-28).
- [ ] AI card enrichment pipeline: generate `concept/sample/pitfalls/quiz` drafts → human review queue → publish.
- [ ] Tracing spans around LLM calls (NS-30).
- [ ] AI learning-path tracks (LLMs, embeddings, RAG, agents, evals, MLOps) added as new Tracks via the same content format.

**Extension rules:** new tracks are added by dropping new source Markdown + card files; no code change should be needed to add a track.

## 13. Engineering Standards

- **TypeScript:** `strict`, no `any` (use `unknown` + narrowing), no non-null `!` without a comment.
- **API:** controller → service → repository layering; controllers contain no business logic; DTOs validated; entities never leaked directly (map to response DTOs).
- **SQL:** parameterised only (`$queryRaw` with tagged templates); every new query on a table > 1k rows must have its `EXPLAIN` checked in the PR description when it is non-trivial.
- **Migrations:** forward-only; backward-compatible (expand-and-contract); no destructive change in the same release that stops using the column.
- **Config:** never read `process.env` outside the config module.
- **Errors:** custom error classes mapped by the global filter; no stack traces in production responses.
- **Logging:** structured JSON, never log tokens, passwords, or full note bodies.
- **Tests:** every service has unit tests; every endpoint has an e2e test; new bug → regression test first; coverage target ≥ 80 % for `apps/api` services and the parser.
- **Commits/PRs:** Conventional Commits; PR = one task; PR template includes "acceptance criteria checked".
- **Dependencies:** pin major versions; Renovate/Dependabot weekly.

## 14. Definition of Done (per task)

1. Code compiles with zero TypeScript errors and zero ESLint warnings.
2. Unit/e2e tests added and passing locally and in CI.
3. Acceptance criteria of the task demonstrated (screenshot, curl output or test name in the PR).
4. Swagger/README/docs updated if behaviour changed.
5. No secrets committed; `.env.example` updated if config changed.
6. Mobile check done for any UI change (viewport 390×844).

## 15. Environment Variables

```
# shared
NODE_ENV=development
# api
API_PORT=3001
DATABASE_URL=postgresql://app:app@localhost:5432/aimastery
REDIS_URL=redis://localhost:6379/0
JWT_ACCESS_SECRET=change-me-32-chars-minimum......
JWT_REFRESH_SECRET=change-me-too-32-chars-minimum.
COOKIE_DOMAIN=localhost
CORS_ORIGIN=http://localhost:3000
SEED_USER_EMAIL=me@example.com
SEED_USER_PASSWORD=change-me
CONTENT_SOURCE_PATH=./content/source/Backend_Course_Program_Requirements.md
CONTENT_LESSONS_PATH=./content/lessons
# worker
BULLMQ_REDIS_URL=redis://localhost:6379/1
# web
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
# later (AI)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
EMBEDDING_MODEL=
```

## 16. Risks and Decisions Log

| Risk / question | Decision |
|---|---|
| Cards 6–9 (concept, sample, pitfalls, quiz) don't exist yet | App works without them; author in batches per track; review before importing |
| Swipe gestures vs. scroll conflicts on mobile | Use a vertical snap-scroll container (CSS scroll-snap) first; add gesture library only if needed |
| Over-engineering for a single user | Keep phases 0–7 minimal; Phase 8–10 only after daily use proves the app |
| Content drift between source Markdown and DB | Source file is the single source of truth; import is idempotent and hash-based |
| Redis eviction affecting BullMQ | Separate Redis DB index and `maxmemory-policy noeviction` for the queue instance in production |

## 17. First Prompts to Give Copilot

Use these in Copilot Chat / Agent mode with this file open (`#file:PLAN.md`).

**Kick-off**
> Read `PLAN.md` and `.github/copilot-instructions.md`. Implement **Phase 0** only. Create the pnpm monorepo, Docker Compose infra, strict TS configs, lint/format tooling and CI exactly as specified. Do not start Phase 1. When done, list what you created and how I verify the acceptance criteria.

**Phase 1**
> Implement **Phase 1 — Content Pipeline**. Write the Prisma schema from section 6 for the listed models, then build the Markdown parser described in section 5.4 using `content/source/Backend_Course_Program_Requirements.md`. Write tests first: a test that asserts exactly 172 programs (FD 12, TS 100, NS 42, PG 16, PY 2) and that every program has objective, requirements, acceptance criteria and tests. Then build the idempotent importer CLI.

**Any later phase**
> Implement **Phase N** from `PLAN.md`, one task at a time. For each task: state the plan in 3–5 bullets, make the change, add tests, and show how to check the acceptance criteria. Follow section 13 standards. Ask me before adding any dependency not listed in section 3.

---
*End of plan.*
