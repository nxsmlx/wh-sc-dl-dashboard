import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PORT = 8177;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'test-pass-123';

let child;
let dataDir;
let cookie = '';

async function api(path, options = {}) {
  const headers = { 'content-type': 'application/json', ...(options.headers ?? {}) };
  if (cookie) {
    headers.cookie = cookie;
  }
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }
  return { status: response.status, body: await response.json().catch(() => null) };
}

beforeAll(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'wh-admin-'));
  child = spawn('node', [resolve('server/index.mjs')], {
    env: { ...process.env, ADMIN_PASSWORD: PASSWORD, PORT: String(PORT), DATA_DIR: dataDir },
    stdio: 'ignore',
    detached: false,
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await api('/api/state');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('admin test server did not start');
}, 30_000);

afterAll(async () => {
  child?.kill();
  await rm(dataDir, { recursive: true, force: true });
});

describe('admin auth', () => {
  it('rejects a wrong password', async () => {
    const { status, body } = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    expect(status).toBe(401);
    expect(body.error).toMatch(/wrong password/i);
  });

  it('accepts the real password and issues a session', async () => {
    const { status, body } = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password: PASSWORD }),
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(cookie).toContain('wallboard_admin=');
  });

  it('refuses anonymous publishes', async () => {
    const saved = cookie;
    cookie = '';
    const { status, body } = await api('/api/state', {
      method: 'POST',
      body: JSON.stringify({ paused: true }),
    });
    cookie = saved;
    expect(status).toBe(401);
    expect(body.error).toMatch(/not signed in/i);
  });
});

describe('admin state', () => {
  it('keeps a partial publish from clearing other controls', async () => {
    await api('/api/state', {
      method: 'POST',
      body: JSON.stringify({ notice: { text: 'Meeting 3pm', expiresAt: null } }),
    });
    const { body } = await api('/api/state', {
      method: 'POST',
      body: JSON.stringify({ paused: true }),
    });
    expect(body.paused).toBe(true);
    expect(body.notice?.text).toBe('Meeting 3pm');
  });

  it('rejects invalid field values without touching the rest', async () => {
    const { body } = await api('/api/state', {
      method: 'POST',
      body: JSON.stringify({ forcedPage: 'kitchen', theme: 'purple' }),
    });
    expect(body.forcedPage).toBeNull();
    expect(body.theme).toBeNull();
    expect(body.paused).toBe(true);
    expect(body.notice?.text).toBe('Meeting 3pm');
  });

  it('clears a notice only when it is explicitly cleared', async () => {
    const { body } = await api('/api/state', {
      method: 'POST',
      body: JSON.stringify({ notice: null, paused: true }),
    });
    expect(body.notice).toBeNull();
    expect(body.paused).toBe(true);
  });

  it('persists published state to disk for the next start', async () => {
    await api('/api/state', {
      method: 'POST',
      body: JSON.stringify({ forcedPage: 'delivery', notice: { text: 'Saved', expiresAt: null } }),
    });
    const saved = JSON.parse(await readFile(join(dataDir, 'state.json'), 'utf8'));
    expect(saved.forcedPage).toBe('delivery');
    expect(saved.notice.text).toBe('Saved');
  });
});
