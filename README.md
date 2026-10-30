# AI Mastery Learning Platform

The first local vertical slice of the AI Mastery portal is a mobile-first learning dashboard based on the roadmap in [`PLAN.md`](./PLAN.md). It includes Today, Learning Path, Review, Saved, and Me views, local progress/bookmark state, a searchable roadmap, and a health endpoint.

## Run locally

```bash
npm install
npm run build
npm test
npm run dev
```

Open <http://localhost:3000>. The containerized version is available with:

Choose **Learning Path**, then select a row under **Programs in order** to read
that program's lesson. **Continue** on Today opens TS-01. Program pages support
direct links (for example `/#program/FD-01`), previous/next navigation, a
rendered source-spec tab, and returning to the path. Lessons are authored for
FD-01 through FD-12 and TS-01 through TS-02; `/api/lessons` lists authored lessons and
`/api/lessons/:id` returns a lesson. The `/api/programs/:code` endpoint still
serves source requirements for all 170 programs.

TS-01 starts with standalone Hello World, string, addition, and boolean
programs. Beginners can pause after Step 6; the remaining primitive types,
helper function, and compiler tests are introduced in the second session.
TS-02 begins with simple typed functions and reusable arithmetic. Pause after
Step 4 before learning runtime guards, error handling, alternative function
styles, and tests.

The lesson reader maps Markdown sections into vertically scrollable cards and
renders code, copy controls, OS tabs, expected output, callouts, searchable
errors, and quiz feedback. Lesson position, selected OS, theme, and text size
are kept in local storage.

## Validate lessons

```bash
npm run lessons:lint
npm run lessons:verify FD-01
npm run lessons:coverage
```

`lessons:verify` runs blocks marked `verify="run"` in a temporary directory.
Commands requiring a public service, account, or desktop UI are marked for
manual review in the lesson. The authoring format is documented in
[`docs/lesson-format.md`](./docs/lesson-format.md). Restart `npm run dev` after
server changes, then refresh your browser.

```bash
docker compose -f infra/docker-compose.yml up --build
```

This slice uses Node's built-in HTTP server and Shiki for code highlighting. The `/apps/web/Dockerfile` installs production dependencies and includes authored lessons for container use. JD Intelligence uses PostgreSQL; the planned Next.js frontend, NestJS API/worker, Redis, and database-backed lesson importer remain future phases rather than being faked behind this UI.

## JD Intelligence

Open <http://localhost:3000/#jd> to import job-description screenshots, run
zero-touch Azure OpenAI analysis, and see demand **in your collected JDs**.
Local OCR remains available as an offline fallback; its screenshots and JD text
are not sent to an external AI service.
Node.js 20.12+ is required.

### Import Naukri job links

Alongside screenshot upload, choose **Or upload a Naukri URL list**, select a
UTF-8 `.txt` file, then click **Upload URL list and analyze**. Put one full HTTPS
job-listing URL per line (on `naukri.com` or `www.naukri.com`). Blank lines and
standalone numbered separators such as `1.` are ignored, including the format
in `Job Description/Text Files/Naukri List 10-30-2026.txt`.
Files are limited to 256 KB and 100 distinct jobs. Tracking parameters,
fragments, trailing slashes and different slugs for the same Naukri job ID do
not create duplicates.

The server retrieves each listing's structured `JobPosting` description and
sends the extracted text to your configured Azure OpenAI deployment, using the
same evidence validation and one correction attempt as screenshot AI imports.
No OCR or separate **Run AI import** action is needed. Results are saved as
reviewed jobs and appear automatically in the refreshed job list, demand
rankings and learning priorities. Open a saved job to view its JD text,
preserved original source text and link to the original listing.
Re-uploading a URL re-analyzes and updates that job, replacing any manual
corrections rather than increasing demand counts. Screenshot imports are unchanged.

Run `npm run jd:migrate` after updating to add URL provenance to existing
databases, and restart the server. Azure OpenAI configuration is required.
`POST /api/jd/naukri-import` accepts JSON `{ "text": "one URL per line" }`;
progress and individual URL failures use `GET /api/jd/status`'s `aiProgress`.
Only one OCR or AI import runs at a time. Progress is in-memory; saved jobs
survive restarts and uploading the file again safely retries incomplete runs.

