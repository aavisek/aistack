# Prompt for GitHub Copilot — Turn Program Requirements into Step-by-Step Beginner Lessons

> **How to use:** Open the repo in VS Code, open Copilot Chat in **Agent mode**, attach `PLAN.md`, `.github/copilot-instructions.md` and `content/source/Backend_Course_Program_Requirements.md` (use `#file:`), then paste everything below the line.

---

## ROLE

You are a senior backend engineer and technical writer building the lesson content and lesson-viewer for my mobile-first learning web app (see `PLAN.md`). The app's reader is a **complete beginner** who studies by **scrolling on a phone, without typing code every day**. They must be able to understand a program fully, and if they choose to run it, follow **exact commands** and get **exactly the output shown**.

## WHAT IS WRONG TODAY (from the current portal)

I looked at the current page for `FD-01 · Git & npm Essentials`. Problems to fix:

1. **Raw Markdown is displayed.** I see `- [ ] **Objective:**`, backticks and asterisks as plain text. Markdown is not being rendered. The `- [ ]` checkbox from the source file must be stripped.
2. **The page only shows the short requirement summary** copied from the source file. There is **no teaching content**: no explanation, no step-by-step walkthrough, no code, no commands, no expected output.
3. **Nothing is split into cards.** It is one big text box, not swipeable study cards.

The source file `Backend_Course_Program_Requirements.md` is only a **specification** ("what to build"). It is **not** the lesson. Each program needs a separate **lesson** ("how to build it, step by step, with code and commands").

## YOUR MISSION

Do these in order. **Do not skip ahead. Stop after step 4 and wait for my review.**

1. **Fix rendering** so Markdown renders correctly everywhere (see §3).
2. **Define the lesson format** (§2) and a **lesson validator** (§5) so lessons are consistent and checked automatically.
3. **Build the lesson-viewer UI** (§3): swipeable step cards, copy-able command blocks, OS tabs, file-code blocks, expected-output blocks, checkpoints, quiz.
4. **Author the pilot lessons: FD-01, FD-02, FD-03** at the quality bar of the worked example in §4. Verify every command and code block (§5). Then **STOP** and show me the result.
5. After I approve: author the remaining lessons in the batches listed in §6, one batch per PR.

## 1. NON-NEGOTIABLE CONTENT RULES

Every lesson must satisfy **all** of these:

- **R1 — Beginner-first.** Assume the reader has never used the tool. Define every new term the first time it appears, in one plain sentence. No unexplained jargon. No "simply" or "just".
- **R2 — Exact commands.** Every action is a copy-pasteable command or an explicit UI instruction ("Click **New repository** → name it `fd-01-git-npm` → leave everything else unchecked → **Create repository**"). Never write "install X" without the exact command or download link.
- **R3 — Full code, never fragments.** Show **complete files** with the **file path** as the title. If a file changes later, show the **whole updated file again** (or a clearly marked diff) — never "add this somewhere".
- **R4 — Expected output.** After every command that prints something, show the **expected output** in a separate block. Mark parts that vary (hashes, dates, paths) with a note.
- **R5 — Explain every step.** Each step has: *What we are doing* (1–2 sentences), *Command/Code*, *Expected output*, *Why it works* (plain language, line-by-line for code), *Checkpoint* (a quick way to confirm success).
- **R6 — Cross-platform.** Give **Windows (PowerShell)** and **macOS/Linux (bash/zsh)** variants wherever they differ (creating files, setting env vars, paths, open-folder commands). Use tabs (§2).
- **R7 — Real and verified.** Never invent outputs. Run the commands and code in a clean environment (or in CI) and paste the real output. Pin tool versions you tested with (e.g. Node 20 LTS, TypeScript 5.x, PostgreSQL 16) and state them in the lesson front-matter.
- **R8 — Mistakes included.** Every lesson has a **"Common errors"** section with the **actual error message** and the **exact fix** (at least 3 errors; for TypeScript lessons include the real compiler error text for the deliberate failures).
- **R9 — Small steps.** One idea per step. A step must be readable in under 60 seconds on a phone. If a code file is longer than ~25 lines, split the explanation into several steps that build the file up progressively, then show the final full file.
- **R10 — Learn by reading.** A reader who never runs anything must still understand the program: include **"What you should see"** results and a short **"How it works"** summary with a simple analogy.
- **R11 — Satisfy the spec.** The lesson must make the program's **Acceptance criteria** and **Tests** from the source file **true and demonstrated**. Include a final **"Verify against the requirements"** checklist mapping each acceptance criterion to the step that proves it.
- **R12 — Tone.** Friendly, direct, second person ("you"). Short sentences. No emojis in code blocks or commands.

