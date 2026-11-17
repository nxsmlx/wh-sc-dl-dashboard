import type { Freshness } from './types';

export const DEFAULT_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

/** Classify how trustworthy a snapshot timestamp is for a wallboard that must never show silent stale data. */
export function getFreshness(
  lastUpdatedAt: string,
  now: Date,
  staleAfterMs: number = DEFAULT_STALE_AFTER_MS,
): Freshness {
  const updated = Date.parse(lastUpdatedAt);
  if (Number.isNaN(updated)) {
    return 'invalid';
  }
  const age = now.getTime() - updated;
  if (age < -FUTURE_TOLERANCE_MS) {
    return 'invalid';
  }
  return age > staleAfterMs ? 'stale' : 'fresh';
}

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Convert an Excel serial day number or an ISO/date string to an ISO date string.
 * Returns null for blanks and invalid values so a missing date can never become a fake one.
 */
export function normalizeExcelDate(value: number | string | Date | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 1 || value > 2_958_465) {
      return null;
    }
    return new Date(EXCEL_EPOCH_UTC + Math.round(value) * DAY_MS).toISOString().slice(0, 10);
  }
  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return normalizeExcelDate(Number(trimmed));
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString().slice(0, 10);
}
