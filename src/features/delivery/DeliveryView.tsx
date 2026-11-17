import type { DeliverySnapshot } from '../../data/types';
import { getDeliveryAttention } from '../attention/attention';
import { targetStatus } from '../kpi/kpi-status';
import { AttentionRail } from '../../ui/AttentionRail';
import { KpiTile } from '../../ui/KpiTile';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import { TrendLine } from '../../ui/charts/TrendLine';

const pct = (value: number): string => value.toFixed(1);

export function DeliveryView({ data, onDetails }: { data: DeliverySnapshot; onDetails?: () => void }) {
  const utilization = data.tripTarget > 0 ? (data.tripCount / data.tripTarget) * 100 : 0;
  const sameDayShare = data.totalLineCount > 0 ? (data.sameDayLineCount / data.totalLineCount) * 100 : 0;
  const mixTotal = Math.max(1, data.mix.sameDay + data.mix.oneDay + data.mix.moreThanOneDay);
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
          label={`1-day result · ${month}`}
          value={pct(data.oneDayResultPct)}
          unit="%"
          status={targetStatus(data.oneDayResultPct, data.oneDayTargetPct)}
          note={`target ${pct(data.oneDayTargetPct)}%`}
        />
        <KpiTile
          label="Trip utilization"
          value={pct(utilization)}
          unit="%"
          status={targetStatus(Number(utilization.toFixed(1)), data.tripUtilizationTargetPct)}
          note={`${data.tripCount} / ${data.tripTarget} trips`}
        />
        <KpiTile
          label="Same-day delivery"
          value={pct(sameDayShare)}
          unit="%"
          note={`${data.sameDayLineCount.toLocaleString('en-GB')} / ${data.totalLineCount.toLocaleString('en-GB')} lines`}
        />
        <KpiTile
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
        <section className="board-panel">
          <h2>
            1-day result<small>last 6 months</small>
          </h2>
          <div className="panel-body">
            <TrendLine
              title="1-day result by month"
              points={data.monthlyTrend}
              suffix="%"
              target={data.oneDayTargetPct}
              formatValue={(value) => value.toFixed(1)}
            />
          </div>
        </section>
        <section className="board-panel">
          <h2>
            Region result<small>target {pct(data.oneDayTargetPct)}%</small>
          </h2>
          <div className="panel-body">
            <HorizontalBars
              title={`1-day result by region, ${data.monthLabel}`}
              points={data.regions.map((region) => ({ label: region.region, value: region.oneDayPct }))}
              suffix="%"
              decimals={1}
              belowIsAlert={data.oneDayTargetPct}
            />
          </div>
        </section>
        <AttentionRail signal={attention} />
        <section className="board-panel">
          <h2>
            Delivery mix<small>{month}</small>
          </h2>
          <div className="panel-body">
            <div
              className="mix-bar"
              role="img"
              aria-label={mixSegments
                .map((segment) => `${segment.label} ${segment.count} (${((segment.count / mixTotal) * 100).toFixed(1)}%)`)
                .join(', ')}
            >
              {mixSegments.map((segment) => (
                <span
                  key={segment.key}
                  className="mix-segment"
                  data-segment={segment.key}
                  style={{ width: `${(segment.count / mixTotal) * 100}%` }}
                />
              ))}
            </div>
            <ul className="mix-legend">
              {mixSegments.map((segment) => (
                <li key={segment.key}>
                  <span className="mix-dot" data-segment={segment.key} aria-hidden="true" />
                  <span>{segment.label}</span>
                  <strong>{segment.count.toLocaleString('en-GB')}</strong>
                  <span className="mix-pct">{((segment.count / mixTotal) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="board-panel board-wide">
          <h2>
            Latest transporter cases<small>up to {data.monthLabel}</small>
          </h2>
          <div className="panel-body">
            {data.recentTransporterIssues.length > 0 ? (
              <ul className="issue-list">
                {data.recentTransporterIssues.map((issue) => (
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