## 2. LESSON FILE FORMAT (create this schema, document it in `docs/lesson-format.md`)

One file per program: `content/lessons/<ID>.md` (e.g. `content/lessons/FD-01.md`). Plain Markdown plus YAML front-matter. The importer turns it into cards.

**Front-matter (required):**

```yaml
---
id: FD-01
title: Git & npm Essentials
track: fd            # fd | ts | ns | pg
level: beginner      # beginner | intermediate | advanced
estMinutes: 25
prerequisites: []    # other program IDs
toolVersions:        # versions you actually tested
  node: "20.x"
  git: "2.4x"
  npm: "10.x"
os: [windows, macos, linux]
---
```

**Required sections, in this order** (`##` headings, exact titles):

1. `## Why this matters` — 2–4 sentences + one analogy.
2. `## What you will build` — what exists at the end; include the final folder tree in a `text` block.
3. `## Before you start` — checklist of tools with install commands/links and a verify command each.
4. `## Step 1: <title>` … `## Step N: <title>` — the walkthrough (R5). Typically 6–14 steps.
5. `## How it works` — recap in plain language, with a simple diagram in a `text` block if useful.
6. `## Verify against the requirements` — checklist mapping each acceptance criterion to evidence.
7. `## Common errors` — `### <error message>` then cause and fix.
8. `## Try it yourself (optional)` — 2–3 small variations.
9. `## Quiz` — 5 questions (see quiz format).
10. `## Recap` — exactly 3 bullet points.

**Special code-block conventions** (info string after the language):

| Purpose | Syntax | Rendered as |
|---|---|---|
| Command to run | ```` ```bash title="Terminal" ```` or ```` ```powershell ```` | Terminal block with a **Copy** button; no line numbers |
| OS variants | consecutive blocks with `tab="macOS / Linux"` and `tab="Windows PowerShell"` | One block with OS tabs; remember the user's last choice |
| File to create/edit | ```` ```ts title="src/index.ts" file ```` | File block with the path as header, line numbers, **Copy file** button |
| Changed lines | add `highlight="3,5-7"` | Highlighted lines |
| Expected output | ```` ```text title="Expected output" ```` | Output block (dark, no copy button), labeled **Expected output** |
| Folder tree | ```` ```text title="Folder structure" ```` | Tree block |
| Checkpoint | blockquote starting `> **Checkpoint:**` | Green callout |
| Warning / Tip / Note | blockquote starting `> **Warning:**`, `> **Tip:**`, `> **Note:**` | Colored callouts |
| Variation notice | blockquote starting `> **Your output will differ:**` | Gray callout |

**Quiz format** (inside `## Quiz`):

```markdown
### Q1
type: mcq            # mcq | tf | predict
question: What does `git add .` do?
options:
  - Saves changes permanently to the repository
  - Marks all changed files to be included in the next commit
  - Uploads files to GitHub
answer: 1            # zero-based index
explanation: `git add` only stages files. `git commit` saves them, `git push` uploads them.
```

**Card mapping rule (importer):**

- `Why this matters` + `What you will build` → card 1 (`intro`)
- `Before you start` → card 2 (`setup`)
- Each `## Step N` → **one card per step** (if a step exceeds ~900 characters or contains more than one code/file block of > 15 lines, split into `Step N (a)`, `Step N (b)`)
- `How it works` → `concept` card
- `Verify against the requirements` → `verify` card
- `Common errors` → `errors` card (accordion, one item per error)
- `Try it yourself` → `practice` card
- `Quiz` → one `quiz` card per question
- `Recap` → `recap` card with the **Mark understood** button

