import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { extname, join, sep } from "node:path";
import { JdError, importScreenshots, isUuid, categories, roles } from "./jd.mjs";
import { AzureJdProcessor } from "./jd-ai.mjs";
import { parseNaukriList, importNaukriJobs } from "./jd-naukri.mjs";

function send(response, status, value) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

async function jsonBody(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers["content-type"] ?? "")) throw new JdError("Use application/json.", 415);
  let length = 0;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 1024 * 1024) throw new JdError("Request is too large (maximum 1 MB).", 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new JdError("Invalid JSON."); }
}

async function uploadScreenshot(request, config, sourcePath) {
  const parts = typeof sourcePath === "string" ? sourcePath.split("/") : [];
  if (parts.length < 2 || parts.some((part) => !part || part === "." || part === ".." || /[\\\x00-\x1f]/.test(part)) || sourcePath.length > 1000) {
    throw new JdError("Select images within a named folder; invalid upload path.");
  }
  const extension = extname(sourcePath).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) throw new JdError("Upload JPEG, PNG or WebP images only.", 415);
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 20 * 1024 * 1024) throw new JdError("Each image must be at most 20 MB.", 413);
    chunks.push(chunk);
  }
  const image = Buffer.concat(chunks);
  const valid = extension === ".png" ? image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : extension === ".webp" ? image.toString("ascii", 0, 4) === "RIFF" && image.toString("ascii", 8, 12) === "WEBP"
      : image[0] === 255 && image[1] === 216 && image[2] === 255;
  if (!valid) throw new JdError("File content does not match the selected image format.", 415);
  await mkdir(config.screenshotDir, { recursive: true });
  const root = await realpath(config.screenshotDir);
  let parent = root;
  for (const part of parts.slice(0, -1)) {
    const directory = join(parent, part);
    try { await mkdir(directory); }
    catch (error) { if (error.code !== "EEXIST") throw error; }
    parent = await realpath(directory);
    if (!parent.startsWith(`${root}${sep}`)) throw new JdError("Upload folder is outside the configured directory.", 403);
  }
  const target = join(parent, parts.at(-1));
  try { await writeFile(target, image, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = await realpath(target);
    if (!existing.startsWith(`${root}${sep}`)) throw new JdError("Upload target is outside the configured directory.", 403);
    if (!(await readFile(existing)).equals(image)) throw new JdError("An image with this path already exists with different content. Use a new folder or filename.", 409);
    return { sourcePath, skipped: true };
  }
  return { sourcePath, skipped: false };
}

