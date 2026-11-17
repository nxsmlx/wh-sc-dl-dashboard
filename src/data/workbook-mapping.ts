import { normalizeExcelDate } from './freshness';
import type {
  DashboardSnapshot,
  DeliverySnapshot,
  IssueRow,
  RegionRow,
  SeriesPoint,
  ShippingSnapshot,
  StatusCount,
} from './types';

/** Intermediate shape produced by the build-time workbook reader. All fields are optional so gaps are explicit. */
export interface RawWorkbookData {
  lastUpdatedAt?: string;
  selectedMonth?: number | string;
  shipping?: {
    lineCount?: number;
    previousLineCount?: number;
    issueCount?: number;
    previousIssueCount?: number;
    issueRatePer10k?: number;
    previousIssueRatePer10k?: number;
    qtyVarianceTotal?: number;
    notYetInvoice?: number;
    notConfirm?: number;
    releaseToInvoicing?: number;
    recentIssues?: { date?: number | string; workzone?: string; reason?: string; detail?: string }[];
    reasonBreakdown?: { reason?: string; count?: number }[];
    workzoneBreakdown?: { workzone?: string; count?: number }[];
    monthlyLines?: { month?: number | string; lineCount?: number }[];
    monthlyIssueRate?: { month?: number | string; value?: number }[];
  };
  delivery?: {
    oneDayResultPct?: number;
    oneDayTargetPct?: number;
    tripUtilizationTargetPct?: number;
    previousOneDayResultPct?: number;
    tripCount?: number;
    tripTarget?: number;
    sameDayLineCount?: number;
    totalLineCount?: number;
    mix?: { sameDay?: number; oneDay?: number; moreThanOneDay?: number };
    regions?: { region?: string; oneDayPct?: number; lineCount?: number }[];
    transporterIssueCount?: number;
    transporterIssuesYearToDate?: number;
    transporterByType?: { issue?: string; count?: number }[];
    lorryPunctuality?: { ok?: number; ng?: number };
    recentTransporterIssues?: { date?: number | string; issue?: string; region?: string }[];
    monthlyTrend?: { month?: number | string; value?: number }[];
    lorryPlan?: {
      timeSlot?: string;
      lot?: string;
      transporter?: string;
      plate?: string;
      arrivalStatus?: string;
    }[];
  };
}

