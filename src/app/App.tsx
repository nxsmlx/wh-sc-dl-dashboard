import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createDefaultDataSource, type DashboardDataSource } from '../data/data-source';
import { getFreshness } from '../data/freshness';
import { activeNotice, useRemoteState } from '../data/remote-state';
import type { DashboardSnapshot } from '../data/types';
import { ROTATION_DURATION_MS } from '../features/rotation/rotation';
import { useRotation } from '../features/rotation/use-rotation';
import { DeliveryView } from '../features/delivery/DeliveryView';
import { ShippingView } from '../features/shipping/ShippingView';
import { OperationsDetail } from '../features/detail/OperationsDetail';
import { DataState } from '../ui/DataState';
import { WallboardShell } from '../ui/WallboardShell';
import { useTheme } from '../ui/ThemeToggle';
import '../styles/stage.css';

export interface AppProps {
  dataSource?: DashboardDataSource;
  durationMs?: number;
  staleAfterMs?: number;
  remotePollMs?: number;
}

export function App({
  dataSource,
  durationMs = ROTATION_DURATION_MS,
  staleAfterMs = 24 * 60 * 60 * 1000,
  remotePollMs,
}: AppProps) {
  const source = useMemo(() => dataSource ?? createDefaultDataSource(), [dataSource]);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const initialPage = useMemo(() => {
    const requested = new URLSearchParams(window.location.search).get('page');
    return requested === 'delivery' ? 'delivery' : 'shipping';
  }, []);
  const rotation = useRotation({ durationMs, initialPage });
  const { remote } = useRemoteState('/api/state', remotePollMs);

  useEffect(() => {
    if (remote.forcedPage && remote.forcedPage !== rotation.page) {
      rotation.select(remote.forcedPage);
    }
  }, [remote.forcedPage, rotation.page]);

  useEffect(() => {
    if (!isDetailOpen && remote.paused !== rotation.isPaused) {
      rotation.togglePause();
    }
  }, [isDetailOpen, remote.paused, rotation.isPaused]);

  useEffect(() => {
    if (isDetailOpen && !rotation.isPaused) {
      rotation.togglePause();
    }
  }, [isDetailOpen, rotation.isPaused]);

  useEffect(() => {
    if (remote.theme && remote.theme !== theme) {
      setTheme(remote.theme);
    }
  }, [remote.theme, theme, setTheme]);
  const stage = (content: ReactNode) => (
    <div className="stage-viewport">
      <div className="stage">
        {content}
      </div>
    </div>
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSnapshot(await source.load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unknown data error');
    } finally {
      setIsLoading(false);
    }
  }, [source]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading && !snapshot) {
    return stage(<DataState state="loading" />);
  }

  if (!snapshot) {
    return stage(
      <DataState
        state="error"
        message={error ?? 'No snapshot was returned.'}
        onRetry={() => {
          void load();
        }}
      />,
    );
  }

  const freshness = getFreshness(snapshot.lastUpdatedAt, new Date(), staleAfterMs);
  const notice = activeNotice(remote);
  const activePage = remote.forcedPage ?? rotation.page;
  const isShipping = activePage === 'shipping';
  const monthLabel = isShipping ? snapshot.shipping.monthLabel : snapshot.delivery.monthLabel;

  return stage(
    <WallboardShell
      page={activePage}
      rotation={rotation}
      durationMs={durationMs}
      freshness={freshness}
      lastUpdatedAt={snapshot.lastUpdatedAt}
      monthLabel={monthLabel}
      theme={theme}
      onThemeChange={setTheme}
      onSelectPage={(page) => {
        if (page !== rotation.page) {
          rotation.next();
        }
      }}
      onNext={rotation.next}
      onPrevious={rotation.previous}
      onTogglePause={rotation.togglePause}
    >
      {notice ? (
        <aside className="notice-banner" role="status">
          <span className="notice-label">Notice</span>
          <p>{notice.text}</p>
        </aside>
      ) : null}
      {freshness === 'stale' ? (
        <p className="stale-banner" role="status">
          Showing data from {new Date(snapshot.lastUpdatedAt).toLocaleString('en-GB')}. Update the workbook to refresh.
        </p>
      ) : null}
      {snapshot.source === 'demo' ? (
        <p className="demo-banner" role="note">
          Demo data. Run <code>npm run data:import</code> to load the workbook.
        </p>
      ) : null}
      {isDetailOpen ? (
        <OperationsDetail
          page={activePage}
          snapshot={snapshot}
          onBack={() => {
            setIsDetailOpen(false);
          }}
        />
      ) : isShipping ? (
        <ShippingView data={snapshot.shipping} onDetails={() => setIsDetailOpen(true)} />
      ) : (
        <DeliveryView data={snapshot.delivery} onDetails={() => setIsDetailOpen(true)} />
      )}
    </WallboardShell>,
  );
}