Replace the earlier, source-only card kinds from `PLAN.md` §5.2 with these. The cards derived from the source spec (`objective`, `requirements`, `acceptance`, `tests`) remain available as an optional **"Spec"** tab on each program, **rendered as proper Markdown**.

## 3. VIEWER / UI CHANGES

Implement in `apps/web`:

1. **Markdown rendering:** `react-markdown` + `remark-gfm` + `rehype-sanitize` (or MDX if you prefer) with a custom renderer for the code-block conventions in §2. Syntax highlighting with Shiki (light + dark themes). **Never display raw Markdown.** Strip `- [ ]` from the source spec when rendering.
2. **Card stack:** one card per step, vertical swipe/scroll-snap, progress dots + "Step 4 of 12" indicator, resume position. Cards scroll internally if taller than the viewport (no clipped content).
3. **Command block:** monospace, horizontal scroll (no wrapping of commands), **Copy** button with "Copied" feedback, `$` or `PS>` prompt shown but excluded from the copy.
4. **OS tabs:** Windows / macOS-Linux tabs, default from `navigator.userAgentData`/UA, remembered in `localStorage` and applied to all lessons.
5. **File block:** path header, line numbers, highlighted lines, **Copy file**; for files > 40 lines, collapsed by default with "Show full file".
6. **Expected-output block** visually distinct from commands (different background, label).
7. **Callouts** for Checkpoint / Warning / Tip / Note.
8. **Common errors** as an accordion; searchable by pasting an error message (simple substring match across the lesson).
9. **Spec tab** showing the original requirements, rendered.
10. **Mobile first** at 390×844; font-size control (S/M/L/XL); dark/light; tap targets ≥ 44 px; no horizontal page scroll (code blocks scroll inside themselves).
11. **Tests:** component tests for each block type (command, tabs, file, output, callouts, quiz) and a Playwright test that opens `FD-01`, swipes through every card, switches OS tab, taps Copy, answers a quiz.

## 4. WORKED EXAMPLE — THIS IS THE QUALITY BAR

Author every lesson to be **at least this detailed and concrete**. This is a condensed-but-real version of `content/lessons/FD-01.md`; write the final file in full (all steps, all expected outputs verified by running them).

~~~~markdown
---
id: FD-01
title: Git & npm Essentials
track: fd
level: beginner
estMinutes: 30
prerequisites: []
toolVersions:
  node: "20.x"
  git: "2.4x"
  npm: "10.x"
os: [windows, macos, linux]
---

## Why this matters
Every professional project lives in **Git** (a tool that records the history of your files) and uses **npm** (the tool that downloads and manages JavaScript libraries). Think of Git as an unlimited "undo" button with a diary, and npm as an app store for code.

## What you will build
A small Node.js project, `fd-01-git-npm`, with a clean Git history of 5+ commits, a feature branch merged back, a resolved merge conflict, safe handling of secrets in `.env`, and a copy pushed to GitHub.

```text title="Folder structure"
fd-01-git-npm/
├─ .git/              (created by Git, never edit)
├─ .env               (secret values — NOT committed)
├─ .env.example       (safe template — committed)
├─ .gitignore
├─ index.js
├─ package.json
└─ package-lock.json
```

## Before you start
You need three tools. Check each one by running the command shown.

| Tool | Install | Check |
|---|---|---|
| Git | https://git-scm.com/downloads | `git --version` |
| Node.js 20 LTS (includes npm) | https://nodejs.org | `node --version` and `npm --version` |
| A GitHub account | https://github.com/signup | — |

## Step 1: Check your tools
**What we are doing:** making sure Git, Node and npm are installed before we start.

```bash title="Terminal"
git --version
node --version
npm --version
```

```text title="Expected output"
git version 2.43.0
v20.11.1
10.2.4
```

