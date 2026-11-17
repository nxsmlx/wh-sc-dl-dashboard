import { describe, expect, it } from 'vitest';
import { getFreshness, normalizeExcelDate } from '../freshness';

const NOW = new Date('2026-11-17T10:00:00.000Z');

describe('normalizeExcelDate', () => {
  it('converts an Excel serial day number to an ISO date', () => {
    expect(normalizeExcelDate(46296)).toBe('2026-10-01');
  });

  it('keeps an ISO date', () => {
    expect(normalizeExcelDate('2026-11-05')).toBe('2026-11-05');
  });

  it('returns null for blanks', () => {
    expect(normalizeExcelDate('')).toBeNull();
    expect(normalizeExcelDate(null)).toBeNull();
    expect(normalizeExcelDate(undefined)).toBeNull();
  });

  it('returns null instead of guessing an invalid value', () => {
    expect(normalizeExcelDate('not a date')).toBeNull();
    expect(normalizeExcelDate(Number.NaN)).toBeNull();
    expect(normalizeExcelDate(-4)).toBeNull();
    expect(normalizeExcelDate(new Date('invalid'))).toBeNull();
  });
});

describe('getFreshness', () => {
  it('marks a recent timestamp fresh', () => {
    expect(getFreshness('2026-11-17T09:00:00.000Z', NOW, 24 * 60 * 60 * 1000)).toBe('fresh');
  });

  it('marks an old timestamp stale', () => {
    expect(getFreshness('2026-11-15T09:00:00.000Z', NOW, 24 * 60 * 60 * 1000)).toBe('stale');
  });

  it('marks an unparseable timestamp invalid', () => {
    expect(getFreshness('nope', NOW)).toBe('invalid');
  });

  it('rejects a timestamp far in the future', () => {
    expect(getFreshness('2026-11-19T10:00:00.000Z', NOW)).toBe('invalid');
  });
});
