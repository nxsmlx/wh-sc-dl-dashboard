import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryView } from './DeliveryView';
import { demoSnapshot } from '../../data/fixture';

describe('DeliveryView', () => {
  it('leads with one-day result against target', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument();
    expect(screen.getByText('97.1%', { selector: '.board-kpi strong' })).toBeInTheDocument();
    expect(screen.getByText('target 95.0%')).toBeInTheDocument();
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

  it('keeps the lorry plan in the operations detail rather than the main board', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);
    expect(screen.getAllByText('Transporter issues').length).toBeGreaterThan(0);
  });
});
