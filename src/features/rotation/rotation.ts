import type { WallboardPage } from '../../data/types';

export const ROTATION_DURATION_MS = 30_000;

export interface RotationState {
  page: WallboardPage;
  elapsedMs: number;
  isPaused: boolean;
}

export const initialRotationState: RotationState = {
  page: 'shipping',
  elapsedMs: 0,
  isPaused: false,
};

/** Advance the wallboard by elapsed time. Page changes only when a full duration has passed. */
export function advanceRotation(
  state: RotationState,
  elapsedMs: number,
  durationMs: number = ROTATION_DURATION_MS,
): RotationState {
  if (state.isPaused || elapsedMs <= 0) {
    return state;
  }
  const total = state.elapsedMs + elapsedMs;
  if (total < durationMs) {
    return { ...state, elapsedMs: total };
  }
  const pages: WallboardPage[] = ['shipping', 'delivery'];
  const currentIndex = pages.indexOf(state.page);
  const steps = Math.floor(total / durationMs);
  return {
    page: pages[(currentIndex + steps) % pages.length],
    elapsedMs: total % durationMs,
    isPaused: false,
  };
}

export function selectPage(_state: RotationState, page: WallboardPage): RotationState {
  return { page, elapsedMs: 0, isPaused: false };
}

export function nextPage(state: RotationState): RotationState {
  return selectPage(state, state.page === 'shipping' ? 'delivery' : 'shipping');
}

export function previousPage(state: RotationState): RotationState {
  return selectPage(state, state.page === 'delivery' ? 'shipping' : 'delivery');
}

export function togglePaused(state: RotationState): RotationState {
  return { ...state, isPaused: !state.isPaused };
}
