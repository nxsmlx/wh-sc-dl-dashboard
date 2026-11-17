import type { ShippingSnapshot } from '../../data/types';
import { getShippingAttention } from '../attention/attention';
import { lowerIsBetter } from '../kpi/kpi-status';
import { AttentionRail } from '../../ui/AttentionRail';
import { IssueList } from '../../ui/IssueList';
import { KpiTile } from '../../ui/KpiTile';
import { Panel } from '../../ui/Panel';
import { StatusStream } from '../../ui/StatusStream';
import { TrendLine } from '../../ui/charts/TrendLine';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';

const number = (value: number): string => value.toLocaleString('en-GB');

export function ShippingView({ data }: { data: ShippingSnapshot }) {
  const attention = getShippingAttention(data);
  const month = data.monthLabel.split(' ')[0];
  const lineChange = `${data.lineDeltaPct > 0 ? '+' : ''}${data.lineDeltaPct}% vs last month`;

  return (
    <section className="surface shipping-view" aria-label="Shipping check">
      <h1 className="visually-hidden">Shipping check</h1>
      <div className="board-kpi-row">
        <KpiTile icon="layers" label={`Lines · ${month}`} value={number(data.lineCount)} note={lineChange} />
        <KpiTile
          icon="alert"
          label="Issues"
          value={number(data.issueCount)}
          status={lowerIsBetter(data.issueCount, data.previousIssueCount)}
        />
        <KpiTile
          icon="gauge"
          label="Issues per 10k lines"
          value={data.issueRatePer10k.toFixed(1)}
          status={lowerIsBetter(data.issueRatePer10k, data.previousIssueRatePer10k, 1)}
        />
        <KpiTile icon="scale" label="Quantity variance" value={number(data.qtyVarianceTotal)} unit="pcs" note="short or extra" />
      </div>

      <div className="board-panels">
        <AttentionRail signal={attention} />
        <Panel icon="chart" title="Line volume" meta="last 6 months" className="panel-trend">
          <TrendLine title="Lines by month" points={data.monthlyLines} />
        </Panel>
        <Panel icon="box" title="Shipment status" meta="now" className="panel-status">
          <StatusStream statuses={data.shipmentStatuses} />
        </Panel>
        <Panel icon="alert" title="Issues by reason" meta={month} className="panel-bars">
          <HorizontalBars title={`Issues by reason, ${data.monthLabel}`} points={data.reasonBreakdown} />
        </Panel>
        <Panel icon="list" title="Latest issues" meta={data.monthLabel} className="panel-list">
          <IssueList issues={data.recentIssues.slice(0, 4)} />
        </Panel>
      </div>
    </section>
  );
}