Naukri may deny automated requests, require login/CAPTCHA/JavaScript, omit
structured job data, or remove listings. The importer does **not** bypass those
restrictions or send error pages to AI. Such URLs fail visibly while other
URLs continue; use the existing screenshot upload instead. Downloads are
limited to 20 seconds and 2 MB per listing; redirects must remain on allowed
HTTPS Naukri job-listing URLs. No browser cookies or credentials are used.

### Local setup

```bash
# Ubuntu/Debian; on other systems install Tesseract with English language data.
sudo apt-get install tesseract-ocr tesseract-ocr-eng
npm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d jd-db
npm run jd:migrate
npm run dev
```

Use `docker-compose` in place of `docker compose` if that is the installed CLI.
The server and JD commands load the ignored `.env` file automatically; existing
environment variables take precedence. PostgreSQL uses a named Docker volume
and binds to `127.0.0.1:55432` to avoid conflicting with existing databases.
The example database password is **local-development only**.

### Fully automatic Azure OpenAI analysis

The **Run AI import** action combines the persisted local OCR text from each
folder into one ordered source document, then sends that document to the
configured Azure OpenAI deployment. The model corrects obvious OCR errors and
extracts the job title/company, role family, source text,
technology/capability, requirement strength, evidence quote, and confidence.
No screenshot image is sent to Azure, and one request is made per folder. This
reduces token and image-processing cost. AI-created jobs are saved as reviewed
and immediately included in demand. The operation is repeat-safe, so rerunning
updates the same AI jobs rather than adding duplicates.

Original OCR is preserved alongside the AI-corrected text. Evidence quotes are
validated against both, ignoring whitespace differences while preserving the
matched quote. Missing technologies, invalid evidence, oversized documents and
token-truncated responses are reported explicitly rather than saved as partial
or empty successful jobs. A response that fails extraction validation gets one
AI correction request before the folder is reported as failed.

Each immediate subfolder under `JD_SCREENSHOT_DIR` is one distinct job
boundary. Pages within a folder are combined into one job, while pages from
different folders are never merged. Adding a new JD in a new folder therefore
creates a new distinct job even when its title or company is similar to an
existing folder.

Add these environment variables to `.env` (never commit the key):

```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-10-21
```

Existing `JD_GPT_ENDPOINT`, `JD_GPT_API_KEY`, `JD_GPT_DEPLOYMENT`, and
`JD_GPT_API_VERSION` names are also accepted for compatibility.

Endpoints ending in `/openai/v1/` use the v1 Chat Completions API with the
deployment name in the request's `model` field; no `api-version` is needed.
Resource-root endpoints continue to use the dated deployment API. Use the
deployment name from Foundry, which may differ from the underlying model name.

The deployment must support JSON output; vision capability is not required for
the OCR-first AI import. Run **Import / retry screenshots** before **Run AI
import** so every screenshot has persisted OCR text. Azure OpenAI charges apply
to the extracted text requests.
The model receives only the OCR source document. Use a private Azure resource
and your organization's data-retention policy. The API key is
read only from the environment and is never logged or returned by `/api/jd/status`.
If a page fails, the run reports the page and error; it does not silently count
that page. Low-confidence fields are retained for audit, but the selected
fully-automatic policy includes the resulting job in demand.

Set `JD_DATABASE_URL` to use another PostgreSQL database and
`JD_SCREENSHOT_DIR` to change the input directory (default: `Job Description`).
`JD_OCR_COMMAND` selects the local Tesseract executable. The migration command
is repeat-safe. Data remains in PostgreSQL across server/container restarts.
Preserve both the database volume and original image directory; the database
stores OCR text, image hashes and relative image paths, not copies of images.

For the fully containerized app:

```bash
docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec web npm run jd:migrate
```

Tesseract and English data are included in the web image. The screenshot folder
is mounted writable to persist browser folder uploads. This is a **single-user local module without authentication**:
do not expose it directly to the internet. With JD configured, the native server
binds to loopback by default; `HOST` can explicitly override that. Docker binds
inside its container and publishes the web port only on the host's loopback.
Without JD database configuration, the existing learning views still work and
JD Intelligence displays a setup error.

