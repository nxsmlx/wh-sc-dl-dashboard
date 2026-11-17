import type { DeliverySnapshot } from '../../data/types';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import { TrendLine } from '../../ui/charts/TrendLine';
import './delivery-view.css';

const pct = (value: number): string => `${value.toFixed(1)}%`;

export function DeliveryView({ data }: { data: DeliverySnapshot }) {
  const utilization = data.tripTarget > 0 ? (data.tripCount / data.tripTarget) * 100 : 0;
  const sameDayShare = data.totalLineCount > 0 ? (data.sameDayLineCount / data.totalLineCount) * 100 : 0;
  const delta = data.oneDayResultPct - data.previousOneDayResultPct;
  const meetsTarget = data.oneDayResultPct >= data.oneDayTargetPct;
  const mixTotal = Math.max(1, data.mix.sameDay + data.mix.oneDay + data.mix.moreThanOneDay);
  const mixSegments = [
    { key: 'same', label: 'Same day', count: data.mix.sameDay },
    { key: 'one', label: '1 day', count: data.mix.oneDay },
    { key: 'more', label: 'More than 1 day', count: data.mix.moreThanOneDay },
  ];

  return (
    <section className="surface delivery-view">
      <div className="surface-heading">
        <h1 className="surface-title">Delivery</h1>
      </div>

      <div className="del-hero">
        <div className="del-primary">
          <span className="hero-label">1-day delivery result</span>
          <span className="hero-value">{pct(data.oneDayResultPct)}</span>
          <span className="hero-context" data-meets-target={meetsTarget ? 'yes' : 'no'}>
            Target {pct(data.oneDayTargetPct)} · {meetsTarget ? 'above target' : 'below target'} ·{' '}
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)} pts vs last month
          </span>
          <TrendLine title="1-day result by month" points={data.monthlyTrend} suffix="%" />
        </div>

        <dl className="del-figures">
          <div>
            <dt>Trip utilization</dt>
            <dd>{pct(utilization)}</dd>
            <p>
              {data.tripCount.toLocaleString('en-GB')} / {data.tripTarget.toLocaleString('en-GB')} trips
            </p>
          </div>
          <div>
            <dt>Same-day delivery</dt>
            <dd>{pct(sameDayShare)}</dd>
            <p>
              {data.sameDayLineCount.toLocaleString('en-GB')} / {data.totalLineCount.toLocaleString('en-GB')} lines
            </p>
          </div>
        </dl>
      </div>

      <div className="del-lower">
        <section aria-labelledby="delivery-region-heading">
          <h2 id="delivery-region-heading">1-day result by region</h2>
          <HorizontalBars
            title="Achievement this month"
            points={data.regions.map((region) => ({ label: region.region, value: region.oneDayPct }))}
            suffix="%"
            decimals={1}
          />

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

        <section className="del-issues" aria-labelledby="delivery-issues-heading">
          <h2 id="delivery-issues-heading">Transporter issues</h2>
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

          {data.lorryPlan.length > 0 ? (
            <div className="lorry-plan" aria-label="Lorry plan today">
              <p className="chart-title">
                Lorry plan
                <span className="lorry-punctuality">
                  {data.lorryPunctuality.ok} on time · {data.lorryPunctuality.ng} late
                </span>
              </p>
              <ol className="lorry-slots">
                {data.lorryPlan.map((slot) => (
                  <li key={`${slot.timeSlot}-${slot.plate}`} className="lorry-slot">
                    <span className="lorry-time">{slot.timeSlot}</span>
                    <span className="lorry-lot">{slot.lot}</span>
                    <span className="lorry-plate">{slot.plate}</span>
                    <span className="lorry-status" data-status={slot.arrivalStatus}>
                      {slot.arrivalStatus}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
