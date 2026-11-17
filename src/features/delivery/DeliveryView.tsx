import type { DeliverySnapshot } from '../../data/types';
import { getDeliveryAttention } from '../attention/attention';
import { targetStatus } from '../kpi/kpi-status';
import { AttentionRail } from '../../ui/AttentionRail';
import { KpiTile } from '../../ui/KpiTile';
import { Panel } from '../../ui/Panel';
import { DonutMix } from '../../ui/charts/DonutMix';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import { TrendLine } from '../../ui/charts/TrendLine';

const pct = (value: number): string => value.toFixed(1);

export function DeliveryView({ data }: { data: DeliverySnapshot }) {
  const utilization = data.tripTarget > 0 ? (data.tripCount / data.tripTarget) * 100 : 0;
  const sameDayShare = data.totalLineCount > 0 ? (data.sameDayLineCount / data.totalLineCount) * 100 : 0;
  const mixSegments = [
    { key: 'same', label: 'Same day', count: data.mix.sameDay },
    { key: 'one', label: '1 day', count: data.mix.oneDay },
    { key: 'more', label: 'More than 1 day', count: data.mix.moreThanOneDay },
  ];
  const attention = getDeliveryAttention(data);
  const month = data.monthLabel.split(' ')[0];

  return (
    <section className="surface delivery-view" aria-label="Delivery">
      <h1 className="visually-hidden">Delivery</h1>
      <div className="board-kpi-row">
        <KpiTile
          icon="clock"
          label={`1-day result · ${month}`}
          value={pct(data.oneDayResultPct)}
          unit="%"
          status={targetStatus(data.oneDayResultPct, data.oneDayTargetPct)}
          note={`target ${pct(data.oneDayTargetPct)}%`}
        />
        <KpiTile
          icon="truck"
          label="Trip utilization"
          value={pct(utilization)}
          unit="%"
          status={targetStatus(Number(utilization.toFixed(1)), data.tripUtilizationTargetPct)}
          note={`${data.tripCount} / ${data.tripTarget} trips`}
        />
        <KpiTile
          icon="bolt"
          label="Same-day delivery"
          value={pct(sameDayShare)}
          unit="%"
          note={`${data.sameDayLineCount.toLocaleString('en-GB')} / ${data.totalLineCount.toLocaleString('en-GB')} lines`}
        />
        <KpiTile
          icon="alert"
          label="Transporter issues"
          value={String(data.transporterIssueCount)}
          status={
            data.transporterIssueCount > 0
              ? { tone: 'warning', label: `${data.transporterIssueCount} cases` }
              : { tone: 'success', label: 'None' }
          }
          note={`${data.transporterIssuesYearToDate} year to date`}
        />
      </div>

      <div className="board-panels">
        <AttentionRail signal={attention} />
        <Panel icon="chart" title="1-day result" meta="last 6 months" className="panel-trend">
          <TrendLine
            title="1-day result by month"
            points={data.monthlyTrend}
            suffix="%"
            target={data.oneDayTargetPct}
            formatValue={(value) => value.toFixed(1)}
          />
        </Panel>
        <Panel icon="pin" title="Region result" meta={`target ${pct(data.oneDayTargetPct)}%`} className="panel-status">
          <HorizontalBars
            title={`1-day result by region, ${data.monthLabel}`}
            points={data.regions.map((region) => ({ label: region.region, value: region.oneDayPct }))}
            suffix="%"
            decimals={1}
            belowIsAlert={data.oneDayTargetPct}
          />
        </Panel>
        <Panel icon="pie" title="Delivery mix" meta={month} className="panel-bars">
          <DonutMix segments={mixSegments} centerLabel="same day" />
        </Panel>
        <Panel icon="list" title="Latest transporter cases" meta={`up to ${data.monthLabel}`} className="panel-list">
          {data.recentTransporterIssues.length > 0 ? (
            <ul className="issue-list">
              {data.recentTransporterIssues.slice(0, 4).map((issue) => (
                <li key={`${issue.date}-${issue.issue}-${issue.region}`} className="case-row">
                  <time className="issue-date" dateTime={issue.date}>
                    {issue.date.slice(8)}/{issue.date.slice(5, 7)}
                  </time>
                  <span className="issue-zone">{issue.region}</span>
                  <span className="issue-reason">{issue.issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chart-empty">No transporter cases recorded</p>
          )}
        </Panel>
      </div>
    </section>
  );
}
