#!/usr/bin/env node
/**
 * Wallboard host: serves the built board, a small admin page, and the remote
 * state API that drives notices, forced page and rotation pause.
 *
 * Env:
 *   ADMIN_PASSWORD   required, admin login password
 *   SESSION_SECRET   optional, defaults to a hash of the password
 *   DATA_DIR         optional, defaults to ./data
 *   PORT             optional, defaults to 8080
 */
import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const PORT = Number(process.env.PORT ?? 8080);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const DATA_DIR = resolve(process.env.DATA_DIR ?? 'data');
const STATE_FILE = join(DATA_DIR, 'state.json');
const DIST_DIR = resolve('dist');
const ADMIN_PAGE = resolve('server/admin.html');
const SESSION_SECRET = process.env.SESSION_SECRET ?? createHmac('sha256', 'wallboard').update(ADMIN_PASSWORD).digest('hex');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const COOKIE_NAME = 'wallboard_admin';
const INGEST_TOKEN = process.env.INGEST_TOKEN ?? '';
const MAX_BODY_BYTES = 8 * 1024;
const DASHBOARD_FILE = join(DATA_DIR, 'dashboard.json');
const MAX_DASHBOARD_BYTES = 2 * 1024 * 1024;
const DASHBOARD_REQUIRED = ['lastUpdatedAt', 'selectedMonth', 'shipping', 'delivery'];

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is required');
  process.exit(1);
}

const emptyState = {
  notice: null,
  forcedPage: null,
  paused: false,
  theme: null,
  updatedAt: null,
};

let state = { ...emptyState };
let loginAttempts = new Map();

async function loadState() {
  try {
    const raw = JSON.parse(await readFile(STATE_FILE, 'utf8'));
    state = { ...emptyState, ...sanitize(raw, raw) };
  } catch {
    state = { ...emptyState };
  }
}

function sanitize(input, previous = {}) {
  const output = {};
  if (input && typeof input === 'object') {
    // Partial updates keep the previous value when a field is absent (undefined),
    // so publishing one control never clears the others. Explicit null clears.
    if (input.notice === null) {
      output.notice = null;
    } else if (input.notice && typeof input.notice.text === 'string' && input.notice.text.trim() !== '') {
      output.notice = {
        text: input.notice.text.trim().slice(0, 280),
        expiresAt: typeof input.notice.expiresAt === 'string' ? input.notice.expiresAt : null,
      };
    } else {
      output.notice = previous.notice ?? null;
    }
    output.forcedPage =
      input.forcedPage === undefined
        ? previous.forcedPage ?? null
        : input.forcedPage === 'shipping' || input.forcedPage === 'delivery'
          ? input.forcedPage
          : null;
    output.paused = input.paused === undefined ? previous.paused ?? false : input.paused === true;
    output.theme =
      input.theme === undefined
        ? previous.theme ?? null
        : input.theme === 'dark' || input.theme === 'light'
          ? input.theme
          : null;
    output.updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : null;
  }
  return output;
}

