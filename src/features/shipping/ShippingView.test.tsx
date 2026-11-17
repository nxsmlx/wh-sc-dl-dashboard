import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShippingView } from './ShippingView';
import { demoSnapshot } from '../../data/fixture';

describe('ShippingView', () => {
  it('leads with line volume and month comparison', () => {
    render(<ShippingView data={demoSnapshot.shipping} />);

    expect(screen.getByRole('heading', { name: 'Shipping check' })).toBeInTheDocument();
    expect(screen.getByText('14,650')).toBeInTheDocument();
    expect(screen.getByText('-7.6% vs last month')).toBeInTheDocument();
  });

  it('shows issue pressure and all shipment statuses', () => {
    render(<ShippingView data={demoSnapshot.shipping} />);

    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(screen.getByText('18.4')).toBeInTheDocument();
    expect(screen.getByText('Not yet invoice')).toBeInTheDocument();
    expect(screen.getByText('Not confirm')).toBeInTheDocument();
    expect(screen.getByText('Release to invoicing')).toBeInTheDocument();
  });

  it('renders recent issue detail and reason comparison', () => {
    render(<ShippingView data={demoSnapshot.shipping} />);

    expect(screen.getByText('Label mismatch, racking back to workzone')).toBeInTheDocument();
    expect(screen.getAllByText('Extra parts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('WZ 4').length).toBeGreaterThan(0);
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

    expect(screen.getByText('14,650')).toBeInTheDocument();
    expect(screen.getAllByText('No breakdown for this month')).toHaveLength(2);
    expect(screen.getByText('No issues logged this month')).toBeInTheDocument();
    expect(screen.getByText('No trend data yet')).toBeInTheDocument();
  });
});
