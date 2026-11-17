import type { StatusTone } from '../../data/types';

export interface KpiStatus {
  tone: StatusTone;
  label: string;
}

/** Compare a result against its official target, where higher is better. */
export function targetStatus(value: number, target: number): KpiStatus {
  if (value > target) {
    return { tone: 'success', label: 'Above target' };
  }
  if (value === target) {
    return { tone: 'success', label: 'On target' };
  }
  return { tone: 'danger', label: 'Below target' };
}

/** Month-on-month movement for a measure where a fall is good, such as issues. */
export function lowerIsBetter(current: number, previous: number, decimals = 0): KpiStatus {
  const change = Number((current - previous).toFixed(decimals));
  if (change === 0) {
    return { tone: 'neutral', label: 'Same as last month' };
  }
  const size = Math.abs(change).toFixed(decimals);
  return change < 0
    ? { tone: 'success', label: `Down ${size} vs last month` }
    : { tone: 'warning', label: `Up ${size} vs last month` };
}
