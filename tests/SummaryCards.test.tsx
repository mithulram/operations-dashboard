import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBanner } from '../src/components/ErrorBanner';
import { SummaryCards } from '../src/components/SummaryCards';
import type { Summary } from '../src/types';

const mockSummary: Summary = {
  requests_total: 400,
  requests_successful: 399,
  requests_failed: 1,
  availability_ratio: 0.9975,
  slo_target_ratio: 0.995,
  error_budget_remaining_ratio: 0.5,
  open_incident_count: 1,
};

describe('SummaryCards', () => {
  it('renders mocked summary metrics as formatted percentages', () => {
    render(<SummaryCards summary={mockSummary} />);

    expect(screen.getByLabelText('Service health summary')).toBeInTheDocument();
    expect(screen.getByText('99.75%')).toBeInTheDocument();
    expect(screen.getByText('99.50%')).toBeInTheDocument();
    expect(screen.getByText('50.00%')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Open Incidents')).toBeInTheDocument();
  });
});

describe('ErrorBanner', () => {
  it('shows banner on fetch failure with retry action', async () => {
    const onRetry = vi.fn();

    render(
      <ErrorBanner
        message="Unable to reach the service health API. Is the backend running on port 8090?"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load dashboard data');
    expect(screen.getByText(/Unable to reach the service health API/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
