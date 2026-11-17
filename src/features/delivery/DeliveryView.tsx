import type { DeliverySnapshot } from '../../data/types';
import { getDeliveryAttention } from '../attention/attention';
import { AttentionRail } from '../../ui/AttentionRail';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import { TrendLine } from '../../ui/charts/TrendLine';
import './delivery-view.css';

const pct = (value: number): string => `${value.toFixed(1)}%`;

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

  return (
    <section className="surface delivery-view">
      <div className="surface-heading">
        <h1 className="surface-title">Delivery</h1>
        <p className="surface-note">Performance · {data.monthLabel}</p>
      </div>

      <div className="board-kpi-row">
        <div className="board-kpi kpi-primary"><span>1-day result</span><strong>{pct(data.oneDayResultPct)}</strong><small>target {pct(data.oneDayTargetPct)}</small></div>
        <div className="board-kpi"><span>Trip utilization</span><strong>{pct(utilization)}</strong><small>{data.tripCount} / {data.tripTarget} trips</small></div>
        <div className="board-kpi"><span>Same-day delivery</span><strong>{pct(sameDayShare)}</strong><small>{data.sameDayLineCount.toLocaleString('en-GB')} / {data.totalLineCount.toLocaleString('en-GB')} lines</small></div>
        <div className="board-kpi"><span>Transporter issues</span><strong>{data.transporterIssueCount}</strong><small>{data.transporterIssuesYearToDate} year to date</small></div>
      </div>

      <div className="board-panels delivery-panels">
        <section className="board-panel board-chart"><h2>1-day result movement</h2><TrendLine title="1-day result by month" points={data.monthlyTrend} suffix="%" /></section>
        <section className="board-panel"><h2>Region performance</h2>
          <HorizontalBars
            title="Achievement this month"
            points={data.regions.map((region) => ({ label: region.region, value: region.oneDayPct }))}
            suffix="%"
            decimals={1}
          />
        </section>
        <section className="board-panel board-attention"><AttentionRail signal={attention} /></section>
        <section className="board-panel"><h2>Delivery mix</h2>
          <div className="del-mix">
            <p className="chart-title">Delivery mix</p>
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
        <section className="board-panel"><h2>Transporter issues</h2>
          <p className="del-issue-count">
            {data.transporterIssueCount} this month · {data.transporterIssuesYearToDate} year to date
          </p>
          {data.transporterByType.length > 0 ? (
            <p className="issue-types">
              {data.transporterByType.map((type) => `${type.label} ${type.value}`).join(' · ')}
            </p>
          ) : null}
          {data.recentTransporterIssues.length > 0 ? (
            <ul className="issue-list">
              {data.recentTransporterIssues.map((issue) => (
                <li key={`${issue.date}-${issue.issue}-${issue.region}`} className="issue-row">
                  <time className="issue-date" dateTime={issue.date}>
                    {issue.date.slice(5)}
                  </time>
                  <span className="issue-zone">{issue.region}</span>
                  <span className="issue-detail">{issue.issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chart-empty">No transporter issues logged</p>
          )}

        </section>
      </div>
      <div className="board-actions">{onDetails ? <button type="button" className="detail-link" onClick={onDetails}>View operations detail</button> : null}</div>
    </section>
  );
}
