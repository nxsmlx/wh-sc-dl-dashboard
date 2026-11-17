import { useEffect, useState } from 'react';
import type { ThemeName, WallboardPage } from './types';

export interface RemoteNotice {
  text: string;
  expiresAt: string | null;
}

export interface RemoteState {
  notice: RemoteNotice | null;
  forcedPage: WallboardPage | null;
  paused: boolean;
  theme: ThemeName | null;
  updatedAt: string | null;
}

const EMPTY: RemoteState = {
  notice: null,
  forcedPage: null,
  paused: false,
  theme: null,
  updatedAt: null,
};

const POLL_MS = 15_000;

function parseState(value: unknown): RemoteState {
  if (!value || typeof value !== 'object') {
    return EMPTY;
  }
  const raw = value as Record<string, unknown>;
  const noticeRaw = raw.notice as Record<string, unknown> | null;
  return {
    notice:
      noticeRaw && typeof noticeRaw.text === 'string' && noticeRaw.text.trim() !== ''
        ? {
            text: noticeRaw.text.trim(),
            expiresAt: typeof noticeRaw.expiresAt === 'string' ? noticeRaw.expiresAt : null,
          }
        : null,
    forcedPage:
      raw.forcedPage === 'shipping' || raw.forcedPage === 'delivery' ? (raw.forcedPage as WallboardPage) : null,
    paused: raw.paused === true,
    theme: raw.theme === 'dark' || raw.theme === 'light' ? (raw.theme as ThemeName) : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

/** Poll the admin state. A file:// board or an unreachable API simply keeps the last state. */
export function useRemoteState(
  url = '/api/state',
  pollMs = POLL_MS,
): { remote: RemoteState; connected: boolean } {
  const [remote, setRemote] = useState<RemoteState>(EMPTY);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.protocol === 'file:' || typeof fetch !== 'function') {
      return;
    }

    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!active) {
          return;
        }
        if (!response.ok) {
          setConnected(false);
          return;
        }
        setRemote(parseState(await response.json()));
        setConnected(true);
      } catch {
        if (active) {
          setConnected(false);
        }
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), pollMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [url]);

  return { remote, connected };
}

export function activeNotice(remote: RemoteState, now: Date = new Date()): RemoteNotice | null {
  if (!remote.notice) {
    return null;
  }
  if (remote.notice.expiresAt) {
    const expiry = Date.parse(remote.notice.expiresAt);
    if (!Number.isNaN(expiry) && expiry <= now.getTime()) {
      return null;
    }
  }
  return remote.notice;
}