export function createJdApi(store, config) {
  let progress = { state: "idle", total: 0, processed: 0, imported: 0, skipped: 0, failed: 0, errors: [] };
  let importing = null;
  let aiProgress = { state: "idle", total: 0, processed: 0, jobs: 0, failed: 0, errors: [] };
  let aiImporting = null;
  const aiProcessor = new AzureJdProcessor(store, config);
  const handler = async (request, response, url) => {
    try {
      if (!store) throw new JdError("JD Intelligence requires JD_DATABASE_URL. See the README setup instructions.", 503);
      if (request.method !== "GET") {
        const origin = request.headers.origin;
        if ((origin && origin !== `http://${request.headers.host}` && origin !== `https://${request.headers.host}`) || request.headers["sec-fetch-site"] === "cross-site") {
          throw new JdError("Cross-origin writes are not allowed.", 403);
        }
      }
      const route = url.pathname.slice("/api/jd".length);
      if (route === "/status" && request.method === "GET") {
        await store.pool.query("SELECT 1 FROM jd_screenshots LIMIT 1");
        send(response, 200, { data: { progress, aiProgress, aiEnabled: aiProcessor.enabled(), categories, roles } });
      } else if (route === "/upload" && request.method === "POST") {
        if (importing || aiImporting) throw new JdError("Wait for the current import before uploading images.", 409);
        try {
          send(response, 201, { data: await uploadScreenshot(request, config, url.searchParams.get("path")) });
        } catch (error) {
          if (["EACCES", "EROFS", "ENOSPC", "ENOTDIR"].includes(error.code)) {
            console.error("JD upload failed:", error.code);
            throw new JdError("Could not save the image. Check that JD_SCREENSHOT_DIR is writable and has free disk space.", 503);
          }
          throw error;
        }
      } else if (route === "/import" && request.method === "POST") {
        await jsonBody(request);
        if (importing || aiImporting) throw new JdError("An import is already running.", 409);
        await store.pool.query("SELECT 1 FROM jd_screenshots LIMIT 1");
        progress = { state: "running", total: 0, processed: 0, imported: 0, skipped: 0, failed: 0, errors: [] };
        importing = importScreenshots(store, config, progress).then(() => {
          progress.state = progress.failed ? "completed-with-errors" : "completed";
        }).catch((error) => {
          console.error("JD import failed:", error.message);
          progress.state = "failed";
          progress.errors.push({ message: error.message });
        }).finally(() => { importing = null; });
        send(response, 202, { data: progress });
      } else if (route === "/naukri-import" && request.method === "POST") {
        const input = await jsonBody(request);
        const { urls, skipped } = parseNaukriList(input?.text);
        if (importing || aiImporting) throw new JdError("An import is already running.", 409);
        if (!aiProcessor.enabled()) throw new JdError("Configure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY and AZURE_OPENAI_DEPLOYMENT to use AI import.", 503);
        await store.pool.query("SELECT source_url FROM job_descriptions LIMIT 1");
        aiProgress = { state: "running", sourceType: "urls", total: urls.length, processed: 0, jobs: 0, skipped, failed: 0, errors: [] };
        aiImporting = importNaukriJobs(aiProcessor, store, urls, aiProgress).catch((error) => {
          console.error("Naukri JD import failed:", error.message);
          aiProgress.state = "failed";
          aiProgress.errors.push({ message: error.message });
        }).finally(() => { aiImporting = null; });
        send(response, 202, { data: aiProgress });
      } else if (route === "/ai-import" && request.method === "POST") {
        await jsonBody(request);
        if (importing || aiImporting) throw new JdError("An import is already running.", 409);
        aiProgress = { state: "running", total: 0, processed: 0, jobs: 0, failed: 0, errors: [] };
        aiImporting = aiProcessor.run(aiProgress).catch((error) => {
          console.error("Azure OpenAI JD import failed:", error.message);
          aiProgress.state = "failed";
          aiProgress.errors.push({ message: error.message });
        }).finally(() => { aiImporting = null; });
        send(response, 202, { data: aiProgress });
      } else if (route === "/screenshots" && request.method === "GET") {
        send(response, 200, { data: await store.screenshots() });
      } else if (/^\/screenshots\/[^/]+\/image$/.test(route) && request.method === "GET") {
        const id = route.split("/")[2];
        if (!isUuid(id)) throw new JdError("Invalid screenshot ID.");
        const result = await store.pool.query("SELECT source_path,content_hash FROM jd_screenshots WHERE id=$1", [id]);
        if (!result.rows[0]) throw new JdError("Screenshot not found.", 404);
        let root;
        let path;
        try {
          root = await realpath(config.screenshotDir);
          path = await realpath(join(root, result.rows[0].source_path));
        } catch (error) {
          if (error.code === "ENOENT") throw new JdError("The original screenshot is no longer available in the configured folder.", 404);
          throw error;
        }
        if (!path.startsWith(`${root}${sep}`)) throw new JdError("Screenshot is outside the configured directory.", 403);
        const type = { ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[extname(path).toLowerCase()];
        if (!type) throw new JdError("Unsupported screenshot type.", 415);
        const image = await readFile(path);
        if (createHash("sha256").update(image).digest("hex") !== result.rows[0].content_hash) {
          throw new JdError("The screenshot file changed since import. Restore the original image to view this evidence.", 409);
        }
        response.writeHead(200, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
        response.end(image);
      } else if (route === "/jobs" && request.method === "GET") {
        send(response, 200, { data: await store.jobs() });
      } else if (route === "/jobs" && request.method === "POST") {
        send(response, 201, { data: await store.saveJob(randomUUID(), await jsonBody(request), true) });
      } else if (route.startsWith("/jobs/") && ["GET", "PUT"].includes(request.method)) {
        const id = route.slice("/jobs/".length);
        if (!isUuid(id)) throw new JdError("Invalid job ID.");
        send(response, 200, { data: request.method === "GET" ? await store.job(id) : await store.saveJob(id, await jsonBody(request)) });
      } else if (route === "/extract" && request.method === "POST") {
        const input = await jsonBody(request);
        if (!input || typeof input.text !== "string" || !input.text.trim() || input.text.length > 100000) throw new JdError("Provide JD text (1 to 100000 characters).");
        send(response, 200, { data: await store.suggest(input.text) });
      } else if (route === "/demand" && request.method === "GET") {
        send(response, 200, { data: await store.demand(url.searchParams) });
      } else {
        throw new JdError("JD endpoint or method not found.", 404);
      }
    } catch (error) {
      const status = error instanceof JdError ? error.status : 503;
      if (!(error instanceof JdError)) console.error("JD request failed:", error.code ?? error.message);
      send(response, status, { error: { message: error instanceof JdError ? error.message : "JD database is unavailable or not migrated. Check JD_DATABASE_URL and run npm run jd:migrate." } });
    }
  };
  handler.waitForImport = async () => { if (importing) await importing; };
  handler.waitForAiImport = async () => { if (aiImporting) await aiImporting; };
  return handler;
}
