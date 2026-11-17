import { useEffect, useState } from 'react';

const ENTER = 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5';
const EXIT = 'M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5';

/** Full screen toggle for the smartboard browser; hidden where the browser has no full screen support. */
export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  if (typeof document.documentElement.requestFullscreen !== 'function') {
    return null;
  }

  const toggle = () => {
    const request = isFullscreen ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    // A rejected request (for example, no user gesture) leaves the board as it is.
    void request?.catch(() => undefined);
  };

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
      title={isFullscreen ? 'Exit full screen' : 'Full screen'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={isFullscreen ? EXIT : ENTER}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
