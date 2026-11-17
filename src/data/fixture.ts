import type { DashboardSnapshot } from './types';

/**
 * Sanitised demo snapshot. Values mirror the shape of the workbook dashboard,
 * but names, part numbers and issue rows are synthetic. Never replace this with
 * live operational data inside the repository.
 */
export const demoSnapshot: DashboardSnapshot = {
  source: 'demo',
  lastUpdatedAt: '2026-11-17T02:15:00.000Z',
  selectedMonth: '2026-11-01',
  shipping: {
    monthLabel: 'November 2026',
    lineCount: 14650,
    previousLineCount: 15851,
    lineDeltaPct: -7.6,
    issueCount: 27,
    previousIssueCount: 29,
    issueRatePer10k: 18.4,
    previousIssueRatePer10k: 18.3,
    qtyVarianceTotal: 96,
    shipmentStatuses: [
      { status: 'Not yet invoice', count: 60, tone: 'warning' },
      { status: 'Not confirm', count: 1, tone: 'danger' },
      { status: 'Release to invoicing', count: 11, tone: 'neutral' },
    ],
    recentIssues: [
      { date: '2026-11-17', workzone: 'WZ 4', reason: 'Wrong parts', detail: 'Label mismatch, racking back to workzone' },
      { date: '2026-11-17', workzone: 'WZ 2', reason: 'Extra parts', detail: 'Picking back part number' },
      { date: '2026-11-16', workzone: 'WZ 7', reason: 'Extra parts', detail: 'Returned to workzone' },
      { date: '2026-11-16', workzone: 'Sorting', reason: 'Shortage', detail: 'Quantity variance 15 lines' },
      { date: '2026-11-15', workzone: 'WZ 4', reason: 'Mix parts', detail: 'Sorting at S/C 3' },
    ],
    reasonBreakdown: [
      { label: 'Extra parts', value: 12 },
      { label: 'Wrong parts', value: 8 },
      { label: 'Shortage', value: 7 },
      { label: 'Mix parts', value: 0 },
      { label: 'Rusty', value: 0 },
    ],
    workzoneBreakdown: [
      { label: 'WZ 4', value: 14 },
      { label: 'WZ 2', value: 6 },
      { label: 'WZ 7', value: 4 },
      { label: 'Sorting', value: 3 },
    ],
    monthlyLines: [
      { label: 'Jun', value: 11328 },
      { label: 'Jul', value: 12040 },
      { label: 'Aug', value: 13610 },
      { label: 'Sep', value: 12890 },
      { label: 'Oct', value: 15851 },
      { label: 'Nov', value: 14650 },
    ],
    monthlyIssueRate: [
      { label: 'Jun', value: 13.1 },
      { label: 'Jul', value: 14.2 },
      { label: 'Aug', value: 12.8 },
      { label: 'Sep', value: 15.0 },
      { label: 'Oct', value: 18.3 },
      { label: 'Nov', value: 18.4 },
    ],
  },
  delivery: {
    monthLabel: 'November 2026',
    oneDayResultPct: 97.1,
    oneDayTargetPct: 95,
    tripUtilizationTargetPct: 100,
    previousOneDayResultPct: 95.3,
    tripCount: 262,
    tripTarget: 270,
    sameDayLineCount: 1196,
    totalLineCount: 1626,
    mix: { sameDay: 1196, oneDay: 383, moreThanOneDay: 47 },
    regions: [
      { region: 'Central', oneDayPct: 99.6, lineCount: 642 },
      { region: 'Northern', oneDayPct: 99.6, lineCount: 318 },
      { region: 'Southern', oneDayPct: 95.1, lineCount: 402 },
      { region: 'East Coast', oneDayPct: 85.6, lineCount: 264 },
    ],
    transporterIssueCount: 3,
    transporterIssuesYearToDate: 8,
    transporterByType: [
      { label: 'Lorry breakdown', value: 2 },
      { label: 'Late arrival', value: 1 },
      { label: 'Insufficient lorry', value: 0 },
    ],
    lorryPunctuality: { ok: 5, ng: 3 },
    recentTransporterIssues: [
      { date: '2026-11-14', issue: 'Lorry breakdown', region: 'Northern' },
      { date: '2026-11-09', issue: 'Late arrival', region: 'Southern' },
      { date: '2026-11-04', issue: 'Lorry breakdown', region: 'East Coast' },
    ],
    monthlyTrend: [
      { label: 'Jun', value: 96.7 },
      { label: 'Jul', value: 95.1 },
      { label: 'Aug', value: 96.6 },
      { label: 'Sep', value: 94.5 },
      { label: 'Oct', value: 95.3 },
      { label: 'Nov', value: 97.1 },
    ],
    lorryPlan: [
      { timeSlot: '12:00', lot: 'W1', transporter: 'Transporter A', plate: 'BMA 1001', arrivalStatus: 'OK' },
      { timeSlot: '13:45', lot: 'W1', transporter: 'Transporter A', plate: 'BMB 2002', arrivalStatus: 'NG' },
      { timeSlot: '14:45', lot: 'W2', transporter: 'Transporter B', plate: 'BMC 3003', arrivalStatus: 'OK' },
      { timeSlot: '17:00', lot: 'W3,4,7', transporter: 'Transporter C', plate: 'BMD 4004', arrivalStatus: 'OK' },
    ],
  },
};
