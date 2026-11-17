import type { ReactNode } from 'react';
import type { Freshness, ThemeName, WallboardPage } from '../data/types';
import type { RotationState } from '../features/rotation/rotation';
import { ThemeToggle } from './ThemeToggle';
import { RotationRail } from './RotationRail';

const PAGE_LABEL: Record<WallboardPage, string> = {
  shipping: 'Shipping check',
  delivery: 'Delivery',
};

const FRESHNESS_LABEL: Record<Freshness, string> = {
  fresh: 'Fresh',
  stale: 'Stale data',
  invalid: 'Unknown timestamp',
};

function formatUpdated(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '--:--';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

export interface WallboardShellProps {
  page: WallboardPage;
  rotation: RotationState;
  durationMs: number;
  freshness: Freshness;
  lastUpdatedAt: string;
  monthLabel: string;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  onSelectPage: (page: WallboardPage) => void;
  onNext: () => void;
  onPrevious: () => void;
  onTogglePause: () => void;
  children: ReactNode;
}

export function WallboardShell({
  page,
  rotation,
  durationMs,
  freshness,
  lastUpdatedAt,
  monthLabel,
  theme,
  onThemeChange,
  onSelectPage,
  onNext,
  onPrevious,
  onTogglePause,
  children,
}: WallboardShellProps) {
  return (
    <div className="wallboard" data-theme={theme}>
      <header className="rail-top">
        <span className="rail-brand">
          WH <strong>/ OUTBOUND</strong>
        </span>
        <nav className="page-nav" aria-label="Wallboard pages">
          {(['shipping', 'delivery'] as WallboardPage[]).map((value) => (
            <button
              key={value}
              type="button"
              className="page-tab"
              aria-current={page === value ? 'page' : undefined}
              onClick={() => onSelectPage(value)}
            >
              {PAGE_LABEL[value]}
            </button>
          ))}
        </nav>
        <div className="rail-meta">
          <span>{monthLabel}</span>
          <span data-freshness={freshness}>
            {FRESHNESS_LABEL[freshness]} · <time dateTime={lastUpdatedAt}>{formatUpdated(lastUpdatedAt)}</time>
          </span>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </header>

      <main className="wallboard-main" aria-label={`${PAGE_LABEL[page]} wallboard`}>
        {children}
      </main>

      <RotationRail
        rotation={rotation}
        durationMs={durationMs}
        onNext={onNext}
        onPrevious={onPrevious}
        onTogglePause={onTogglePause}
      />
    </div>
  );
}
