import type { StatusCount } from '../data/types';

export function StatusStream({ statuses }: { statuses: StatusCount[] }) {
  return (
    <ul className="status-stream" aria-label="Shipment status">
      {statuses.map((entry) => (
        <li key={entry.status} className="status-item">
          <span className="status-dot" data-tone={entry.tone} aria-hidden="true" />
          <span className="status-name">{entry.status}</span>
          <span className="status-count">{entry.count.toLocaleString('en-GB')}</span>
        </li>
      ))}
    </ul>
  );
}
