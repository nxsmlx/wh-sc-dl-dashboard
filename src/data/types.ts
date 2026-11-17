export type WallboardPage = 'shipping' | 'delivery';

export type ThemeName = 'dark' | 'light';

export type Freshness = 'fresh' | 'stale' | 'invalid';

export type StatusTone = 'neutral' | 'warning' | 'danger' | 'success';

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface StatusCount {
  status: string;
  count: number;
  tone: StatusTone;
}

export interface IssueRow {
  date: string;
  workzone: string;
  reason: string;
  detail: string;
}

export interface RegionRow {
  region: string;
  oneDayPct: number;
  lineCount: number;
}

export interface TransporterIssue {
  date: string;
  issue: string;
  region: string;
}

export interface LorryPlanRow {
  timeSlot: string;
  lot: string;
  transporter: string;
  plate: string;
  arrivalStatus: 'OK' | 'NG';
}

export interface ShippingSnapshot {
  monthLabel: string;
  lineCount: number;
  previousLineCount: number;
  lineDeltaPct: number;
  issueCount: number;
  previousIssueCount: number;
  issueRatePer10k: number;
  previousIssueRatePer10k: number;
  qtyVarianceTotal: number;
  shipmentStatuses: StatusCount[];
  recentIssues: IssueRow[];
  reasonBreakdown: SeriesPoint[];
  workzoneBreakdown: SeriesPoint[];
  monthlyLines: SeriesPoint[];
  monthlyIssueRate: SeriesPoint[];
}

export interface DeliveryMix {
  sameDay: number;
  oneDay: number;
  moreThanOneDay: number;
}

export interface DeliverySnapshot {
  monthLabel: string;
  oneDayResultPct: number;
  oneDayTargetPct: number;
  tripUtilizationTargetPct: number;
  previousOneDayResultPct: number;
  tripCount: number;
  tripTarget: number;
  sameDayLineCount: number;
  totalLineCount: number;
  mix: DeliveryMix;
  regions: RegionRow[];
  transporterIssueCount: number;
  transporterIssuesYearToDate: number;
  transporterByType: SeriesPoint[];
  lorryPunctuality: { ok: number; ng: number };
  recentTransporterIssues: TransporterIssue[];
  monthlyTrend: SeriesPoint[];
  lorryPlan: LorryPlanRow[];
}

export interface DashboardSnapshot {
  source: 'demo' | 'workbook';
  lastUpdatedAt: string;
  selectedMonth: string;
  shipping: ShippingSnapshot;
  delivery: DeliverySnapshot;
}
