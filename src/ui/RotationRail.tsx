import type { CSSProperties, ReactNode } from 'react';
import type { RotationState } from '../features/rotation/rotation';
import type { WallboardPage } from '../data/types';
import { Icon } from './Icon';

const PAGE_LABEL: Record<WallboardPage, string> = {
  shipping: 'Shipping check',
  delivery: 'Delivery',
};

export function RotationRail({
  rotation,
  durationMs,
  onNext,
  onPrevious,
  onTogglePause,
  extra,
}: {
  rotation: RotationState;
  durationMs: number;
  onNext: () => void;
  onPrevious: () => void;
  onTogglePause: () => void;
  extra?: ReactNode;
}) {
  const progress = Math.min(1, rotation.elapsedMs / durationMs);
  const remaining = Math.max(0, Math.ceil((durationMs - rotation.elapsedMs) / 1000));
  const nextPage: WallboardPage = rotation.page === 'shipping' ? 'delivery' : 'shipping';
  const style = { '--progress': String(progress) } as CSSProperties;

  return (
    <footer className="rotation-rail glass" aria-label="Rotation controls" data-paused={rotation.isPaused}>
      <div className="rotation-controls">
        <button type="button" onClick={onPrevious} aria-label="Show previous page">
          <Icon name="prev" size={24} strokeWidth={2.6} />
        </button>
        <button type="button" className="rotation-play" onClick={onTogglePause} aria-label={rotation.isPaused ? 'Resume' : 'Pause'}>
          <Icon name={rotation.isPaused ? 'play' : 'pause'} size={22} strokeWidth={2.8} />
        </button>
        <button type="button" onClick={onNext} aria-label="Show next page">
          <Icon name="next" size={24} strokeWidth={2.6} />
        </button>
      </div>
      <span className="rotation-label">
        {rotation.isPaused
          ? `${PAGE_LABEL[rotation.page]} · paused`
          : `${PAGE_LABEL[nextPage]} in ${String(remaining).padStart(2, '0')}s`}
      </span>
      <div
        className="rotation-track"
        role="progressbar"
        aria-label={`Time left on ${PAGE_LABEL[rotation.page]}`}
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={Math.round(rotation.elapsedMs / 1000)}
        style={style}
      >
        <div className="rotation-fill" />
      </div>
      <span className="rotation-dots" aria-hidden="true">
        {(['shipping', 'delivery'] as WallboardPage[]).map((value) => (
          <span key={value} className="rotation-dot" data-active={rotation.page === value} />
        ))}
      </span>
      {extra}
    </footer>
  );
}
