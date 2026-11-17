import { describe, expect, it } from 'vitest';
import { latestForMonth, readTargets, sentenceCase } from './workbook-rules.mjs';

describe('sentenceCase', () => {
  it('turns shouted remarks into sentence case', () => {
    expect(sentenceCase('RACKING BACK TO WORKZONE')).toBe('Racking back to workzone');
  });

  it('turns title case into sentence case', () => {
    expect(sentenceCase('Lorry Breakdown')).toBe('Lorry breakdown');
  });

  it('keeps words that carry digits, such as part numbers', () => {
    expect(sentenceCase('WRONG LABEL B74-E3300-00')).toBe('Wrong label B74-E3300-00');
  });

  it('returns an empty string for blanks', () => {
    expect(sentenceCase('')).toBe('');
    expect(sentenceCase(null)).toBe('');
  });
});

describe('readTargets', () => {
  it('reads the official targets from the Lists KPI table as percentages', () => {
    const rows = [
      { 'kpi target': '1-Day Delivery %', value: 0.95 },
      { 'kpi target': 'Trip Utilization %', value: 1 },
      { 'kpi target': null, value: null },
    ];
    expect(readTargets(rows)).toEqual({ oneDayPct: 95, tripUtilizationPct: 100 });
  });

  it('fails loudly when a target is missing instead of inventing one', () => {
    expect(() => readTargets([{ 'kpi target': '1-Day Delivery %', value: 0.95 }])).toThrow(
      /Trip Utilization %/,
    );
  });
});

describe('latestForMonth', () => {
  const rows = [
    { date: '2026-11-15', id: 'nov-15' },
    { date: '2026-10-29', id: 'oct-29' },
    { date: '2026-10-02', id: 'oct-02' },
    { date: '2026-10-17', id: 'oct-17' },
  ];

  it('keeps only rows from the reporting month, newest first', () => {
    expect(latestForMonth(rows, '2026-10', 5).map((row) => row.id)).toEqual(['oct-29', 'oct-17', 'oct-02']);
  });

  it('limits the number of rows', () => {
    expect(latestForMonth(rows, '2026-10', 2)).toHaveLength(2);
  });
});
