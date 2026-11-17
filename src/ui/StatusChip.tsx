import type { StatusTone } from '../data/types';

const ICON: Record<StatusTone, string> = {
  success: 'M4.5 12.5l4.5 4.5L19.5 6.5',
  warning: 'M12 4.5v9M12 18.5v.5',
  danger: 'M12 4.5v9M12 18.5v.5',
  neutral: 'M6 12h12',
};

/** A solid status cell: icon plus word, so the state never depends on colour alone. */
export function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span className="status-chip" data-tone={tone}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={ICON[tone]} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}
