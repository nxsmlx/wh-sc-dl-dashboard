import type { StatusTone } from '../data/types';
import { Icon, type IconName } from './Icon';

const ICON: Record<StatusTone, IconName> = {
  success: 'check',
  warning: 'bang',
  danger: 'bang',
  neutral: 'dash',
};

/** A status pill: icon plus word, so the state never depends on colour alone. */
export function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span className="status-chip" data-tone={tone}>
      <span className="status-chip-icon">
        <Icon name={ICON[tone]} size={16} strokeWidth={3.4} />
      </span>
      {label}
    </span>
  );
}
