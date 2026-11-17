import type { DeliverySnapshot, ShippingSnapshot, StatusTone } from '../../data/types';

export interface AttentionSignal {
  tone: StatusTone;
  label: string;
  value: string;
  reason: string;
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getShippingAttention(data: ShippingSnapshot): AttentionSignal {
  const backlog = data.shipmentStatuses.find((status) => status.status === 'Not yet invoice' && status.count > 0);
  if (backlog) {
    return {
      tone: 'warning',
      label: 'Shipment backlog',
      value: backlog.count.toLocaleString('en-GB'),
      reason: `${backlog.count.toLocaleString('en-GB')} shipments not yet invoice`,
    };
  }

  const topWorkzone = [...data.workzoneBreakdown].sort((a, b) => b.value - a.value)[0];
  if (topWorkzone && topWorkzone.value > 0) {
    return {
      tone: 'warning',
      label: 'Priority workzone',
      value: topWorkzone.value.toLocaleString('en-GB'),
      reason: `${topWorkzone.label} has the most issues`,
    };
  }

  if (data.issueRatePer10k > data.previousIssueRatePer10k) {
    return {
      tone: 'warning',
      label: 'Issue rate rising',
      value: data.issueRatePer10k.toFixed(1),
      reason: `up from ${data.previousIssueRatePer10k.toFixed(1)} per 10k lines`,
    };
  }

  return {
    tone: 'success',
    label: 'Shipping check stable',
    value: data.issueCount.toLocaleString('en-GB'),
    reason: 'No higher-priority backlog or rising issue rate detected',
  };
}

export function getDeliveryAttention(data: DeliverySnapshot): AttentionSignal {
  if (data.oneDayResultPct < data.oneDayTargetPct) {
    return {
      tone: 'danger',
      label: 'Below target',
      value: formatPct(data.oneDayResultPct),
      reason: `1-day result is below the ${formatPct(data.oneDayTargetPct)} target`,
    };
  }

  const weakRegion = [...data.regions].sort((a, b) => a.oneDayPct - b.oneDayPct)[0];
  if (weakRegion && weakRegion.oneDayPct < data.oneDayTargetPct) {
    return {
      tone: 'warning',
      label: 'Region needs attention',
      value: formatPct(weakRegion.oneDayPct),
      reason: `${weakRegion.region} is below the ${formatPct(data.oneDayTargetPct)} target`,
    };
  }

  if (data.transporterIssueCount > 0) {
    return {
      tone: 'warning',
      label: 'Transporter issues',
      value: data.transporterIssueCount.toLocaleString('en-GB'),
      reason: `${data.transporterIssueCount} cases recorded this month`,
    };
  }

  return {
    tone: 'success',
    label: 'Delivery on track',
    value: formatPct(data.oneDayResultPct),
    reason: `1-day result is above the ${formatPct(data.oneDayTargetPct)} target`,
  };
}
