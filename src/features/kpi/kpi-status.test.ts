import { describe, expect, it } from 'vitest';
import { lowerIsBetter, targetStatus } from './kpi-status';

describe('targetStatus', () => {
  it('marks a value at or above target as on target', () => {
    expect(targetStatus(97.1, 95)).toEqual({ tone: 'success', label: 'Above target' });
    expect(targetStatus(95, 95)).toEqual({ tone: 'success', label: 'On target' });
  });

  it('marks a value below target as below target', () => {
    expect(targetStatus(87, 95)).toEqual({ tone: 'danger', label: 'Below target' });
  });
});

describe('lowerIsBetter', () => {
  it('treats a fall as an improvement', () => {
    expect(lowerIsBetter(25, 27)).toEqual({ tone: 'success', label: 'Down 2 vs last month' });
  });

  it('treats a rise as a deterioration', () => {
    expect(lowerIsBetter(18.4, 18.3, 1)).toEqual({ tone: 'warning', label: 'Up 0.1 vs last month' });
  });

  it('reports no change as neutral', () => {
    expect(lowerIsBetter(27, 27)).toEqual({ tone: 'neutral', label: 'Same as last month' });
  });
});