> **Your output will differ:** version numbers may be newer. Node must be `v20` or higher.

> **Checkpoint:** all three commands print a version. If one says "command not found" (macOS/Linux) or "is not recognized" (Windows), install that tool and open a **new** terminal window.

## Step 2: Tell Git who you are
**What we are doing:** every commit records an author. Set your name and email once on this computer. Use the same email as your GitHub account.

```bash title="Terminal"
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

Check what you saved:

```bash title="Terminal"
git config --global --list
```

```text title="Expected output"
user.name=Your Name
user.email=you@example.com
init.defaultBranch=main
```

**Why it works:** `--global` stores the settings in a file in your home folder, so you do this only once. `init.defaultBranch=main` makes new repositories start on a branch called `main`.

## Step 3: Create the project folder and start Git
```bash tab="macOS / Linux"
mkdir fd-01-git-npm
cd fd-01-git-npm
git init
```

```powershell tab="Windows PowerShell"
mkdir fd-01-git-npm
cd fd-01-git-npm
git init
```

```text title="Expected output"
Initialized empty Git repository in /home/you/fd-01-git-npm/.git/
```

**Why it works:** `git init` creates a hidden `.git` folder. That folder **is** the repository: it stores the whole history. Delete it and the history is gone.

> **Checkpoint:** run `git status`. It should say `On branch main` and `No commits yet`.

## Step 4: Create the npm project
```bash title="Terminal"
npm init -y
```

```text title="Expected output"
Wrote to /home/you/fd-01-git-npm/package.json:

