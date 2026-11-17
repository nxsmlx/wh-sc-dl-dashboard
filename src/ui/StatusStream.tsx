import type { StatusCount } from '../data/types';
import { Icon, type IconName } from './Icon';

const ICON: Record<StatusCount['tone'], IconName> = {
  success: 'check',
  warning: 'bang',
  danger: 'bang',
  neutral: 'dash',
};

/** Each status is a tile: tone icon, big count, and the status name as the word. */
export function StatusStream({ statuses }: { statuses: StatusCount[] }) {
  return (
    <ul className="status-stream" aria-label="Shipment status">
      {statuses.map((entry) => (
        <li key={entry.status} className="status-item" data-tone={entry.tone}>
          <span className="status-dot" aria-hidden="true">
            <Icon name={ICON[entry.tone]} size={20} strokeWidth={3.2} />
          </span>
          <span className="status-count">{entry.count.toLocaleString('en-GB')}</span>
          <span className="status-name">{entry.status}</span>
        </li>
      ))}
    </ul>
  );
}