### Review workflow

1. In step 1, choose a folder and click **Upload folder and extract text**.
   All JPEG, PNG and WebP images in the selected folder and its subfolders are
   uploaded and local OCR starts automatically. Each image is limited to 20 MB.
   Folder names are preserved under `JD_SCREENSHOT_DIR`. Identical files at the
   same path are skipped; different content never overwrites an existing file.
   The screenshot directory must be writable. No manual page-grouping section
   is displayed. Existing imported data is preserved, not deleted.
   Alternatively, click **Import / retry screenshots** to scan files already on
   the server, or run `npm run jd:import`.
   JPEG, PNG and WebP files are scanned recursively. Identical image bytes are
   skipped by SHA-256; failed OCR is recorded visibly and retried on the next import.
   The web import runs in-process, not in BullMQ. Its live progress is temporary;
   successfully imported pages and failures are persisted. After a restart,
   import again to resume using the image hashes.
2. Place all screenshots for one JD in its own folder. The OCR pages are
   combined automatically into one source document; no manual page selection or
   grouping is required. Original screenshots and OCR text remain available for
   evidence and review.
3. Review the corrected title, company, role, JD text and technologies in the
   automatically saved job. Leave posting date empty if unknown. Collection
   date is separate; image filenames do not establish posting dates.
4. Review the suggested technologies. Extraction uses a local curated catalogue
   and aliases, **not an exhaustive semantic model**. All text is retained so you
   can add missed/new technologies as `Name | Category | requirement`, or remove
   irrelevant suggestions. Unknown names must appear in the corrected JD text.
   Required/preferred strength is explicitly user-reviewed, not guessed.
   Custom technologies saved from your reviews are suggested in later imports.
5. AI jobs are automatically saved as reviewed. Only reviewed, role-classified
   jobs contribute to demand. Editing replaces
   that job's mentions atomically; it does not increment counts.
6. Refresh lists after saving. Filter demand by role and collection date.
   Each technology counts at most once per job, with source evidence. The
   demand response includes a technology-area ranking. An area counts a job
   once even when that job mentions multiple technologies in the area. The
   provisional quarterly learning sequence uses prerequisites and observed job
   counts, not a forecast or personalized proficiency assessment.

Screenshot byte deduplication does not detect reposts, different crops, or two
different images of the same job. Reviewers must group these into one job to
avoid overstating demand. To correct grouping, edit a job and use the explicit
page controls to reorder/remove attachments or add selected unassigned pages;
unused pages are released after saving. Attachment changes preserve corrected
text until you explicitly rebuild it. Editing clears the reviewed checkbox.

The tables are `job_descriptions`, `jd_screenshots`, `jd_pages`, `technologies`,
`technology_aliases`, and `jd_technology_mentions`. SQL is parameterized through
`pg`, matching the current plain-Node slice rather than introducing NestJS/Prisma
solely for this module. Schema changes live in `infra/postgres/001-jd.sql`.

API: `GET /api/jd/status`, `POST /api/jd/import`,
`GET /api/jd/screenshots`, `GET /api/jd/screenshots/:id/image`,
`POST /api/jd/extract`, `GET|POST /api/jd/jobs`,
`GET|PUT /api/jd/jobs/:id`, `GET /api/jd/demand?role=&from=&to=`.
Writes require JSON; cross-origin writes and oversized requests are rejected.

### Validation

```bash
npm run build
npm test
# Opt into real database/HTTP integration tests using an isolated temporary schema:
JD_TEST_DATABASE_URL=postgresql://aistack:aistack_local@127.0.0.1:55432/aistack npm test
```

Integration tests remove only their own temporary schema. Without
`JD_TEST_DATABASE_URL`, that test is explicitly skipped. Unit tests cover
extraction, alias normalization, evidence validation, date validation, OCR
failures, repeat imports, and quarterly sequencing.

Later milestones can add comparable-period trends, proficiency tracking,
lesson mappings, and a queue-backed importer. No market trend or skill-gap
claims are manufactured from this first screenshot collection.
# aistack
