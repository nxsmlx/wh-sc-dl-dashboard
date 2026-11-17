import type { SeriesPoint } from '../../data/types';

export function HorizontalBars({
  title,
  points,
  suffix = '',
  decimals = 0,
}: {
  title: string;
  points: SeriesPoint[];
  suffix?: string;
  decimals?: number;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="horizontal-bars" role="group" aria-label={title}>
      {points.length === 0 ? (
        <p className="chart-empty">No breakdown for this month</p>
      ) : (
        <ul className="bar-list">
          {points.map((point) => (
            <li key={point.label} className="bar-row">
              <span className="bar-label">{point.label}</span>
              <span className="bar-track" aria-hidden="true">
                <span className="bar-fill" style={{ width: `${(point.value / max) * 100}%` }} />
              </span>
              <span className="bar-value">
                {point.value.toFixed(decimals)}
                {suffix}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
