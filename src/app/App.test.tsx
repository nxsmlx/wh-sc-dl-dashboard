import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createFixtureDataSource, type DashboardDataSource } from '../data/data-source';
import { demoSnapshot } from '../data/fixture';

function flush(): Promise<void> {
  return act(async () => {
    await Promise.resolve();
  });
}

describe('App wallboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
  });

  it('renders Shipping check first and switches to Delivery after 30 seconds', async () => {
    vi.useFakeTimers();
    render(<App dataSource={createFixtureDataSource()} remotePollMs={60 * 60 * 1000} />);
    await flush();

    expect(screen.getByRole('heading', { name: 'Shipping check' })).toBeInTheDocument();
    expect(screen.getByText('14,650', { selector: '.kpi-value' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument();
    expect(screen.getByText('97.1', { selector: '.kpi-value' })).toBeInTheDocument();
  });

  it('does not switch pages before the 30-second boundary', async () => {
    vi.useFakeTimers();
    render(<App dataSource={createFixtureDataSource()} remotePollMs={60 * 60 * 1000} />);
    await flush();

    await act(async () => {
      vi.advanceTimersByTime(29_000);
    });

    expect(screen.getByRole('heading', { name: 'Shipping check' })).toBeInTheDocument();
  });

  it('lets the operator move between pages manually', async () => {
    const user = userEvent.setup();
    render(<App dataSource={createFixtureDataSource()} durationMs={3_600_000} />);
    await screen.findByRole('heading', { name: 'Shipping check' });

    await user.click(screen.getByRole('button', { name: 'Delivery' }));
    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show previous page' }));
    expect(screen.getByRole('heading', { name: 'Shipping check' })).toBeInTheDocument();
  });

  it('persists the theme choice', async () => {
    const user = userEvent.setup();
    render(<App dataSource={createFixtureDataSource()} />);
    await screen.findByRole('heading', { name: 'Shipping check' });

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));

    expect(window.localStorage.getItem('wallboard-theme')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });

  it('shows a useful error when the data source fails', async () => {
    const failing: DashboardDataSource = {
      label: 'Broken',
      async load() {
        throw new Error('Workbook sheet missing');
      },
    };
    render(<App dataSource={failing} />);

    expect(await screen.findByText('Dashboard data failed to load')).toBeInTheDocument();
    expect(screen.getByText('Workbook sheet missing')).toBeInTheDocument();
  });

  it('shows a notice and honours remote control from /api/state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/api/state')) {
          return {
            ok: true,
            json: async () => ({
              notice: { text: 'Meeting 3pm at meeting room', expiresAt: null },
              forcedPage: 'delivery',
              paused: true,
              theme: null,
              updatedAt: '2026-11-17T02:00:00.000Z',
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      }),
    );

    render(<App dataSource={createFixtureDataSource()} durationMs={3_600_000} />);

    expect(await screen.findByText('Meeting 3pm at meeting room')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('marks stale data without hiding the KPI', async () => {
    const stale: DashboardDataSource = {
      label: 'Stale',
      async load() {
        return { ...demoSnapshot, lastUpdatedAt: '2026-01-01T00:00:00.000Z' };
      },
    };
    render(<App dataSource={stale} staleAfterMs={60_000} />);

    expect(await screen.findByText(/Workbook has not been updated since/)).toBeInTheDocument();
    expect(screen.getByText('14,650', { selector: '.kpi-value' })).toBeInTheDocument();
  });

  it('pauses rotation in operations detail and resumes after returning', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({}),
      })),
    );
    render(<App dataSource={createFixtureDataSource()} remotePollMs={60 * 60 * 1000} />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'View operations detail' }));

    expect(screen.getByRole('heading', { name: 'Shipping check operations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to wallboard' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to wallboard' }));
    expect(screen.getByRole('heading', { name: 'Shipping check' })).toBeInTheDocument();
  });
});
