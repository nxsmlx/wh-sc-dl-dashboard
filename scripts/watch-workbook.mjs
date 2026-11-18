#!/usr/bin/env node
/**
 * Workbook watcher: watches the OneDrive workbook, imports it when it changes
 * and posts the result to the wallboard server.
 *
 * Design notes (learned the hard way):
 *  - OneDrive may still be writing when the mtime changes, so a file is only
 *    imported after two consecutive samples agree.
 *  - A workbook that fails to import is never sent; the server keeps the last
 *    good snapshot, so the board never shows a half-empty dashboard.
 *  - The server rejects snapshots older than the one it holds, so a PC that is
 *    behind on sync cannot overwrite fresher data.
 *
 * Env:
 *   WORKBOOK           path to the .xlsx (required)
 *   INGEST_URL         e.g. https://wh.example.com/api/dashboard (required)
 *   INGEST_TOKEN       shared token the server expects (required)
 *   INTERVAL_SECONDS   poll interval, default 30
 *   LOG_FILE           default ./logs/workbook-watch.log
 *   STATE_FILE         remembers the last imported mtime, default ./logs/watch-state.json
 */
import { appendFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { isNewer, isStable } from './workbook-watch-rules.mjs';

const INTERVAL_SECONDS = Number(process.env.INTERVAL_SECONDS ?? 30);
const WORKBOOK = process.env.WORKBOOK ? resolve(process.env.WORKBOOK) : '';
const INGEST_URL = process.env.INGEST_URL ?? '';
const INGEST_TOKEN = process.env.INGEST_TOKEN ?? '';
const LOG_FILE = resolve(process.env.LOG_FILE ?? 'logs/workbook-watch.log');
const STATE_FILE = resolve(process.env.STATE_FILE ?? 'logs/watch-state.json');

if (!WORKBOOK || !INGEST_URL || !INGEST_TOKEN) {
  console.error('WORKBOOK, INGEST_URL and INGEST_TOKEN are required');
  process.exit(1);
}

async function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  await mkdir(dirname(LOG_FILE), { recursive: true });
  await appendFile(LOG_FILE, line, 'utf8');
}

async function sample() {
  try {
    const info = await stat(WORKBOOK);
    return { size: info.size, mtimeMs: info.mtimeMs };
  } catch {
    return null;
  }
}

async function readLastImported() {
  try {
    return Number(JSON.parse(await readFile(STATE_FILE, 'utf8')).mtimeMs) || 0;
  } catch {
    return 0;
  }
}

async function rememberImported(mtimeMs) {
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, `${JSON.stringify({ mtimeMs })}\n`, 'utf8');
}

async function importWorkbook() {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const output = resolve('src/data/generated-dashboard.json');
  await run(process.execPath, ['scripts/import-workbook.mjs', '--input', WORKBOOK], { cwd: resolve('.') });
  return JSON.parse(await readFile(output, 'utf8'));
}

async function upload(snapshot) {
  const response = await fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-ingest-token': INGEST_TOKEN },
    body: JSON.stringify(snapshot),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

let previous = null;
let busy = false;

async function tick() {
  if (busy) {
    return;
  }
  busy = true;
  try {
    const current = await sample();
    if (!current) {
      previous = null;
      return;
    }
    const stable = isStable(previous, current);
    previous = current;
    if (!stable) {
      return;
    }

    const lastImported = await readLastImported();
    if (!isNewer(current, lastImported)) {
      return;
    }

    await log(`change detected (mtime ${new Date(current.mtimeMs).toISOString()}), importing`);
    let snapshot;
    try {
      snapshot = await importWorkbook();
    } catch (error) {
      await log(`IMPORT FAILED, keeping previous data: ${error.message}`);
      previous = null;
      return;
    }

    const result = await upload(snapshot);
    if (result.status === 200) {
      await rememberImported(current.mtimeMs);
      await log(`uploaded ${snapshot.lastUpdatedAt} (${result.status})`);
    } else if (result.status === 409) {
      await rememberImported(current.mtimeMs);
      await log(`server already has newer data, skipped local copy (${result.body.stored ?? ''})`);
    } else {
      await log(`UPLOAD FAILED ${result.status}: ${result.body.error ?? 'unknown'}`);
    }
  } catch (error) {
    await log(`watcher error: ${error.message}`);
  } finally {
    busy = false;
  }
}

await log(`watcher started: ${WORKBOOK} every ${INTERVAL_SECONDS}s`);
await tick();
setInterval(() => void tick(), INTERVAL_SECONDS * 1000);
