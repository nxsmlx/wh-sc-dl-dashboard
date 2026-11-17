import { useEffect, useState } from 'react';
import type { ThemeName } from '../data/types';
import { Icon } from './Icon';

const STORAGE_KEY = 'wallboard-theme';

export function readStoredTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const requested = new URLSearchParams(window.location.search).get('theme');
  if (requested === 'light' || requested === 'dark') {
    return requested;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function useTheme(): [ThemeName, (theme: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked in kiosk mode; the in-memory theme still applies.
    }
  }, [theme]);

  return [theme, setTheme];
}

export function ThemeToggle({ theme, onChange }: { theme: ThemeName; onChange: (theme: ThemeName) => void }) {
  const next: ThemeName = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={() => onChange(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={26} />
    </button>
  );
}
