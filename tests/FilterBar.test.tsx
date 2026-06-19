import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from '../src/components/FilterBar';

describe('FilterBar', () => {
  it('exposes accessible severity and status filter controls', async () => {
    const user = userEvent.setup();
    const onSeverityChange = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <FilterBar
        severity="ALL"
        status="ALL"
        onSeverityChange={onSeverityChange}
        onStatusChange={onStatusChange}
        resultCount={2}
        totalCount={5}
      />,
    );

    expect(screen.getByRole('search', { name: 'Incident filters' })).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 5 incidents')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'SEV-3' }));
    expect(onSeverityChange).toHaveBeenCalledWith('SEV-3');

    await user.click(screen.getByRole('button', { name: 'OPEN' }));
    expect(onStatusChange).toHaveBeenCalledWith('OPEN');
  });
});
