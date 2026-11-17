export function DataState({
  state,
  message,
  lastUpdatedAt,
  onRetry,
}: {
  state: 'loading' | 'empty' | 'stale' | 'partial' | 'error';
  message?: string;
  lastUpdatedAt?: string;
  onRetry?: () => void;
}) {
  const title: Record<typeof state, string> = {
    loading: 'Loading dashboard',
    empty: 'No data for this month',
    stale: 'Data has not refreshed',
    partial: 'Some sections are unavailable',
    error: 'Dashboard data failed to load',
  };

  return (
    <section className="data-state" aria-live="polite" data-state={state}>
      <h2>{title[state]}</h2>
      <p>
        {message ??
          (state === 'loading'
            ? 'Reading the latest snapshot.'
            : 'Check the workbook update and try again.')}
      </p>
      {lastUpdatedAt ? (
        <p>
          Last updated <time dateTime={lastUpdatedAt}>{lastUpdatedAt}</time>
        </p>
      ) : null}
      {onRetry ? (
        <button type="button" className="theme-toggle" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </section>
  );
}
