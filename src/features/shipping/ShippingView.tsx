import type { ShippingSnapshot } from '../../data/types';
import { getShippingAttention } from '../attention/attention';
import { AttentionRail } from '../../ui/AttentionRail';
import { IssueList } from '../../ui/IssueList';
import { StatusStream } from '../../ui/StatusStream';
import { TrendLine } from '../../ui/charts/TrendLine';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import './shipping-view.css';

const number = (value: number): string => value.toLocaleString('en-GB');

export function ShippingView({ data, onDetails }: { data: ShippingSnapshot; onDetails?: () => void }) {
  const issueDirection = data.issueCount - data.previousIssueCount;
  const attention = getShippingAttention(data);

  return (
    <section className="surface shipping-view">
      <div className="surface-heading">
        <h1 className="surface-title">Shipping check</h1>
        <p className="surface-note">Performance · {data.monthLabel}</p>
      </div>

      <div className="board-kpi-row">
        <div className="board-kpi kpi-primary"><span>Lines this month</span><strong>{number(data.lineCount)}</strong><small>{data.lineDeltaPct > 0 ? '+' : ''}{data.lineDeltaPct}% vs last month</small></div>
        <div className="board-kpi"><span>Issues</span><strong>{number(data.issueCount)}</strong><small>{issueDirection > 0 ? '+' : ''}{issueDirection} vs last month</small></div>
        <div className="board-kpi"><span>Issues / 10k</span><strong>{data.issueRatePer10k.toFixed(1)}</strong><small>last month {data.previousIssueRatePer10k.toFixed(1)}</small></div>
        <div className="board-kpi"><span>Quantity variance</span><strong>{number(data.qtyVarianceTotal)}</strong><small>pieces short or extra</small></div>
      </div>

      <div className="board-panels shipping-panels">
        <section className="board-panel board-chart"><h2>Monthly line movement</h2><TrendLine title="Lines by month" points={data.monthlyLines} /></section>
        <section className="board-panel"><h2>Shipment status</h2><StatusStream statuses={data.shipmentStatuses} /></section>
        <section className="board-panel board-attention"><AttentionRail signal={attention} /></section>
        <section className="board-panel"><h2>Issue reasons</h2><HorizontalBars title="Issues this month" points={data.reasonBreakdown} /></section>
        <section className="board-panel"><h2>Priority workzones</h2><HorizontalBars title="Issues this month" points={data.workzoneBreakdown} /></section>
        <section className="board-panel board-wide"><h2>Latest issues</h2><IssueList issues={data.recentIssues} /></section>
      </div>

      <div className="board-actions">
        {onDetails ? <button type="button" className="detail-link" onClick={onDetails}>View operations detail</button> : null}
      </div>

    </section>
  );
}
