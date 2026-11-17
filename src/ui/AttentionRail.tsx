import type { AttentionSignal } from '../features/attention/attention';
import { Icon } from './Icon';
import { StatusChip } from './StatusChip';

/** The one thing a supervisor should act on, shown as the hero card of the board. */
export function AttentionRail({ signal }: { signal: AttentionSignal }) {
  return (
    <section
      className="board-panel glass attention-panel"
      data-tone={signal.tone}
      role="status"
      aria-label="Current attention signal"
    >
      <h2>
        <span className="panel-icon attention-icon">
          <Icon name={signal.tone === 'success' ? 'check' : 'alert'} size={26} />
        </span>
        Action needed
      </h2>
      <div className="panel-body attention-body">
        <StatusChip tone={signal.tone} label={signal.label} />
        <strong className="attention-value">{signal.value}</strong>
        <p className="attention-reason">{signal.reason}</p>
        <span className="attention-orb" aria-hidden="true" />
      </div>
    </section>
  );
}
