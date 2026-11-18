import type { SeriesPoint } from '../../data/types';

export function HorizontalBars({
  title,
  points,
  suffix = '',
  decimals = 0,
  belowIsAlert,
}: {
  title: string;
  points: SeriesPoint[];
  suffix?: string;
  decimals?: number;
  /** Values below this threshold are flagged as an alert, e.g. a region under its delivery target. */
  belowIsAlert?: number;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="horizontal-bars" role="group" aria-label={title}>
      {points.length === 0 ? (
        <p className="chart-empty">No breakdown for this month</p>
      ) : (
        <ul className="bar-list">
          {points.map((point) => {
            const isAlert = belowIsAlert !== undefined && point.value < belowIsAlert;
            return (
              <li key={point.label} className="bar-row" data-tone={isAlert ? 'danger' : undefined}>
                <span className="bar-name">
                  <span className="bar-label">{point.label}</span>
                  {isAlert ? <span className="bar-flag">Below</span> : null}
                </span>
                <span className="bar-track" aria-hidden="true">
                  <span className="bar-fill" style={{ width: `${Math.max(point.value > 0 ? 2 : 0, (point.value / max) * 100)}%` }} />
                </span>
                <span className="bar-value">
                  {point.value.toFixed(decimals)}
                  {suffix}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
