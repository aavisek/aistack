import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);
const SESSION_COOKIE = "aistack_session";
const FLOW_COOKIE = "aistack_oauth";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const FLOW_SECONDS = 10 * 60;

const list = (value) => (value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
const b64url = (buffer) => Buffer.from(buffer).toString("base64url");

export function authConfig(env = process.env) {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId && !clientSecret) return { enabled: false };
  if (!clientId || !clientSecret) throw new Error("Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google sign-in.");
  const sessionSecret = env.AUTH_SESSION_SECRET?.trim();
  if (!sessionSecret || sessionSecret.length < 32) throw new Error("AUTH_SESSION_SECRET must be set to a random value of at least 32 characters.");
  const allowedEmails = list(`${env.AUTH_ALLOWED_EMAIL ?? ""},${env.AUTH_ALLOWED_EMAILS ?? ""}`);
  const allowedDomains = list(env.AUTH_ALLOWED_DOMAINS);
  if (!allowedEmails.length && !allowedDomains.length) throw new Error("Set AUTH_ALLOWED_EMAIL (or AUTH_ALLOWED_EMAILS / AUTH_ALLOWED_DOMAINS) to choose who may sign in.");
  const baseUrl = (env.AUTH_BASE_URL?.trim() || `http://localhost:${env.PORT ?? 3000}`).replace(/\/+$/, "");
  if (!/^https?:\/\//.test(baseUrl)) throw new Error("AUTH_BASE_URL must start with http:// or https://.");
  return {
    enabled: true,
    clientId,
    clientSecret,
    sessionSecret,
    baseUrl,
    secureCookies: baseUrl.startsWith("https://"),
    allowedEmails,
    allowedDomains
  };
}

function parseCookies(header = "") {
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index > 0) cookies[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return cookies;
}

function sign(secret, payload, purpose) {
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac("sha256", secret).update(`${purpose}.${body}`).digest("base64url");
  return `${body}.${mac}`;
}

function verify(secret, token, purpose) {
  if (typeof token !== "string") return null;
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = createHmac("sha256", secret).update(`${purpose}.${body}`).digest();
  const actual = Buffer.from(mac, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload?.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}

function decodeIdToken(idToken) {
  const parts = typeof idToken === "string" ? idToken.split(".") : [];
  if (parts.length !== 3) throw new Error("Malformed ID token.");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

const html = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0}main{background:#1e293b;padding:2.5rem;border-radius:16px;max-width:22rem;text-align:center}a.btn{display:inline-block;margin-top:1rem;padding:.75rem 1.25rem;background:#fff;color:#1f2937;border-radius:8px;text-decoration:none;font-weight:600}p.err{color:#fca5a5}</style></head><body><main>${body}</main></body></html>`;

const ERRORS = {
  denied: "Sign-in was cancelled.",
  state: "Your sign-in session expired. Please try again.",
  failed: "Google sign-in failed. Please try again.",
  forbidden: "This Google account is not allowed to access this app."
};

export function createAuth(config, { fetchImpl = fetch } = {}) {
  if (!config.enabled) {
    const handle = async (request, response, url) => {
      if (url.pathname !== "/api/auth/me") return false;
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ data: { enabled: false, user: null } }));
      return true;
    };
    return { enabled: false, handle, guard: async () => false, userFrom: () => null };
  }

  const cookieFlags = (maxAge) => `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${config.secureCookies ? "; Secure" : ""}`;
  const redirectUri = `${config.baseUrl}/auth/callback`;
  const userFrom = (request) => {
    const session = verify(config.sessionSecret, parseCookies(request.headers.cookie)[SESSION_COOKIE], "session");
    return session ? { sub: session.sub, email: session.email, name: session.name, picture: session.picture } : null;
  };

  function redirect(response, location, cookies = []) {
    response.writeHead(302, { location, "set-cookie": cookies, "cache-control": "no-store" });
    response.end();
  }

  function page(response, status, title, body) {
    response.writeHead(status, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
    response.end(html(title, body));
  }

  function allowed(email, hostedDomain) {
    const domain = email.split("@")[1];
    return config.allowedEmails.includes(email) || (config.allowedDomains.includes(domain) && (!hostedDomain || hostedDomain.toLowerCase() === domain));
  }

  async function callback(request, response, url) {
    const clearFlow = `${FLOW_COOKIE}=; ${cookieFlags(0)}`;
    const fail = (code) => redirect(response, `/login?error=${code}`, [clearFlow]);
    if (url.searchParams.get("error")) return fail("denied");
    const flow = verify(config.sessionSecret, parseCookies(request.headers.cookie)[FLOW_COOKIE], "flow");
    const state = url.searchParams.get("state") ?? "";
    const code = url.searchParams.get("code");
    if (!flow || !code || state.length !== flow.state.length || !timingSafeEqual(Buffer.from(state), Buffer.from(flow.state))) return fail("state");
    try {
      const tokenResponse = await fetchImpl(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: flow.verifier
        }),
        signal: AbortSignal.timeout(10_000)
      });
      if (!tokenResponse.ok) throw new Error(`Token exchange failed (${tokenResponse.status}).`);
      // The ID token comes straight from Google's token endpoint over TLS, so claims are validated rather than re-verifying a signature.
      const claims = decodeIdToken((await tokenResponse.json()).id_token);
      const now = Math.floor(Date.now() / 1000);
      if (!GOOGLE_ISSUERS.has(claims.iss) || claims.aud !== config.clientId || !(claims.exp > now) || claims.nonce !== flow.nonce) throw new Error("Invalid ID token claims.");
      const email = String(claims.email ?? "").toLowerCase();
      if (!claims.sub || !email || claims.email_verified !== true) throw new Error("Google account email is not verified.");
      if (!allowed(email, claims.hd)) return fail("forbidden");
      const session = sign(config.sessionSecret, { sub: claims.sub, email, name: claims.name ?? email, picture: claims.picture ?? null, exp: now + SESSION_SECONDS }, "session");
      redirect(response, "/", [`${SESSION_COOKIE}=${session}; ${cookieFlags(SESSION_SECONDS)}`, clearFlow]);
    } catch (error) {
      console.error("Google sign-in failed:", error.message);
      fail("failed");
    }
  }

  async function handle(request, response, url) {
    const { pathname } = url;
    if (pathname === "/login" && request.method === "GET") {
      if (userFrom(request)) {
        redirect(response, "/");
        return true;
      }
      const message = ERRORS[url.searchParams.get("error")];
      page(response, 200, "Sign in", `<h1>AI Mastery</h1><p>Sign in to continue.</p>${message ? `<p class="err">${message}</p>` : ""}<a class="btn" href="/auth/login">Sign in with Google</a>`);
      return true;
    }
    if (pathname === "/auth/login" && request.method === "GET") {
      const flow = { state: b64url(randomBytes(24)), nonce: b64url(randomBytes(24)), verifier: b64url(randomBytes(48)), exp: Math.floor(Date.now() / 1000) + FLOW_SECONDS };
      const query = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state: flow.state,
        nonce: flow.nonce,
        code_challenge: createHash("sha256").update(flow.verifier).digest("base64url"),
        code_challenge_method: "S256",
        prompt: "select_account"
      });
      redirect(response, `${GOOGLE_AUTH_URL}?${query}`, [`${FLOW_COOKIE}=${sign(config.sessionSecret, flow, "flow")}; ${cookieFlags(FLOW_SECONDS)}`]);
      return true;
    }
    if (pathname === "/auth/callback" && request.method === "GET") {
      await callback(request, response, url);
      return true;
    }
    if (pathname === "/auth/logout" && request.method === "POST") {
      redirect(response, "/login", [`${SESSION_COOKIE}=; ${cookieFlags(0)}`]);
      return true;
    }
    if (pathname === "/api/auth/me") {
      const user = userFrom(request);
      response.writeHead(user ? 200 : 401, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify(user ? { data: { enabled: true, user } } : { error: { message: "Sign in required." } }));
      return true;
    }
    return false;
  }

  // Returns true when the request was rejected; /api/health stays public for container health checks.
  async function guard(request, response, url) {
    if (url.pathname === "/api/health" || userFrom(request)) return false;
    if (url.pathname.startsWith("/api/")) {
      response.writeHead(401, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ error: { message: "Sign in required." } }));
    } else {
      redirect(response, "/login");
    }
    return true;
  }

  return { enabled: true, handle, guard, userFrom };
}
