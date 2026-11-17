export interface MixSegment {
  key: string;
  label: string;
  count: number;
}

const SIZE = 220;
const STROKE = 30;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4;

/** Donut with its share printed in the legend beside it, so no value needs hover. */
export function DonutMix({ segments, centerLabel }: { segments: MixSegment[]; centerLabel: string }) {
  const total = Math.max(1, segments.reduce((sum, segment) => sum + segment.count, 0));
  const shown = segments.filter((segment) => segment.count > 0).length;
  let offset = 0;
  const share = (count: number) => ((count / total) * 100).toFixed(1);

  return (
    <div className="mix">
      <div
        className="mix-donut"
        role="img"
        aria-label={segments.map((segment) => `${segment.label} ${segment.count} (${share(segment.count)}%)`).join(', ')}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className="mix-ring" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} fill="none" />
          {segments.map((segment) => {
            const length = (segment.count / total) * CIRCUMFERENCE;
            const visible = Math.max(0, length - (shown > 1 ? GAP : 0));
            const dash = `${visible} ${CIRCUMFERENCE - visible}`;
            const node = (
              <circle
                key={segment.key}
                className="mix-arc"
                data-segment={segment.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            );
            offset += length;
            return segment.count > 0 ? node : null;
          })}
        </svg>
        <span className="mix-center">
          <strong>{share(segments[0]?.count ?? 0)}%</strong>
          <span>{centerLabel}</span>
        </span>
      </div>
      <ul className="mix-legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className="mix-dot" data-segment={segment.key} aria-hidden="true" />
            <span className="mix-name">{segment.label}</span>
            <strong>{segment.count.toLocaleString('en-GB')}</strong>
            <span className="mix-pct">{share(segment.count)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
