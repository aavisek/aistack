import test from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { renderedNaukriDocument, renderNaukriJob } from "./jd-naukri-browser.mjs";

const url = "https://www.naukri.com/job-listings-ai-architect-example-181026003829";

function documentFixture({ title = "AI Architect", description = "Python is required.", blocked = false, ambiguous = false, expanded = false } = {}) {
  return {
    body: { innerText: blocked ? "Verify you are human" : "Job description" },
    querySelectorAll(selector) {
      if (selector.startsWith("h1")) return title ? [{ innerText: title }] : [];
      const container = { querySelector: (selector) => selector === "h2"
        ? { textContent: "Job description", parentElement: { nextElementSibling: { tagName: "DIV", className: "", innerText: description } } }
        : selector.includes("short-desc") ? (expanded ? null : { innerText: description })
        : { innerText: "Python" } };
      return ambiguous ? [container, container] : [container];
    },
    querySelector: (selector) => selector.includes("jd-header-comp-name") ? { innerText: "Example Co" } : null
  };
}

test("rendered extraction reads only job content and rejects verification, ambiguity and oversized text", () => {
  const extract = (options) => runInNewContext(`(${renderedNaukriDocument.toString()})()`, { document: documentFixture(options) });
  assert.equal(extract().text, "Title: AI Architect\n\nCompany: Example Co\n\nPython is required.\n\nPython");
  assert.equal(extract({ expanded: true }).text, extract().text);
  assert.equal(extract({ title: "" }), null);
  assert.equal(extract({ description: "" }), null);
  assert.match(extract({ blocked: true }).error, /verification/);
  assert.match(extract({ ambiguous: true }).error, /multiple job/);
  assert.match(extract({ description: "x".repeat(100001) }).error, /100000/);
});

function browserFixture({ result = { text: "Title: AI Architect\n\nPython is required." }, timeout = false } = {}) {
  const state = { closed: false };
  const frame = {};
  const page = {
    mainFrame: () => frame,
    goto: async () => ({ ok: () => true, headers: () => ({ "content-type": "text/html" }) }),
    waitForFunction: async () => {
      if (timeout) { const error = new Error("Timed out"); error.name = "TimeoutError"; throw error; }
      return { jsonValue: async () => result };
    },
    url: () => url
  };
  const context = {
    newPage: async () => page,
    route: async (_, callback) => { state.route = callback; },
    routeWebSocket: async () => {}
  };
  const browserType = {
    launch: async (options) => {
      assert.equal(options.chromiumSandbox, true);
      return { newContext: async () => context, close: async () => { state.closed = true; } };
    }
  };
  const request = async (target, { navigation = false, type = "script", main = true } = {}) => {
    let action;
    await state.route({
      request: () => ({ url: () => target, isNavigationRequest: () => navigation, frame: () => main ? frame : {}, resourceType: () => type }),
      abort: async () => { action = "abort"; }, continue: async () => { action = "continue"; }
    });
    return action;
  };
  return { state, browserType, request, page };
}

test("browser isolates resources, rejects unsafe redirects and closes on success", async () => {
  const fixture = browserFixture();
  assert.match(await renderNaukriJob(url, fixture.browserType), /Python/);
  assert.equal(fixture.state.closed, true);
  for (const target of ["https://static.naukimg.com/app.js", "https://www.naukri.com/api/job"]) {
    assert.equal(await fixture.request(target), "continue");
  }
  for (const target of ["http://www.naukri.com/a", "https://127.0.0.1/a", "https://naukri.com.evil.example/a", "https://user:pass@www.naukri.com/a"]) {
    assert.equal(await fixture.request(target), "abort");
  }
  assert.equal(await fixture.request("https://www.naukri.com/image", { type: "image" }), "abort");
  assert.equal(await fixture.request(url, { navigation: true, main: false }), "abort");
  assert.equal(await fixture.request("https://www.naukri.com/login", { navigation: true }), "abort");
  assert.equal(await fixture.request(url.replace("181026003829", "121026010400"), { navigation: true }), "abort");
});

test("browser closes on blocked pages and timeouts and reports useful errors", async () => {
  for (const options of [{ result: { error: "Naukri requires verification." } }, { timeout: true }]) {
    const fixture = browserFixture(options);
    await assert.rejects(renderNaukriJob(url, fixture.browserType), /verification|timed out/);
    assert.equal(fixture.state.closed, true);
  }
});

test("browser enforces a request budget and rejects non-HTML or failed responses", async () => {
  const fixture = browserFixture();
  await renderNaukriJob(url, fixture.browserType);
  for (let index = 0; index < 200; index += 1) {
    assert.equal(await fixture.request("https://static.naukimg.com/app.js"), "continue");
  }
  assert.equal(await fixture.request("https://static.naukimg.com/app.js"), "abort");
  for (const response of [
    { ok: () => false, status: () => 403 },
    { ok: () => true, headers: () => ({ "content-type": "application/json" }) }
  ]) {
    const failed = browserFixture();
    failed.page.goto = async () => response;
    await assert.rejects(renderNaukriJob(url, failed.browserType), /HTTP 403|HTML/);
    assert.equal(failed.state.closed, true);
  }
});
