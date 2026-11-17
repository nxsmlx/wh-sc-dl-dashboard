import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AttentionRail } from './AttentionRail';

describe('AttentionRail', () => {
  it('shows the action signal and reason as readable text', () => {
    render(
      <AttentionRail
        signal={{
          tone: 'warning',
          label: 'Shipment backlog',
          value: '60',
          reason: '60 shipments not yet invoice',
        }}
      />,
    );

    expect(screen.getByText('Shipment backlog')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('60 shipments not yet invoice')).toBeInTheDocument();
  });
});