async function saveState() {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STATE_FILE}.tmp`;
  await writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await rename(tmp, STATE_FILE);
}

function sign(value) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function createSession() {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ expires })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function isValidSession(cookieHeader = '') {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) {
    return false;
  }
  const [payload, signature] = match[1].split('.');
  if (!payload || !signature) {
    return false;
  }
  const expected = sign(payload);
  if (expected.length !== signature.length) {
    return false;
  }
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return false;
  }
  try {
    const { expires } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof expires === 'number' && expires > Date.now();
  } catch {
    return false;
  }
}

function passwordMatches(candidate) {
  return safeEqual(String(candidate ?? ''), ADMIN_PASSWORD);
}

/** Constant-time string comparison for tokens and passwords. */
function safeEqual(given, expected) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function rateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) ?? { count: 0, since: now };
  if (now - entry.since > 10 * 60 * 1000) {
    entry.count = 0;
    entry.since = now;
  }
  entry.count += 1;
  loginAttempts.set(ip, entry);
  return entry.count > 10;
}

function json(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  });
  response.end(payload);
}

async function readBody(request, limit = MAX_BODY_BYTES) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      throw new Error('Payload too large');
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

async function serveFile(response, path, cache = 'no-store') {
  try {
    const body = await readFile(path);
    response.writeHead(200, {
      'content-type': MIME[extname(path)] ?? 'application/octet-stream',
      'cache-control': cache,
      'content-length': body.length,
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const path = url.pathname;
  const ip = request.socket.remoteAddress ?? 'unknown';

  try {
    if (path === '/api/state' && request.method === 'GET') {
      return json(response, 200, state);
    }

    if (path === '/api/dashboard' && request.method === 'GET') {
      return serveFile(response, DASHBOARD_FILE);
    }

    if (path === '/api/dashboard' && request.method === 'POST') {
      const token = request.headers['x-ingest-token'];
      if (!INGEST_TOKEN || typeof token !== 'string' || !safeEqual(token, INGEST_TOKEN)) {
        return json(response, 401, { error: 'Invalid ingest token' });
      }
      const body = await readBody(request, MAX_DASHBOARD_BYTES);
      const missing = DASHBOARD_REQUIRED.filter((key) => body?.[key] === undefined || body[key] === null);
      if (missing.length > 0) {
        return json(response, 422, { error: `Snapshot is missing: ${missing.join(', ')}` });
      }
      const incoming = Date.parse(String(body.lastUpdatedAt));
      if (Number.isNaN(incoming)) {
        return json(response, 422, { error: 'Snapshot has an invalid lastUpdatedAt' });
      }
      // A PC that is behind on OneDrive sync must never overwrite fresher data.
      try {
        const existing = JSON.parse(await readFile(DASHBOARD_FILE, 'utf8'));
        const current = Date.parse(String(existing.lastUpdatedAt));
        if (Number.isFinite(current) && incoming <= current) {
          return json(response, 409, {
            error: 'Snapshot is older than the one already stored',
            stored: existing.lastUpdatedAt,
          });
        }
      } catch {
        // No snapshot yet: accept the first upload.
      }
      await mkdir(DATA_DIR, { recursive: true });
      const temporary = `${DASHBOARD_FILE}.tmp`;
      await writeFile(temporary, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
      await rename(temporary, DASHBOARD_FILE);
      return json(response, 200, { ok: true, stored: body.lastUpdatedAt });
    }

    if (path === '/api/login' && request.method === 'POST') {
      if (rateLimited(ip)) {
        return json(response, 429, { error: 'Too many attempts. Try again later.' });
      }
      const body = await readBody(request);
      if (!passwordMatches(body.password)) {
        return json(response, 401, { error: 'Wrong password' });
      }
      loginAttempts.delete(ip);
      response.setHeader(
        'set-cookie',
        `${COOKIE_NAME}=${createSession()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
      );
      return json(response, 200, { ok: true });
    }

    if (path === '/api/logout' && request.method === 'POST') {
      response.setHeader('set-cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
      return json(response, 200, { ok: true });
    }

    if (path === '/api/state' && request.method === 'POST') {
      if (!isValidSession(request.headers.cookie)) {
        return json(response, 401, { error: 'Not signed in' });
      }
      const body = await readBody(request);
      state = { ...sanitize(body, state), updatedAt: new Date().toISOString() };
      await saveState();
      return json(response, 200, state);
    }

    if (path === '/admin' || path === '/admin/') {
      return serveFile(response, ADMIN_PAGE);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json(response, 405, { error: 'Method not allowed' });
    }

    if (path === '/' || path === '/index.html') {
      return serveFile(response, join(DIST_DIR, 'index.html'));
    }

    const filePath = resolve(join(DIST_DIR, path));
    if (!filePath.startsWith(DIST_DIR)) {
      response.writeHead(403);
      return response.end('Forbidden');
    }
    return serveFile(response, filePath);
  } catch (error) {
    console.error(`request failed: ${error instanceof Error ? error.message : String(error)}`);
    return json(response, 400, { error: 'Bad request' });
  }
});

await loadState();
server.listen(PORT, () => {
  console.log(`Wallboard listening on http://0.0.0.0:${PORT}`);
});
