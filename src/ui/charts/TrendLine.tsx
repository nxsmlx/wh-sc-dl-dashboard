import { useId } from 'react';
import type { SeriesPoint } from '../../data/types';

const WIDTH = 640;
const HEIGHT = 250;
const PAD_X = 44;
const PAD_TOP = 46;
const PAD_BOTTOM = 36;

/**
 * Area-line chart with every value printed on the chart, so nothing depends on hover.
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
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

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
  const baseline = HEIGHT - PAD_BOTTOM;
  const plotHeight = baseline - PAD_TOP;
  const y = (value: number) => PAD_TOP + (1 - (value - min) / span) * plotHeight * 0.86;
  const x = (index: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (index / (points.length - 1)) * (WIDTH - PAD_X * 2);
  const coords = points.map((point, index) => ({ x: x(index), y: y(point.value) }));
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `M${coords[0].x},${baseline} L${line.replace(/ /g, ' L')} L${coords[coords.length - 1].x},${baseline} Z`;
  const first = points[0];
  const last = points[points.length - 1];
  const summary = `${title}: ${first.label} ${formatValue(first.value)}${suffix} to ${last.label} ${formatValue(last.value)}${suffix}`;

  return (
    <figure className="trend-chart" aria-label={summary}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`area-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chrome)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="var(--chrome)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--chrome)" />
            <stop offset="100%" stopColor="var(--live)" />
          </linearGradient>
        </defs>
        {coords.map((point, index) => (
          <line key={`g-${points[index].label}`} className="grid-line" x1={point.x} x2={point.x} y1={PAD_TOP - 10} y2={baseline} />
        ))}
        <line className="grid-line baseline" x1={PAD_X - 20} x2={WIDTH - PAD_X + 20} y1={baseline} y2={baseline} />
        <path d={area} fill={`url(#area-${uid})`} />
        {target !== undefined ? (
          <>
            <line className="target-line" x1={PAD_X - 20} x2={WIDTH - PAD_X + 20} y1={y(target)} y2={y(target)} />
            <text className="target-label" x={WIDTH - PAD_X + 20} y={y(target) + 24} textAnchor="end">
              Target {formatValue(target)}
              {suffix}
            </text>
          </>
        ) : null}
        <polyline
          points={line}
          fill="none"
          stroke={`url(#stroke-${uid})`}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((point, index) => {
          const isLast = index === coords.length - 1;
          return (
            <g key={points[index].label}>
              {isLast ? <circle className="point-halo" cx={point.x} cy={point.y} r={16} /> : null}
              <circle
                className="point-dot"
                data-last={isLast}
                cx={point.x}
                cy={point.y}
                r={isLast ? 8 : 6}
              />
              <text className="point-label" data-last={isLast} x={point.x} y={point.y - 18} textAnchor="middle">
                {formatValue(points[index].value)}
              </text>
              <text className="axis-label" data-last={isLast} x={point.x} y={HEIGHT - 6} textAnchor="middle">
                {points[index].label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
