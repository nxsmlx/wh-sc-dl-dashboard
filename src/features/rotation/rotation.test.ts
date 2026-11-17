import { describe, expect, it } from 'vitest';
import {
  advanceRotation,
  initialRotationState,
  nextPage,
  previousPage,
  selectPage,
  togglePaused,
} from './rotation';

const DURATION = 30_000;

describe('advanceRotation', () => {
  it('starts on shipping check', () => {
    expect(initialRotationState.page).toBe('shipping');
    expect(initialRotationState.elapsedMs).toBe(0);
  });

  it('does not switch before the full duration has elapsed', () => {
    const next = advanceRotation(initialRotationState, DURATION - 1, DURATION);
    expect(next.page).toBe('shipping');
    expect(next.elapsedMs).toBe(DURATION - 1);
  });

  it('switches to delivery at exactly the duration boundary', () => {
    const next = advanceRotation(initialRotationState, DURATION, DURATION);
    expect(next.page).toBe('delivery');
    expect(next.elapsedMs).toBe(0);
  });

  it('wraps back to shipping after the next interval', () => {
    const delivery = advanceRotation(initialRotationState, DURATION, DURATION);
    const shipping = advanceRotation(delivery, DURATION, DURATION);
    expect(shipping.page).toBe('shipping');
  });

  it('handles a tick that crosses more than one interval', () => {
    const next = advanceRotation(initialRotationState, DURATION * 2, DURATION);
    expect(next.page).toBe('shipping');
    expect(next.elapsedMs).toBe(0);
  });

  it('does not advance while paused', () => {
    const paused = togglePaused(initialRotationState);
    expect(advanceRotation(paused, DURATION, DURATION)).toEqual(paused);
  });
});

describe('manual navigation', () => {
  it('resets elapsed time when selecting a page', () => {
    const advanced = advanceRotation(initialRotationState, 12_000, DURATION);
    const selected = selectPage(advanced, 'delivery');
    expect(selected.page).toBe('delivery');
    expect(selected.elapsedMs).toBe(0);
  });

  it('moves forward and backward through both pages', () => {
    expect(nextPage(initialRotationState).page).toBe('delivery');
    expect(nextPage(nextPage(initialRotationState)).page).toBe('shipping');
    expect(previousPage(initialRotationState).page).toBe('delivery');
    expect(previousPage(previousPage(initialRotationState)).page).toBe('shipping');
  });
});
