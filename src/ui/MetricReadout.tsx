import type { StatusTone } from '../data/types';

export function MetricReadout({
  label,
  value,
  context,
  tone = 'neutral',
  size = 'default',
}: {
  label: string;
  value: string;
  context?: string;
  tone?: StatusTone;
  size?: 'default' | 'large';
}) {
  return (
    <div className="metric-readout">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={size === 'large' ? { fontSize: 'clamp(3rem, 6vw, 5.5rem)' } : undefined}>
        {value}
      </span>
      {context ? (
        <span className="metric-context" data-tone={tone === 'neutral' ? undefined : tone}>
          {context}
        </span>
      ) : null}
    </div>
  );
}
