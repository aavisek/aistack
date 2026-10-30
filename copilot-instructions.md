# Copilot Instructions — AI Mastery Learning Platform

Place this file at `.github/copilot-instructions.md`. The full project plan is in `PLAN.md` at the repo root — read it before making changes.

## Project in one paragraph
A mobile-first learning web app (PWA). Next.js frontend, NestJS REST API, a separate NestJS worker for BullMQ jobs, PostgreSQL 16 (with pgvector installed but unused until the AI phase), Redis 7. Content (170 programs, shown as swipeable study cards) is imported from `content/source/Backend_Course_Program_Requirements.md` and `content/cards/*.md`. Single user in v1. AI features come later; leave extension points, do not build them yet.

## Monorepo map
- `apps/web` Next.js 15 (App Router), Tailwind, shadcn/ui, TanStack Query
- `apps/api` NestJS (REST, Swagger at `/api/docs`)
- `apps/worker` NestJS standalone app with BullMQ processors and cron
- `packages/shared` Zod schemas and shared types
- `content/` source Markdown and authored card files
- `infra/` Docker Compose and Postgres init SQL

## How to work
1. Work on **one phase and one task at a time** from `PLAN.md` section 12. Do not start later phases.
2. Before coding, state a short plan (3–5 bullets). After coding, say how to verify the task's acceptance criteria.
3. Write or update tests with every change. Prefer writing the test first for parsers, algorithms (SM-2) and bug fixes.
4. Ask before adding a dependency that is not listed in `PLAN.md` section 3.
5. Keep changes small and focused: one task per pull request.

## Code standards
- TypeScript `strict` everywhere. No `any`; use `unknown` and narrow. No unexplained `!` non-null assertions.
- API layering: controller → service → repository. Controllers hold no business logic. Validate all input with DTOs (`class-validator`) or Zod. Never return ORM entities directly; map to response DTOs.
- SQL: parameterised queries only (Prisma or `$queryRaw` tagged templates). Never build SQL with string concatenation.
- Never read `process.env` outside the config module. Config is validated at startup.
- Errors: use custom error classes; the global exception filter produces `{ error: { statusCode, code, message, path, timestamp, requestId } }`. No stack traces in production responses.
- Success responses are `{ data, meta? }`.
- Logging: structured (pino). Never log passwords, tokens or full note bodies.
- Redis keys are namespaced `app:{env}:…` and always have a TTL (except BullMQ keys).
- BullMQ jobs must be idempotent (stable `jobId`), have retries with exponential backoff, and handle graceful shutdown.
- Database migrations are forward-only and backward-compatible (expand-and-contract).
- Frontend: mobile-first (design at 390×844), accessible (WCAG AA, 44 px tap targets, keyboard support), no layout shift, respect `prefers-reduced-motion`.

## Testing
- API: Jest unit tests for services; Supertest e2e tests for every endpoint against a test database.
- Web: Vitest + Testing Library for components; Playwright for key flows on a mobile viewport.
- Parser and SM-2 logic are pure functions with exhaustive unit tests.
- A full-file test must assert the content import yields exactly 170 programs: FD 12, TS 100, NS 42, PG 16.

## Commands (keep these working)
- `pnpm i` install
- `docker compose -f infra/docker-compose.yml up -d` start Postgres and Redis
- `pnpm dev` run web, api, worker
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- `pnpm content:import` import programs and cards (idempotent)

## Do not
- Do not add in-browser code execution, multi-user sign-up, payments, or AI features in v1.
- Do not commit secrets; update `.env.example` when adding config.
- Do not change the Prisma schema without a migration.
- Do not skip tests to make a task "work".

## Commit style
Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). PR description lists: what changed, how acceptance criteria were checked, and any follow-ups.
