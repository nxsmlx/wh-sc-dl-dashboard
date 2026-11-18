import { describe, expect, it } from 'vitest';
import { isStable, isNewer, pickSource } from './workbook-watch-rules.mjs';

describe('isStable', () => {
  it('waits until two consecutive checks report the same size and mtime', () => {
    const a = { size: 300, mtimeMs: 1000 };
    const b = { size: 300, mtimeMs: 1000 };
    expect(isStable(a, b)).toBe(true);
  });

  it('treats a file that is still being written as unstable', () => {
    expect(isStable({ size: 300, mtimeMs: 1000 }, { size: 420, mtimeMs: 1200 })).toBe(false);
    expect(isStable({ size: 300, mtimeMs: 1000 }, { size: 300, mtimeMs: 1200 })).toBe(false);
  });

  it('treats a missing file as unstable', () => {
    expect(isStable(null, { size: 300, mtimeMs: 1000 })).toBe(false);
  });
});

describe('isNewer', () => {
  it('accepts a workbook saved after the last successful import', () => {
    expect(isNewer({ size: 300, mtimeMs: 2000 }, 1000)).toBe(true);
  });

  it('skips a workbook older than or equal to the last import', () => {
    expect(isNewer({ size: 300, mtimeMs: 1000 }, 1000)).toBe(false);
    expect(isNewer({ size: 300, mtimeMs: 900 }, 1000)).toBe(false);
  });
});

describe('pickSource', () => {
  const older = { path: 'office', mtimeMs: 1000 };
  const newer = { path: 'wsl', mtimeMs: 2000 };

  it('picks the newest workbook when several PCs sync the same folder', () => {
    expect(pickSource([older, newer])?.path).toBe('wsl');
    expect(pickSource([newer, older])?.path).toBe('wsl');
  });

  it('ignores missing sources', () => {
    expect(pickSource([null, newer])?.path).toBe('wsl');
  });

  it('returns null when nothing is readable', () => {
    expect(pickSource([null, undefined])).toBeNull();
  });
});
