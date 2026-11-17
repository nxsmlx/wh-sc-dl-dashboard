import { useEffect, useState, type ReactNode } from 'react';
import type { Freshness, ThemeName, WallboardPage } from '../data/types';
import type { RotationState } from '../features/rotation/rotation';
import { FullscreenToggle } from './FullscreenToggle';
import { ThemeToggle } from './ThemeToggle';
import { RotationRail } from './RotationRail';

const PAGE_LABEL: Record<WallboardPage, string> = {
  shipping: 'Shipping check',
  delivery: 'Delivery',
};

function formatUpdated(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return 'unknown';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

function useClock(): string {
  const format = () =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const [time, setTime] = useState(format);
  useEffect(() => {
    const timer = window.setInterval(() => setTime(format()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return time;
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
  const clock = useClock();
  const updatedLabel = freshness === 'fresh' ? 'Workbook updated' : 'Workbook not updated since';

  return (
    <div className="wallboard" data-theme={theme}>
      <header className="rail-top">
        <span className="rail-brand">
          WH <strong>Outbound</strong>
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
          <span className="rail-period">Report: {monthLabel}</span>
          <span className="rail-updated" data-freshness={freshness}>
            {updatedLabel} <time dateTime={lastUpdatedAt}>{formatUpdated(lastUpdatedAt)}</time>
          </span>
          <span className="rail-clock" aria-label="Current time">
            {clock}
          </span>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <FullscreenToggle />
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
