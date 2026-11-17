import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { DeliveryView } from './DeliveryView';
import { demoSnapshot } from '../../data/fixture';

const kpi = (label: string) => screen.getByText(label, { selector: '.kpi-label' }).closest('.board-kpi') as HTMLElement;

describe('DeliveryView', () => {
  it('marks the 1-day result against its official target', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    expect(screen.getByRole('heading', { name: 'Delivery' })).toBeInTheDocument();
    const result = kpi('1-day result · November');
    expect(within(result).getByText('97.1')).toBeInTheDocument();
    expect(within(result).getByText('Above target')).toBeInTheDocument();
    expect(within(result).getByText('target 95.0%')).toBeInTheDocument();
  });

  it('marks trip utilization below its 100% target', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    const trips = kpi('Trip utilization');
    expect(within(trips).getByText('97.0')).toBeInTheDocument();
    expect(within(trips).getByText('Below target')).toBeInTheDocument();
    expect(within(trips).getByText('262 / 270 trips')).toBeInTheDocument();
  });

  it('shows same-day share and transporter cases', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    expect(within(kpi('Same-day delivery')).getByText('1,196 / 1,626 lines')).toBeInTheDocument();
    expect(within(kpi('Transporter issues')).getByText('8 year to date')).toBeInTheDocument();
    expect(screen.getAllByText('Lorry breakdown').length).toBeGreaterThan(0);
  });

  it('flags a region below the delivery target', () => {
    render(<DeliveryView data={demoSnapshot.delivery} />);

    const eastCoast = screen.getByText('East Coast', { selector: '.bar-label' }).closest('.bar-row');
    expect(eastCoast).toHaveAttribute('data-tone', 'danger');
    const central = screen.getByText('Central', { selector: '.bar-label' }).closest('.bar-row');
    expect(central).not.toHaveAttribute('data-tone');
  });
});
