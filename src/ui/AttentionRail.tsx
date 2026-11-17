import type { AttentionSignal } from '../features/attention/attention';

export function AttentionRail({ signal }: { signal: AttentionSignal }) {
  return (
    <aside className="attention-rail" data-tone={signal.tone} role="status" aria-label="Current attention signal">
      <span className="attention-marker" aria-hidden="true" />
      <span className="attention-label">{signal.label}</span>
      <strong className="attention-value">{signal.value}</strong>
      <span className="attention-reason">{signal.reason}</span>
    </aside>
  );
}
