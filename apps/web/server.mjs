import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPrograms } from "./course.mjs";
import { loadLessons } from "./lessons.mjs";
import { cheatSheetFor, cheatSheetId, cheatSheetInfo, cheatSheetNavigation, listCheatSheetGroups, listCheatSheets, renderCheatSheetPage } from "./cheatsheets.mjs";
import { jdConfig } from "./jd-config.mjs";
import { JdStore } from "./jd-store.mjs";
import { createJdApi } from "./jd-api.mjs";
import { authConfig, createAuth } from "./auth.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const port = Number(process.env.PORT ?? 3000);
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };
const jdSettings = jdConfig();
const jdStore = jdSettings.databaseUrl ? new JdStore(jdSettings.databaseUrl) : null;
const jdApi = createJdApi(jdStore, jdSettings);
const auth = createAuth(authConfig());

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (await auth.handle(request, response, url)) return;
  if (await auth.guard(request, response, url)) return;
  if (url.pathname === "/api/jd" || url.pathname.startsWith("/api/jd/")) {
    await jdApi(request, response, url);
    return;
  }
  if (url.pathname === "/api/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", service: "web", timestamp: new Date().toISOString() }));
    return;
  }
  if (url.pathname === "/api/lessons") {
    try {
      const lessons = await loadLessons();
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-cache" });
      response.end(JSON.stringify({ data: lessons.map(({ id, title, track, level, estMinutes, prerequisites }) => ({ id, title, track, level, estMinutes, prerequisites })) }));
    } catch (error) {
      console.error("Failed to load lesson content:", error);
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "Lesson content could not be loaded." } }));
    }
    return;
  }
  if (url.pathname === "/api/cheatsheets") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-cache" });
    response.end(JSON.stringify({ data: listCheatSheets(), groups: listCheatSheetGroups() }));
    return;
  }
  if (url.pathname.startsWith("/api/cheatsheets/")) {
    try {
      const [id, kind, pageFile] = url.pathname.slice("/api/cheatsheets/".length).split("/").map(decodeURIComponent);
      if (!kind) {
        const resolvedId = cheatSheetId(id);
        const info = await cheatSheetInfo(resolvedId);
        response.writeHead(info ? 200 : 404, { "content-type": "application/json", "cache-control": "no-cache" });
        response.end(JSON.stringify(info ? { data: info, navigation: cheatSheetNavigation(resolvedId) } : { error: { message: "Cheat sheet not found." } }));
        return;
      }
      const pageNumber = kind === "pages" && /^\d+\.png$/.test(pageFile ?? "") ? Number.parseInt(pageFile, 10) : Number.NaN;
      const image = await renderCheatSheetPage(id, pageNumber);
      if (!image) {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: { message: "Cheat sheet page not found." } }));
        return;
      }
      response.writeHead(200, { "content-type": "image/png", "cache-control": "private, no-store", "content-disposition": "inline", "x-content-type-options": "nosniff" });
      response.end(image);
    } catch (error) {
      console.error("Failed to load cheat sheet:", error);
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "Cheat sheet could not be loaded." } }));
    }
    return;
  }
  if (url.pathname.startsWith("/api/lessons/")) {
    try {
      const id = decodeURIComponent(url.pathname.slice("/api/lessons/".length));
      const lesson = (await loadLessons({ withHighlights: true })).find((item) => item.id === id);
      const sheet = cheatSheetFor(id);
      response.writeHead(lesson ? 200 : 404, { "content-type": "application/json", "cache-control": "no-cache" });
      response.end(JSON.stringify(lesson ? { data: { ...lesson, cheatSheet: sheet ? { id, title: sheet.title } : null } } : { error: { message: "Lesson not found." } }));
    } catch (error) {
      console.error("Failed to load lesson content:", error);
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "Lesson content could not be loaded." } }));
    }
    return;
  }
  if (url.pathname.startsWith("/api/programs/")) {
    try {
      const code = url.pathname.slice("/api/programs/".length);
      const program = (await loadPrograms()).find((item) => item.code === code);
      response.writeHead(program ? 200 : 404, { "content-type": "application/json", "cache-control": "no-cache" });
      response.end(JSON.stringify(program ? { data: program } : { error: { message: "Program not found." } }));
    } catch (error) {
      console.error("Failed to load course content:", error);
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "Course content could not be loaded." } }));
    }
    return;
  }

  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "content-type": types[extname(filePath)] ?? "application/octet-stream", "cache-control": "no-cache" });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, jdSettings.host, () => {
  console.log(`AI Mastery portal running at http://localhost:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(async () => {
      await jdApi.waitForImport();
      await jdApi.waitForAiImport();
      await jdStore?.close();
    });
  });
}
