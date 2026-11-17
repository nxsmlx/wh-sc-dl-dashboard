import { embeddedWorkbookData } from './embedded';
import { demoSnapshot } from './fixture';
import type { DashboardSnapshot } from './types';
import { mapWorkbookRows, type RawWorkbookData } from './workbook-mapping';

export interface DashboardDataSource {
  label: string;
  load(): Promise<DashboardSnapshot>;
}

export function createFixtureDataSource(): DashboardDataSource {
  return {
    label: 'Demo data',
    async load() {
      return demoSnapshot;
    },
  };
}

export function createJsonDataSource(url: string, label = 'Workbook'): DashboardDataSource {
  return {
    label,
    async load() {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Dashboard data request failed (${response.status}) for ${url}`);
      }
      return mapWorkbookRows((await response.json()) as RawWorkbookData);
    },
  };
}

/**
 * Embedded workbook data when `npm run data:import` has generated it. When the
 * board is hosted by `server/index.mjs`, `/api/dashboard` can override it with a
 * fresher file mounted in the server data directory.
 */
export function createDefaultDataSource(): DashboardDataSource {
  return {
    label: 'Dashboard',
    async load() {
      if (typeof fetch === 'function' && typeof window !== 'undefined' && window.location.protocol !== 'file:') {
        try {
          const response = await fetch('/api/dashboard', { cache: 'no-store' });
          if (response.ok) {
            return mapWorkbookRows((await response.json()) as RawWorkbookData);
          }
        } catch {
          // Fall through to the embedded snapshot.
        }
      }
      return embeddedWorkbookData ? mapWorkbookRows(embeddedWorkbookData) : demoSnapshot;
    },
  };
}
