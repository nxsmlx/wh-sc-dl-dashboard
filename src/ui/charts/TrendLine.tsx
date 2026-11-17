import type { SeriesPoint } from '../../data/types';

const WIDTH = 320;
const HEIGHT = 88;
const PAD = 6;

function buildPoints(points: SeriesPoint[]): { x: number; y: number }[] {
  if (points.length === 0) {
    return [];
  }
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return points.map((point, index) => {
    const x = points.length === 1 ? WIDTH / 2 : PAD + (index / (points.length - 1)) * (WIDTH - PAD * 2);
    const y = HEIGHT - PAD - ((point.value - min) / span) * (HEIGHT - PAD * 2);
    return { x, y };
  });
}

export function TrendLine({
  title,
  points,
  suffix = '',
}: {
  title: string;
  points: SeriesPoint[];
  suffix?: string;
}) {
  const coords = buildPoints(points);
  const line = coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const area = coords.length
    ? `M ${coords[0].x} ${HEIGHT} L ${coords.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${
        coords[coords.length - 1].x
      } ${HEIGHT} Z`
    : '';
  const last = points[points.length - 1];
  const first = points[0];
  const summary =
    points.length === 0
      ? `${title}: no data`
      : `${title}: ${first.label} ${first.value}${suffix} to ${last.label} ${last.value}${suffix}`;

  return (
    <figure className="trend-line" aria-label={summary}>
      <figcaption className="trend-caption">
        <span>{title}</span>
        <span className="trend-endpoint">
          {last ? `${last.label} ${last.value}${suffix}` : 'No data'}
        </span>
      </figcaption>
      {coords.length > 0 ? (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} preserveAspectRatio="none">
          <path d={area} fill="var(--accent)" opacity="0.14" />
          <polyline
            points={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3" fill="var(--accent)" />
        </svg>
      ) : (
        <p className="chart-empty">No trend data yet</p>
      )}
      <ol className="trend-axis">
        {points.map((point) => (
          <li key={point.label}>
            <span>{point.label}</span>
            <span className="chart-value">
              {point.value}
              {suffix}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
