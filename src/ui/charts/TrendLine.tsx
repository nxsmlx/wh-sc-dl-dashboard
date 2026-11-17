import type { SeriesPoint } from '../../data/types';

const WIDTH = 600;
const HEIGHT = 260;
const PAD_X = 40;
const PAD_TOP = 40;
const PAD_BOTTOM = 34;

/**
 * Line chart with every value printed on the chart, so nothing depends on hover.
 * Values are spread across the plot height by design; the printed numbers carry the scale.
 */
export function TrendLine({
  title,
  points,
  suffix = '',
  target,
  formatValue = (value: number) => value.toLocaleString('en-GB'),
}: {
  title: string;
  points: SeriesPoint[];
  suffix?: string;
  target?: number;
  formatValue?: (value: number) => string;
}) {
  if (points.length === 0) {
    return (
      <figure className="trend-chart" aria-label={`${title}: no data`}>
        <p className="chart-empty">No trend data yet</p>
      </figure>
    );
  }

  const values = points.map((point) => point.value);
  const scaleValues = target === undefined ? values : [...values, target];
  const min = Math.min(...scaleValues);
  const max = Math.max(...scaleValues);
  const span = max - min || 1;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const y = (value: number) => PAD_TOP + (1 - (value - min) / span) * plotHeight;
  const x = (index: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (index / (points.length - 1)) * (WIDTH - PAD_X * 2);
  const coords = points.map((point, index) => ({ x: x(index), y: y(point.value) }));
  const first = points[0];
  const last = points[points.length - 1];
  const summary = `${title}: ${first.label} ${formatValue(first.value)}${suffix} to ${last.label} ${formatValue(last.value)}${suffix}`;

  return (
    <figure className="trend-chart" aria-label={summary}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} preserveAspectRatio="xMidYMid meet">
        <line className="grid-line" x1={PAD_X} x2={WIDTH - PAD_X} y1={HEIGHT - PAD_BOTTOM} y2={HEIGHT - PAD_BOTTOM} />
        {target !== undefined ? (
          <>
            <line className="target-line" x1={PAD_X} x2={WIDTH - PAD_X} y1={y(target)} y2={y(target)} />
            <text className="target-label" x={WIDTH - PAD_X} y={y(target) - 8} textAnchor="end">
              Target {formatValue(target)}
              {suffix}
            </text>
          </>
        ) : null}
        <polyline
          points={coords.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke="var(--chrome)"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((point, index) => {
          const isLast = index === coords.length - 1;
          return (
            <g key={points[index].label}>
              <circle cx={point.x} cy={point.y} r={isLast ? 8 : 5} fill={isLast ? 'var(--live)' : 'var(--chrome)'} />
              <text className="point-label" data-last={isLast} x={point.x} y={point.y - 16} textAnchor="middle">
                {formatValue(points[index].value)}
              </text>
              <text className="axis-label" x={point.x} y={HEIGHT - 8} textAnchor="middle">
                {points[index].label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
