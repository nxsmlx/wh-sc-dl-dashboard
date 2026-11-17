import { describe, expect, it } from 'vitest';
import { mapWorkbookRows, monthLabelFrom } from '../workbook-mapping';

const raw = {
  lastUpdatedAt: '2026-11-17T02:15:00.000Z',
  selectedMonth: 46296,
  shipping: {
    lineCount: 12000,
    previousLineCount: 10000,
    issueCount: 24,
    previousIssueCount: 30,
    notYetInvoice: 40,
    notConfirm: 2,
    releaseToInvoicing: 9,
    recentIssues: [
      { date: 46338, workzone: 'WZ 4', reason: 'Wrong parts', detail: 'Relabel' },
      { date: '', workzone: 'WZ 2', reason: 'Extra parts', detail: 'Ignored: no date' },
    ],
    reasonBreakdown: [
      { reason: 'Extra parts', count: 12 },
      { reason: 'Wrong parts', count: 0 },
    ],
    monthlyLines: [
      { month: 46204, lineCount: 9000 },
      { month: 46235, lineCount: 10000 },
    ],
  },
  delivery: {
    oneDayResultPct: 96.4,
    oneDayTargetPct: 95,
    previousOneDayResultPct: 95.1,
    tripCount: 250,
    tripTarget: 270,
    sameDayLineCount: 1100,
    totalLineCount: 1500,
    regions: [
      { region: 'Central', oneDayPct: 99.6, lineCount: 600 },
      { region: '', oneDayPct: 90, lineCount: 10 },
    ],
    transporterIssueCount: 3,
    transporterIssuesYearToDate: 8,
    recentTransporterIssues: [{ date: 46338, issue: 'Lorry breakdown', region: 'Northern' }],
    monthlyTrend: [{ month: 46204, value: 96.7 }],
    lorryPlan: [{ timeSlot: '12:00', lot: 'W1', transporter: 'A', plate: 'BMA 1', arrivalStatus: 'ng' }],
  },
};

describe('monthLabelFrom', () => {
  it('formats an Excel serial month as a readable label', () => {
    expect(monthLabelFrom(46296)).toBe('October 2026');
  });

  it('never invents a label for an invalid month', () => {
    expect(monthLabelFrom(undefined)).toBe('Unknown month');
    expect(monthLabelFrom('nope')).toBe('Unknown month');
  });
});

describe('mapWorkbookRows', () => {
  it('maps aggregates and computes the line delta', () => {
    const snapshot = mapWorkbookRows(raw);
    expect(snapshot.source).toBe('workbook');
    expect(snapshot.shipping.lineCount).toBe(12000);
    expect(snapshot.shipping.lineDeltaPct).toBe(20);
    expect(snapshot.shipping.issueRatePer10k).toBe(20);
  });

  it('drops rows without a valid date instead of faking one', () => {
    const snapshot = mapWorkbookRows(raw);
    expect(snapshot.shipping.recentIssues).toHaveLength(1);
    expect(snapshot.shipping.recentIssues[0].date).toBe('2026-11-12');
  });

  it('keeps optional breakdowns sparse rather than padding them', () => {
    const snapshot = mapWorkbookRows(raw);
    expect(snapshot.shipping.reasonBreakdown).toEqual([{ label: 'Extra parts', value: 12 }]);
    expect(snapshot.delivery.regions).toEqual([{ region: 'Central', oneDayPct: 99.6, lineCount: 600 }]);
  });

  it('normalises the lorry arrival status', () => {
    const snapshot = mapWorkbookRows(raw);
    expect(snapshot.delivery.lorryPlan[0].arrivalStatus).toBe('NG');
  });

  it('fails loudly when a required section is missing', () => {
    expect(() => mapWorkbookRows({ lastUpdatedAt: raw.lastUpdatedAt, selectedMonth: 46296 })).toThrow(
      /missing required fields: shipping, delivery/,
    );
  });
});
