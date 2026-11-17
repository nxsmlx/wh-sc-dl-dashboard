import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WallboardShell } from './WallboardShell';
import { initialRotationState } from '../features/rotation/rotation';

function renderShell(overrides: Partial<Parameters<typeof WallboardShell>[0]> = {}) {
  return render(
    <WallboardShell
      page="shipping"
      rotation={initialRotationState}
      durationMs={30_000}
      freshness="fresh"
      lastUpdatedAt="2026-11-17T02:15:00.000Z"
      monthLabel="November 2026"
      theme="dark"
      onThemeChange={() => {}}
      onSelectPage={() => {}}
      onNext={() => {}}
      onPrevious={() => {}}
      onTogglePause={() => {}}
      {...overrides}
    >
      <p>Surface content</p>
    </WallboardShell>,
  );
}

describe('WallboardShell', () => {
  it('exposes the active page, month, freshness and rotation progress', () => {
    renderShell({ rotation: { ...initialRotationState, elapsedMs: 15_000 } });

    expect(screen.getByRole('button', { name: 'Shipping check' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    expect(screen.getByText(/Fresh/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '15');
    expect(screen.getByText(/15s/)).toBeInTheDocument();
  });

  it('names the manual controls for keyboard and screen-reader use', () => {
    renderShell();

    expect(screen.getByRole('button', { name: 'Show previous page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show next page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('reflects the selected theme', () => {
    renderShell({ theme: 'light' });
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });

  it('shows the stale label when data is stale', () => {
    renderShell({ freshness: 'stale' });
    expect(screen.getByText(/Stale data/)).toBeInTheDocument();
  });
});
