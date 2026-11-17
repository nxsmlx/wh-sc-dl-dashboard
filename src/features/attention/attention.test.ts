import { describe, expect, it } from 'vitest';
import { demoSnapshot } from '../../data/fixture';
import { getDeliveryAttention, getShippingAttention } from './attention';

describe('getShippingAttention', () => {
  it('prioritises an outstanding shipment status backlog', () => {
    const signal = getShippingAttention(demoSnapshot.shipping);

    expect(signal.tone).toBe('warning');
    expect(signal.label).toBe('Shipment backlog');
    expect(signal.value).toBe('60');
    expect(signal.reason).toMatch(/not yet invoice/i);
  });

  it('uses the highest issue workzone when shipment statuses are clear', () => {
    const signal = getShippingAttention({
      ...demoSnapshot.shipping,
      shipmentStatuses: demoSnapshot.shipping.shipmentStatuses.map((status) => ({ ...status, count: 0 })),
    });

    expect(signal.label).toBe('Priority workzone');
    expect(signal.reason).toContain('WZ 4');
  });
});

describe('getDeliveryAttention', () => {
  it('prioritises a delivery result below its target', () => {
    const signal = getDeliveryAttention({
      ...demoSnapshot.delivery,
      oneDayResultPct: 91,
      oneDayTargetPct: 95,
    });

    expect(signal.tone).toBe('danger');
    expect(signal.label).toBe('Below target');
    expect(signal.value).toBe('91.0%');
    expect(signal.reason).toContain('95.0%');
  });

  it('uses transporter issues after target and region checks are clear', () => {
    const signal = getDeliveryAttention({
      ...demoSnapshot.delivery,
      regions: demoSnapshot.delivery.regions.map((region) => ({ ...region, oneDayPct: 99 })),
      transporterIssueCount: 3,
    });

    expect(signal.label).toBe('Transporter issues');
    expect(signal.value).toBe('3');
  });
});
