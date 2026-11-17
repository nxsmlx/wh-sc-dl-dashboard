import type { ShippingSnapshot } from '../../data/types';
import { getShippingAttention } from '../attention/attention';
import { lowerIsBetter } from '../kpi/kpi-status';
import { AttentionRail } from '../../ui/AttentionRail';
import { IssueList } from '../../ui/IssueList';
import { KpiTile } from '../../ui/KpiTile';
import { StatusStream } from '../../ui/StatusStream';
import { TrendLine } from '../../ui/charts/TrendLine';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';

const number = (value: number): string => value.toLocaleString('en-GB');

export function ShippingView({ data, onDetails }: { data: ShippingSnapshot; onDetails?: () => void }) {
  const attention = getShippingAttention(data);
  const month = data.monthLabel.split(' ')[0];
  const lineChange = `${data.lineDeltaPct > 0 ? '+' : ''}${data.lineDeltaPct}% vs last month`;

  return (
    <section className="surface shipping-view" aria-label="Shipping check">
      <h1 className="visually-hidden">Shipping check</h1>
      <div className="board-kpi-row">
        <KpiTile label={`Lines · ${month}`} value={number(data.lineCount)} note={lineChange} />
        <KpiTile
          label="Issues"
          value={number(data.issueCount)}
          status={lowerIsBetter(data.issueCount, data.previousIssueCount)}
        />
        <KpiTile
          label="Issues per 10k lines"
          value={data.issueRatePer10k.toFixed(1)}
          status={lowerIsBetter(data.issueRatePer10k, data.previousIssueRatePer10k, 1)}
        />
        <KpiTile label="Quantity variance" value={number(data.qtyVarianceTotal)} unit="pcs" note="short or extra" />
      </div>

      <div className="board-panels">
        <section className="board-panel">
          <h2>
            Line volume<small>last 6 months</small>
          </h2>
          <div className="panel-body">
            <TrendLine title="Lines by month" points={data.monthlyLines} />
          </div>
        </section>
        <section className="board-panel">
          <h2>
            Shipment status<small>now</small>
          </h2>
          <div className="panel-body">
            <StatusStream statuses={data.shipmentStatuses} />
          </div>
        </section>
        <AttentionRail signal={attention} />
        <section className="board-panel">
          <h2>
            Issues by reason<small>{month}</small>
          </h2>
          <div className="panel-body">
            <HorizontalBars title={`Issues by reason, ${data.monthLabel}`} points={data.reasonBreakdown} />
          </div>
        </section>
        <section className="board-panel board-wide">
          <h2>
            Latest issues<small>{data.monthLabel}</small>
          </h2>
          <div className="panel-body">
            <IssueList issues={data.recentIssues.slice(0, 4)} />
          </div>
        </section>
      </div>

      {onDetails ? (
        <div className="board-actions">
          <button type="button" className="detail-link" onClick={onDetails}>
            View operations detail
          </button>
        </div>
      ) : null}
    </section>
  );
}