export function monthLabelFrom(value: number | string | undefined): string {
  const iso = normalizeExcelDate(value);
  if (!iso) {
    return 'Unknown month';
  }
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00.000Z`),
  );
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function mapIssues(rows: RawWorkbookData['shipping'] extends undefined ? never : NonNullable<RawWorkbookData['shipping']>['recentIssues']): IssueRow[] {
  return (rows ?? [])
    .map((row) => {
      const date = normalizeExcelDate(row.date);
      if (!date) {
        return null;
      }
      return {
        date,
        workzone: row.workzone?.trim() || 'Unassigned',
        reason: row.reason?.trim() || 'Unknown',
        detail: row.detail?.trim() || 'No remark',
      };
    })
    .filter((row): row is IssueRow => row !== null);
}

function mapSeries(rows: RawWorkbookData['shipping'] extends undefined ? never : NonNullable<RawWorkbookData['shipping']>['monthlyLines']): SeriesPoint[] {
  return (rows ?? [])
    .map((row) => {
      const label = monthLabelFrom(row.month);
      return label === 'Unknown month' ? null : { label: label.slice(0, 3), value: toNumber(row.lineCount) };
    })
    .filter((point): point is SeriesPoint => point !== null);
}

function mapShipping(raw: NonNullable<RawWorkbookData['shipping']>): ShippingSnapshot {
  const lineCount = toNumber(raw.lineCount);
  const previousLineCount = toNumber(raw.previousLineCount);
  const issueCount = toNumber(raw.issueCount);
  const previousIssueCount = toNumber(raw.previousIssueCount);
  const computedRate = lineCount > 0 ? (issueCount / lineCount) * 10_000 : 0;
  const statuses: StatusCount[] = [
    { status: 'Not yet invoice', count: toNumber(raw.notYetInvoice), tone: 'warning' },
    { status: 'Not confirm', count: toNumber(raw.notConfirm), tone: 'danger' },
    { status: 'Release to invoicing', count: toNumber(raw.releaseToInvoicing), tone: 'neutral' },
  ];
  return {
    monthLabel: 'Current month',
    lineCount,
    previousLineCount,
    lineDeltaPct: percentChange(lineCount, previousLineCount),
    issueCount,
    previousIssueCount,
    issueRatePer10k: Number(toNumber(raw.issueRatePer10k, computedRate).toFixed(1)),
    previousIssueRatePer10k: toNumber(raw.previousIssueRatePer10k),
    qtyVarianceTotal: toNumber(raw.qtyVarianceTotal),
    shipmentStatuses: statuses,
    recentIssues: mapIssues(raw.recentIssues),
    reasonBreakdown: (raw.reasonBreakdown ?? [])
      .map((row) => ({ label: row.reason?.trim() || 'Unknown', value: toNumber(row.count) }))
      .filter((row) => row.value > 0),
    workzoneBreakdown: (raw.workzoneBreakdown ?? [])
      .map((row) => ({ label: row.workzone?.trim() || 'Unknown', value: toNumber(row.count) }))
      .filter((row) => row.value > 0),
    monthlyLines: mapSeries(raw.monthlyLines),
    monthlyIssueRate: (raw.monthlyIssueRate ?? [])
      .map((row) => {
        const label = monthLabelFrom(row.month);
        return label === 'Unknown month' ? null : { label: label.slice(0, 3), value: toNumber(row.value) };
      })
      .filter((point): point is SeriesPoint => point !== null),
  };
}

function mapDelivery(raw: NonNullable<RawWorkbookData['delivery']>): DeliverySnapshot {
  const regions: RegionRow[] = (raw.regions ?? [])
    .map((row) => ({
      region: row.region?.trim() || 'Unknown',
      oneDayPct: toNumber(row.oneDayPct),
      lineCount: toNumber(row.lineCount),
    }))
    .filter((row) => row.region !== 'Unknown');
  return {
    monthLabel: 'Current month',
    oneDayResultPct: toNumber(raw.oneDayResultPct),
    oneDayTargetPct: toNumber(raw.oneDayTargetPct, 95),
    tripUtilizationTargetPct: toNumber(raw.tripUtilizationTargetPct, 100),
    previousOneDayResultPct: toNumber(raw.previousOneDayResultPct),
    tripCount: toNumber(raw.tripCount),
    tripTarget: toNumber(raw.tripTarget),
    sameDayLineCount: toNumber(raw.sameDayLineCount),
    totalLineCount: toNumber(raw.totalLineCount),
    mix: {
      sameDay: toNumber(raw.mix?.sameDay, toNumber(raw.sameDayLineCount)),
      oneDay: toNumber(raw.mix?.oneDay),
      moreThanOneDay: toNumber(raw.mix?.moreThanOneDay),
    },
    regions,
    transporterIssueCount: toNumber(raw.transporterIssueCount),
    transporterIssuesYearToDate: toNumber(raw.transporterIssuesYearToDate),
    transporterByType: (raw.transporterByType ?? [])
      .map((row) => ({ label: row.issue?.trim() || 'Unknown', value: toNumber(row.count) }))
      .filter((row) => row.value > 0),
    lorryPunctuality: {
      ok: toNumber(raw.lorryPunctuality?.ok),
      ng: toNumber(raw.lorryPunctuality?.ng),
    },
    recentTransporterIssues: (raw.recentTransporterIssues ?? [])
      .map((row) => {
        const date = normalizeExcelDate(row.date);
        return date
          ? { date, issue: row.issue?.trim() || 'Unknown issue', region: row.region?.trim() || 'Unknown region' }
          : null;
      })
      .filter((row): row is { date: string; issue: string; region: string } => row !== null),
    monthlyTrend: (raw.monthlyTrend ?? [])
      .map((row) => {
        const label = monthLabelFrom(row.month);
        return label === 'Unknown month' ? null : { label: label.slice(0, 3), value: toNumber(row.value) };
      })
      .filter((point): point is SeriesPoint => point !== null),
    lorryPlan: (raw.lorryPlan ?? []).map((row) => ({
      timeSlot: row.timeSlot?.trim() || '--:--',
      lot: row.lot?.trim() || '-',
      transporter: row.transporter?.trim() || '-',
      plate: row.plate?.trim() || '-',
      arrivalStatus: row.arrivalStatus?.trim().toUpperCase() === 'NG' ? 'NG' : 'OK',
    })),
  };
}

/**
 * Convert raw workbook rows into the public snapshot. Required sections are validated so a
 * silently empty dashboard is impossible; optional breakdowns degrade to empty arrays.
 */
export function mapWorkbookRows(raw: RawWorkbookData, now: Date = new Date()): DashboardSnapshot {
  const missing: string[] = [];
  if (raw.lastUpdatedAt === undefined) missing.push('lastUpdatedAt');
  if (raw.selectedMonth === undefined) missing.push('selectedMonth');
  if (raw.shipping === undefined) missing.push('shipping');
  if (raw.delivery === undefined) missing.push('delivery');
  if (missing.length > 0) {
    throw new Error(`Workbook data is missing required fields: ${missing.join(', ')}`);
  }

  const shipping = mapShipping(raw.shipping!);
  const delivery = mapDelivery(raw.delivery!);
  const monthLabel = monthLabelFrom(raw.selectedMonth);
  shipping.monthLabel = monthLabel;
  delivery.monthLabel = monthLabel;

  return {
    source: 'workbook',
    lastUpdatedAt: raw.lastUpdatedAt!,
    selectedMonth: normalizeExcelDate(raw.selectedMonth) ?? now.toISOString().slice(0, 10),
    shipping,
    delivery,
  };
}
