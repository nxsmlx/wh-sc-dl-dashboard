import type { ReactNode } from 'react';
import type { StatusTone } from '../data/types';
import { Icon, type IconName } from './Icon';
import { StatusChip } from './StatusChip';

export function KpiTile({
  label,
  value,
  unit,
  icon,
  status,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: IconName;
  status?: { tone: StatusTone; label: string };
  note?: ReactNode;
}) {
  return (
    <div className="board-kpi glass" data-tone={status?.tone}>
      <span className="kpi-head">
        {icon ? (
          <span className="kpi-icon">
            <Icon name={icon} size={26} />
          </span>
        ) : null}
        <span className="kpi-label">{label}</span>
      </span>
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
