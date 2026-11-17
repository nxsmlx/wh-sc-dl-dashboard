import { useEffect, useState } from 'react';
import type { WallboardPage } from '../../data/types';
import {
  advanceRotation,
  initialRotationState,
  nextPage,
  previousPage,
  selectPage,
  setPaused,
  togglePaused,
  type RotationState,
} from './rotation';

const TICK_MS = 250;

export interface UseRotationOptions {
  durationMs: number;
  autoStart?: boolean;
  initialPage?: WallboardPage;
}

export function useRotation({ durationMs, autoStart = true, initialPage }: UseRotationOptions): RotationState & {
  next: () => void;
  previous: () => void;
  togglePause: () => void;
  setPaused: (isPaused: boolean) => void;
  select: (page: WallboardPage) => void;
} {
  const [state, setState] = useState<RotationState>(
    initialPage ? { ...initialRotationState, page: initialPage } : initialRotationState,
  );

  useEffect(() => {
    if (!autoStart) {
      return;
    }
    const timer = window.setInterval(() => {
      setState((current) => advanceRotation(current, TICK_MS, durationMs));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [autoStart, durationMs]);

  return {
    ...state,
    next: () => setState((current) => nextPage(current)),
    previous: () => setState((current) => previousPage(current)),
    togglePause: () => setState((current) => togglePaused(current)),
    setPaused: (isPaused: boolean) => setState((current) => setPaused(current, isPaused)),
    select: (page: WallboardPage) => setState((current) => selectPage(current, page)),
  };
}
