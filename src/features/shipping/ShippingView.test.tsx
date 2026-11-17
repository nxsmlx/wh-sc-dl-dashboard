import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ShippingView } from './ShippingView';
import { demoSnapshot } from '../../data/fixture';

const kpi = (label: RegExp | string) => screen.getByText(label, { selector: '.kpi-label' }).closest('.board-kpi') as HTMLElement;

describe('ShippingView', () => {
  it('leads with line volume for the named report month', () => {
    render(<ShippingView data={demoSnapshot.shipping} />);

    expect(screen.getByRole('heading', { name: 'Shipping check' })).toBeInTheDocument();
    const lines = kpi('Lines · November');
    expect(within(lines).getByText('14,650')).toBeInTheDocument();
    expect(within(lines).getByText('-7.6% vs last month')).toBeInTheDocument();
  });

  it('marks issue movement where a fall is an improvement', () => {
    render(<ShippingView data={demoSnapshot.shipping} />);

    expect(within(kpi('Issues')).getByText('Down 2 vs last month')).toBeInTheDocument();
    expect(within(kpi('Issues per 10k lines')).getByText('Up 0.1 vs last month')).toBeInTheDocument();
  });

  it('shows every shipment status', () => {
    render(<ShippingView data={demoSnapshot.shipping} />);

    expect(screen.getByText('Not yet invoice')).toBeInTheDocument();
    expect(screen.getByText('Not confirm')).toBeInTheDocument();
    expect(screen.getByText('Release to invoicing')).toBeInTheDocument();
  });

  it('renders recent issue detail and reason comparison', () => {
    render(<ShippingView data={demoSnapshot.shipping} />);

    expect(screen.getByText('Label mismatch, racking back to workzone')).toBeInTheDocument();
    expect(screen.getAllByText('Extra parts').length).toBeGreaterThan(0);
  });

  it('keeps the primary KPI when optional breakdowns are missing', () => {
    render(
      <ShippingView
        data={{
          ...demoSnapshot.shipping,
          reasonBreakdown: [],
          workzoneBreakdown: [],
          recentIssues: [],
          monthlyLines: [],
          monthlyIssueRate: [],
        }}
      />,
    );

    expect(within(kpi('Lines · November')).getByText('14,650')).toBeInTheDocument();
    expect(screen.getByText('No breakdown for this month')).toBeInTheDocument();
    expect(screen.getByText('No issues logged this month')).toBeInTheDocument();
    expect(screen.getByText('No trend data yet')).toBeInTheDocument();
  });
});
