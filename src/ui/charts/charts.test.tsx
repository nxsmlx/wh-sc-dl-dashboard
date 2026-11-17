import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendLine } from './TrendLine';
import { HorizontalBars } from './HorizontalBars';

describe('TrendLine', () => {
  it('exposes the trend as accessible text, not a hover-only value', () => {
    render(
      <TrendLine
        title="Lines by month"
        points={[
          { label: 'Oct', value: 15851 },
          { label: 'Nov', value: 14650 },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: /Lines by month: Oct 15,851 to Nov 14,650/ })).toBeInTheDocument();
    expect(screen.getByText('14,650')).toBeInTheDocument();
    expect(screen.getByText('Nov')).toBeInTheDocument();
  });

  it('draws and labels a target line when one is given', () => {
    render(
      <TrendLine
        title="1-day result"
        points={[
          { label: 'Sep', value: 95.3 },
          { label: 'Oct', value: 97.1 },
        ]}
        suffix="%"
        target={95}
        formatValue={(value) => value.toFixed(1)}
      />,
    );

    expect(screen.getByText('Target 95.0%')).toBeInTheDocument();
  });

  it('renders an explicit empty state instead of a broken chart', () => {
    render(<TrendLine title="Lines by month" points={[]} />);
    expect(screen.getByText('No trend data yet')).toBeInTheDocument();
  });
});

describe('HorizontalBars', () => {
  it('shows category labels and values without interaction', () => {
    render(
      <HorizontalBars
        title="Issues this month"
        points={[
          { label: 'Extra parts', value: 12 },
          { label: 'Wrong parts', value: 8 },
        ]}
      />,
    );

    expect(screen.getByLabelText('Issues this month')).toBeInTheDocument();
    expect(screen.getByText('Extra parts')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('handles zero values safely', () => {
    render(<HorizontalBars title="Issues this month" points={[{ label: 'Rusty', value: 0 }]} />);
    expect(screen.getByText('Rusty')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('reports an empty breakdown', () => {
    render(<HorizontalBars title="Issues this month" points={[]} />);
    expect(screen.getByText('No breakdown for this month')).toBeInTheDocument();
  });
});