{
  "name": "fd-01-git-npm",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

**Why it works:** `package.json` is the project's ID card: its name, version, scripts and dependencies. `-y` accepts all default answers.

Now create the program file. Make a file named `index.js` with this content:

```js title="index.js" file
console.log("Hello from fd-01-git-npm!");
```

Add `start` to the scripts using one command (no manual editing needed):

```bash title="Terminal"
npm pkg set scripts.start="node index.js"
npm start
```

```text title="Expected output"
> fd-01-git-npm@1.0.0 start
> node index.js

Hello from fd-01-git-npm!
```

> **Checkpoint:** you see `Hello from fd-01-git-npm!`.

## Step 5: Stop Git from tracking things it should not
Create `.gitignore` so secrets and downloaded libraries never enter the history.

```text title=".gitignore" file
node_modules/
.env
dist/
```

**Why it works:** each line is a pattern Git will ignore. `node_modules/` is huge and can be recreated with `npm install`. `.env` holds secrets and must never be public.

## Step 6: Your first commit
```bash title="Terminal"
git status
git add .
git commit -m "chore: initial project setup"
git log --oneline
```

```text title="Expected output"
[main (root-commit) a1b2c3d] chore: initial project setup
 3 files changed, 17 insertions(+)
a1b2c3d chore: initial project setup
```

> **Your output will differ:** the commit id (`a1b2c3d`) is unique to you.

**Why it works:** Git saves in two stages. `git add .` puts files in a "waiting room" (the staging area). `git commit` takes a snapshot of everything in the waiting room and gives it a message.

(…Steps 7–12 in the real file: install a dependency and a dev dependency with `npm install dayjs` and `npm install -D nodemon`, explaining `package-lock.json`; make commits 2–5 with Conventional Commit messages; create and merge `feature/greeting` with `git switch -c`, `git switch main`, `git merge`; create a **deliberate merge conflict** with two branches editing the same line, show the `<<<<<<<` markers, resolve and commit; create `.env` and `.env.example`, read `process.env` with `node --env-file=.env index.js`, and prove `.env` is ignored with `git check-ignore -v .env`; create an empty GitHub repository using exact UI clicks, then `git remote add origin <url>`, `git push -u origin main`, and the authentication options; finally `git clone` into a new folder, `npm install`, `npm start`, `git log --oneline` to prove a fresh clone works.)

## How it works
```text title="The three areas of Git"
Working folder  --git add-->  Staging area  --git commit-->  Repository (history)
                                                                  |
                                                            git push
                                                                  v
                                                               GitHub
```

## Verify against the requirements
- [ ] Repo created with `git init` → Step 3
- [ ] At least 5 commits → `git log --oneline` in Step 9
- [ ] Feature branch created and merged → Step 10
- [ ] One merge conflict resolved → Step 11
- [ ] `.gitignore` contains `node_modules`, `.env`, `dist` → Step 5
- [ ] `.env` never committed → Step 12 (`git check-ignore`)
- [ ] Fresh clone + `npm install` + `npm start` works → Step 14

## Common errors
### `fatal: not a git repository (or any of the parent directories): .git`
You are in the wrong folder, or you skipped `git init`. Run `cd fd-01-git-npm` then `git init`.

### `error: failed to push some refs to 'https://github.com/...'`
The remote has commits you don't have (for example GitHub created a README). Run `git pull origin main --rebase` and then `git push`.

### `'node' is not recognized as an internal or external command`
Node is not installed or the terminal was opened before installing. Install Node 20 LTS, then open a new terminal.

## Try it yourself (optional)
- Add a `build` script to `package.json` and run it with `npm run build`.
- Use `git log --graph --oneline --all` to see your branches.

## Quiz
### Q1
type: mcq
question: Which command saves a snapshot of staged files to the history?
options:
  - git add
  - git commit
  - git push
answer: 1
explanation: `git add` stages, `git commit` records the snapshot, `git push` uploads it.

## Recap
- Git records history locally; GitHub is just a remote copy.
- `package.json` describes your project; `package-lock.json` pins exact versions.
- Secrets live in `.env`, which is listed in `.gitignore`.
~~~~

## 5. VERIFICATION — LESSONS MUST BE CHECKED BY MACHINE

Create these scripts and run them in CI (GitHub Actions):

1. **`pnpm lessons:lint`** — validates every `content/lessons/*.md`:
   - Front-matter present and valid (Zod schema); `id` matches the filename and exists in the source spec.
   - All required `##` sections exist **in the required order**.
   - Every `## Step` has at least one code/command block and, if it runs a command that prints output, an **Expected output** block.
   - Every file block has a `title` path; every command block has a language of `bash`, `powershell`, `sh`, `sql`, `ts`, etc.
   - Windows and macOS/Linux tabs present wherever a block uses OS-specific commands (`mkdir -p`, `export`, `cat >`, `$env:`, `Set-Content`, `rm`).
   - At least 3 common errors; at least 5 quizzes; exactly 3 recap bullets.
   - No raw placeholder text (`TODO`, `TBD`, `lorem`, `...` alone in a code block, "etc.").
   - No step longer than ~900 characters of prose.
2. **`pnpm lessons:verify <ID>`** — extracts **file blocks** and **command blocks** and **executes them** in a clean temp directory (Docker container for PostgreSQL/Redis lessons): create the files exactly as shown, run the commands in order, and compare actual output to the **Expected output** blocks (ignoring regions marked as variable). Fails the build if any command fails or output differs materially.
   - TypeScript lessons: also run `tsc --noEmit` on the file blocks; the deliberate compile errors must produce the quoted error code (e.g. `TS2322`).
   - SQL lessons: run against a disposable `postgres:16` container and compare result sets.
3. **`pnpm lessons:coverage`** — prints which of the 170 programs have a lesson, and which acceptance criteria from the source spec are mapped in `## Verify against the requirements`.
4. **Pull-request checklist** — a PR template listing R1–R12 for the author to tick.

> If a command cannot be automatically verified (GitHub UI clicks, installing Docker), mark the block with `verify="manual"` and add the date and OS it was manually checked on.

## 6. AUTHORING PLAN (one batch per PR, in this order)

| Batch | Programs | Notes |
|---|---|---|
| 0 (pilot — do now) | FD-01, FD-02, FD-03 | Then **STOP** for my review |
| 1 | FD-04 … FD-12 | Foundations: async JS, plain HTTP server, Express, SQL basics, `pg` from Node, Docker, Redis |
| 2 | TS-01 … TS-15 | Core primitives and functions |
| 3 | TS-16 … TS-30 | Interfaces and object modeling |
| 4 | NS-01 … NS-11 | NestJS fundamentals |
| 5 | PG-01 … PG-08 | PostgreSQL schema, SQL, transactions |
| 6 | TS-31 … TS-45, TS-61 … TS-68, TS-76 … TS-80 | Generics, OOP, async/Node |
| 7 | NS-12 … NS-24 | Persistence, auth, Redis, queues, tests |
| 8 | PG-09 … PG-13, NS-33 … NS-37 | Indexing, FTS, pgvector, RLS, Redis/BullMQ advanced |
| 9 | Everything else | Advanced TS types, microservices, observability, Kubernetes, AI-related |

Each batch PR must: add the lesson files, pass `lessons:lint` and `lessons:verify`, include a screenshot of one lesson on a 390×844 viewport, and update `lessons:coverage` output in the PR description.

### Track-specific rules

**FD (Foundations):** assume zero knowledge. Show how to open a terminal on each OS. Show how to create files with the editor (VS Code) **and** with commands. Show screenshots descriptions as text only if screenshots are unavailable.

**TS (TypeScript):** each lesson starts from a fresh folder. Include, once per lesson or reference the shared setup lesson: `npm init -y`, `npm install -D typescript tsx @types/node vitest`, `npx tsc --init`, and the strict `tsconfig.json` shown in full. Each lesson has: `src/index.ts` (the solution, fully commented), `src/index.test.ts` (Vitest tests), run commands `npx tsx src/index.ts` and `npx vitest run`, expected output of both, and the **exact compiler error text** for each deliberate mistake (use `// @ts-expect-error` in the test files, and show the error that would appear without it in a `text` block). Explain every type-level construct in plain words before showing it.

**NS (NestJS):** start from `npm i -g @nestjs/cli` (or `npx @nestjs/cli new`), show the exact generated tree, show **every file** that is created or changed with full content, give `curl` commands (bash and PowerShell `Invoke-RestMethod` variants) and the exact JSON responses, show the Swagger/e2e test that proves the acceptance criteria. Use Docker Compose for Postgres/Redis with the full `docker-compose.yml` shown.

**PG (PostgreSQL):** start with `docker run --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16` (or Compose), connect with `docker exec -it pg psql -U postgres`, then give the full SQL scripts as files (`01_schema.sql`, `02_seed.sql`, `03_queries.sql`), how to run them (`psql -f`), and **the exact result tables** printed by `psql`. Every constraint must be proven by a statement that fails, showing the real error message.

## 7. DEFINITION OF DONE (for each lesson)

- [ ] File exists at `content/lessons/<ID>.md` and passes `lessons:lint`.
- [ ] `lessons:verify <ID>` passes (or manual blocks are explicitly marked and dated).
- [ ] Every acceptance criterion from the source spec is mapped to a step.
- [ ] Windows and macOS/Linux commands both provided where they differ.
- [ ] A beginner can follow it with **no outside knowledge** and **no guessing**.
- [ ] Renders correctly in the viewer on a phone: no raw Markdown, no clipped code, copy buttons work.

## 8. WHAT I EXPECT FROM YOU RIGHT NOW

1. A short plan (5–8 bullets) of how you will implement §3, §2, §5.
2. Implement steps 1–4 from "Your mission". Commit in small PRs: (a) Markdown rendering fix, (b) lesson schema + importer + lint, (c) viewer components, (d) verify script, (e) FD-01 to FD-03 lessons.
3. When finished, reply with: what you built, how to run `lessons:lint` / `lessons:verify`, screenshots or a description of the FD-01 lesson as it appears on a phone, and any command in the lessons you could **not** verify automatically.
4. **Do not author lessons beyond FD-03 until I approve.**
5. Ask me before adding any dependency not already listed in `PLAN.md` §3 (except the rendering/highlighting libraries named in §3 above).
