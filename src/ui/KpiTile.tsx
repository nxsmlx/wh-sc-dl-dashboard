import type { ReactNode } from 'react';
import type { StatusTone } from '../data/types';
import { StatusChip } from './StatusChip';

export function KpiTile({
  label,
  value,
  unit,
  status,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  status?: { tone: StatusTone; label: string };
  note?: ReactNode;
}) {
  return (
    <div className="board-kpi" data-tone={status?.tone}>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">
        {value}
        {unit ? <small>{unit}</small> : null}
      </strong>
      <span className="kpi-note">
        {status ? <StatusChip tone={status.tone} label={status.label} /> : null}
        {note}
      </span>
    </div>
  );
}
