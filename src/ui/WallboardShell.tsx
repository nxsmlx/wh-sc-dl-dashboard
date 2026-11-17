import { useEffect, useState, type ReactNode } from 'react';
import type { Freshness, ThemeName, WallboardPage } from '../data/types';
import type { RotationState } from '../features/rotation/rotation';
import { FullscreenToggle } from './FullscreenToggle';
import { Icon } from './Icon';
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

function useClock(): { time: string; date: string } {
  const read = () => {
    const now = new Date();
    return {
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now),
      date: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).format(now),
    };
  };
  const [clock, setClock] = useState(read);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(read()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return clock;
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
  /** Extra items for the bottom rail, e.g. the demo-data note and the detail button. */
  footerExtra?: ReactNode;
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
  footerExtra,
  children,
}: WallboardShellProps) {
  const clock = useClock();
  const updatedLabel = freshness === 'fresh' ? 'Workbook updated' : 'Workbook not updated since';

  return (
    <div className="wallboard" data-theme={theme} data-page={page}>
      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob aurora-1" />
        <span className="aurora-blob aurora-2" />
        <span className="aurora-blob aurora-3" />
      </div>

      <header className="rail-top">
        <span className="rail-brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="box" size={30} strokeWidth={2.2} />
          </span>
          <span className="brand-text">
            <span className="brand-name">WH Outbound</span>
            <span className="brand-sub">Operations board</span>
          </span>
        </span>
        <nav className="page-nav" aria-label="Wallboard pages" data-active={page}>
          <span className="page-nav-indicator" aria-hidden="true" />
          {(['shipping', 'delivery'] as WallboardPage[]).map((value) => (
            <button
              key={value}
              type="button"
              className="page-tab"
              aria-current={page === value ? 'page' : undefined}
              onClick={() => onSelectPage(value)}
            >
              <Icon name={value === 'shipping' ? 'box' : 'truck'} size={24} />
              {PAGE_LABEL[value]}
            </button>
          ))}
        </nav>
        <div className="rail-meta">
          <span className="rail-chip rail-period">
            <Icon name="calendar" size={22} />
            <span>Report: {monthLabel}</span>
          </span>
          <span className="rail-chip rail-updated" data-freshness={freshness}>
            <span className="fresh-dot" aria-hidden="true" />
            <span>
              {updatedLabel} <time dateTime={lastUpdatedAt}>{formatUpdated(lastUpdatedAt)}</time>
            </span>
          </span>
          <span className="rail-time">
            <span className="rail-clock" aria-label="Current time">
              {clock.time}
            </span>
            <span className="rail-date">{clock.date}</span>
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
        extra={footerExtra}
      />
    </div>
  );
}
