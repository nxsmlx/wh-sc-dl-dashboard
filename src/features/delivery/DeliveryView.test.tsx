import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryView } from './DeliveryView';
import { demoSnapshot } from '../../data/fixture';

describe('DeliveryView', () => {
  it('leads with one-day result against target', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument();
    expect(screen.getByText('97.1%', { selector: '.hero-value' })).toBeInTheDocument();
    expect(screen.getByText(/Target 95\.0% · above target/)).toBeInTheDocument();
  });

  it('shows trip utilization and same-day share', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    expect(screen.getByText('97.0%')).toBeInTheDocument();
    expect(screen.getByText('262 / 270 trips')).toBeInTheDocument();
    expect(screen.getAllByText('73.6%').length).toBeGreaterThan(0);
    expect(screen.getByText('1,196 / 1,626 lines')).toBeInTheDocument();
  });

  it('shows region comparison and transporter issues', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    expect(screen.getByText('Central', { selector: '.bar-label' })).toBeInTheDocument();
    expect(screen.getByText('East Coast', { selector: '.bar-label' })).toBeInTheDocument();
    expect(screen.getByText('3 this month · 8 year to date')).toBeInTheDocument();
    expect(screen.getAllByText('Lorry breakdown').length).toBeGreaterThan(0);
  });

  it('renders the lorry plan when present and omits it when absent', () => {
    const { rerender } = render(<DeliveryView data={demoSnapshot.delivery} />);
    expect(screen.getByText('Lorry plan')).toBeInTheDocument();
    expect(screen.getByText('NG')).toBeInTheDocument();

    rerender(<DeliveryView data={{ ...demoSnapshot.delivery, lorryPlan: [] }} />);
    expect(screen.queryByText('Lorry plan')).not.toBeInTheDocument();
  });
});
