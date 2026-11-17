import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { demoSnapshot } from '../../data/fixture';
import { OperationsDetail } from './OperationsDetail';

describe('OperationsDetail', () => {
  it('shows Shipping Check operational rankings and latest issues', () => {
    render(<OperationsDetail page="shipping" snapshot={demoSnapshot} onBack={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Shipping check operations' })).toBeInTheDocument();
    expect(screen.getByText('Issues by workzone')).toBeInTheDocument();
    expect(screen.getByText('Quantity variance')).toBeInTheDocument();
    expect(screen.getByText('Label mismatch, racking back to workzone')).toBeInTheDocument();
  });

  it('shows Delivery regions, mix, transporter cases and lorry plan', () => {
    render(<OperationsDetail page="delivery" snapshot={demoSnapshot} onBack={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Delivery operations' })).toBeInTheDocument();
    expect(screen.getByText('1-day result by region')).toBeInTheDocument();
    expect(screen.getByText('Delivery mix')).toBeInTheDocument();
    expect(screen.getByText('Lorry plan')).toBeInTheDocument();
    expect(screen.getAllByText('Lorry breakdown').length).toBeGreaterThan(0);
  });

  it('provides a back control', () => {
    const onBack = vi.fn();
    render(<OperationsDetail page="shipping" snapshot={demoSnapshot} onBack={onBack} />);

    screen.getByRole('button', { name: 'Back to wallboard' }).click();
    expect(onBack).toHaveBeenCalledOnce();
  });
});
