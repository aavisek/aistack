import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { authConfig, createAuth } from "./auth.mjs";

const env = { GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "secret", AUTH_SESSION_SECRET: "x".repeat(40), AUTH_BASE_URL: "http://localhost:3000", AUTH_ALLOWED_EMAIL: "a@example.com" };

const idToken = (claims) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
const cookieOf = (response, name) => response.headers.getSetCookie().map((c) => c.split(";")[0]).find((c) => c.startsWith(`${name}=`));

async function start(config, fetchImpl) {
  const auth = createAuth(config, { fetchImpl });
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (await auth.handle(request, response, url) || await auth.guard(request, response, url)) return;
    response.writeHead(200);
    response.end("secret page");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

async function signIn(base, claims, extra = {}) {
  const login = await fetch(`${base}/auth/login`, { redirect: "manual" });
  const location = new URL(login.headers.get("location"));
  const flow = cookieOf(login, "aistack_oauth");
  const state = location.searchParams.get("state");
  const nonce = location.searchParams.get("nonce");
  return { login, location, callback: (overrideState = state) => fetch(`${base}/auth/callback?code=abc&state=${overrideState}`, { redirect: "manual", headers: { cookie: flow } }), nonce, claims: { iss: "https://accounts.google.com", aud: "client-id", exp: Math.floor(Date.now() / 1000) + 600, sub: "1", email: "A@Example.com", email_verified: true, name: "Ada Lovelace", nonce, ...claims, ...extra } };
}

test("auth is disabled without Google credentials and validates partial config", () => {
  assert.equal(authConfig({}).enabled, false);
  assert.throws(() => authConfig({ GOOGLE_CLIENT_ID: "x" }), /both/);
  assert.throws(() => authConfig({ ...env, AUTH_SESSION_SECRET: "short" }), /at least 32/);
  assert.throws(() => authConfig({ ...env, AUTH_ALLOWED_EMAIL: "" }), /who may sign in/);
  assert.equal(authConfig(env).enabled, true);
});

test("unauthenticated requests are redirected or rejected, health stays public", async () => {
  const app = await start(authConfig(env));
  try {
    const page = await fetch(`${app.base}/`, { redirect: "manual" });
    assert.equal(page.status, 302);
    assert.equal(page.headers.get("location"), "/login");
    assert.equal((await fetch(`${app.base}/api/lessons`)).status, 401);
    assert.equal((await fetch(`${app.base}/api/health`)).status, 200);
    assert.match(await (await fetch(`${app.base}/login?error=forbidden`)).text(), /not allowed/);
  } finally { await app.close(); }
});

test("login redirects to Google with PKCE, and callback creates a session", async () => {
  let tokenRequest;
  const flowHolder = {};
  const app = await start(authConfig(env), async (url, init) => {
    tokenRequest = { url, body: init.body };
    return Response.json({ id_token: idToken(flowHolder.claims) });
  });
  try {
    const flow = await signIn(app.base, {});
    flowHolder.claims = flow.claims;
    assert.equal(flow.location.origin + flow.location.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
    assert.equal(flow.location.searchParams.get("code_challenge_method"), "S256");
    assert.equal(flow.location.searchParams.get("redirect_uri"), "http://localhost:3000/auth/callback");
    const callback = await flow.callback();
    assert.equal(callback.headers.get("location"), "/");
    assert.equal(new URLSearchParams(tokenRequest.body).get("grant_type"), "authorization_code");
    const session = cookieOf(callback, "aistack_session");
    assert.match(callback.headers.getSetCookie().join(";"), /HttpOnly/);
    const me = await fetch(`${app.base}/api/auth/me`, { headers: { cookie: session } });
    assert.deepEqual((await me.json()).data.user.email, "a@example.com");
    assert.equal(await (await fetch(`${app.base}/`, { headers: { cookie: session } })).text(), "secret page");
    const forged = `${session.slice(0, -2)}xx`;
    assert.equal((await fetch(`${app.base}/api/auth/me`, { headers: { cookie: forged } })).status, 401);
  } finally { await app.close(); }
});

test("callback rejects bad state, wrong nonce/audience, unverified and disallowed emails", async () => {
  const holder = {};
  const run = async (config, mutate, expected) => {
    const app = await start(authConfig(config), async () => Response.json({ id_token: idToken(holder.claims) }));
    try {
      const flow = await signIn(app.base, mutate);
      holder.claims = flow.claims;
      const callback = await flow.callback();
      assert.equal(callback.headers.get("location"), expected);
      assert.equal(cookieOf(callback, "aistack_session") === undefined, expected !== "/");
    } finally { await app.close(); }
  };
  await run(env, { nonce: "other" }, "/login?error=failed");
  await run(env, { aud: "someone-else" }, "/login?error=failed");
  await run(env, { email_verified: false }, "/login?error=failed");
  await run({ ...env, AUTH_ALLOWED_EMAIL: "boss@example.com" }, {}, "/login?error=forbidden");
  await run({ ...env, AUTH_ALLOWED_EMAIL: "", AUTH_ALLOWED_DOMAINS: "example.com" }, { hd: "example.com" }, "/");

  const app = await start(authConfig(env), async () => Response.json({}));
  try {
    const flow = await signIn(app.base, {});
    assert.equal((await flow.callback("tampered")).headers.get("location"), "/login?error=state");
  } finally { await app.close(); }
});

test("logout clears the session cookie", async () => {
  const app = await start(authConfig(env));
  try {
    const response = await fetch(`${app.base}/auth/logout`, { method: "POST", redirect: "manual" });
    assert.match(response.headers.getSetCookie()[0], /aistack_session=;.*Max-Age=0/);
  } finally { await app.close(); }
});
