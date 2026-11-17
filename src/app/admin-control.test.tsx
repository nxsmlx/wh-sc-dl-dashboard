import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createFixtureDataSource, type DashboardDataSource } from '../data/data-source';
import { demoSnapshot } from '../data/fixture';

function adminState(overrides: Record<string, unknown> = {}) {
  return {
    notice: null,
    forcedPage: null,
    paused: false,
    theme: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function stubAdminApi(state: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => state,
    })),
  );
}

describe('App admin control', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
  });

  it('shows the admin notice on the board', async () => {
    stubAdminApi(adminState({ notice: { text: 'Meeting 3pm bilik mesyuarat', expiresAt: null } }));

    render(<App dataSource={createFixtureDataSource()} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(await screen.findByText('Meeting 3pm bilik mesyuarat')).toBeInTheDocument();
  });

  it('follows the admin forced page', async () => {
    stubAdminApi(adminState({ forcedPage: 'delivery' }));

    render(<App dataSource={createFixtureDataSource()} />);
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument();
    });
  });

  it('shows the operator Resume control while the admin pause is on', async () => {
    stubAdminApi(adminState({ paused: true }));

    render(<App dataSource={createFixtureDataSource()} />);
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    });
  });

  it('hides an expired notice', async () => {
    stubAdminApi(adminState({ notice: { text: 'Old notice', expiresAt: '2000-01-01T00:00:00.000Z' } }));

    render(<App dataSource={createFixtureDataSource()} />);
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText('Old notice')).not.toBeInTheDocument();
    });
  });
});
