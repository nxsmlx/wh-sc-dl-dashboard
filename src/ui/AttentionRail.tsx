import type { AttentionSignal } from '../features/attention/attention';
import { StatusChip } from './StatusChip';

/** The one thing a supervisor should act on, shown as its own panel. */
export function AttentionRail({ signal }: { signal: AttentionSignal }) {
  return (
    <section className="board-panel attention-panel" data-tone={signal.tone} role="status" aria-label="Current attention signal">
      <h2>Action needed</h2>
      <div className="panel-body">
        <StatusChip tone={signal.tone} label={signal.label} />
        <strong className="attention-value">{signal.value}</strong>
        <p className="attention-reason">{signal.reason}</p>
      </div>
    </section>
  );
}
