import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemo, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { FilterBar } from '../src/components/FilterBar';
import { IncidentsTable } from '../src/components/IncidentsTable';
import type { Incident, SeverityFilter, StatusFilter } from '../src/types';

const mockIncidents: Incident[] = [
  {
    identifier: 'INC-1042',
    service: 'checkout-api',
    severity: 'SEV-2',
    status: 'OPEN',
    summary: 'Elevated p95 latency after a downstream inventory timeout spike.',
    started_at: '2026-06-19T08:14:00Z',
  },
  {
    identifier: 'INC-1039',
    service: 'notification-worker',
    severity: 'SEV-3',
    status: 'RESOLVED',
    summary: 'Queue consumer restart recovered delayed email delivery.',
    started_at: '2026-06-18T15:26:00Z',
  },
  {
    identifier: 'INC-1021',
    service: 'payments-api',
    severity: 'SEV-1',
    status: 'OPEN',
    summary: 'Card authorization failures spiked after gateway failover.',
    started_at: '2026-06-17T11:02:00Z',
  },
];

function filterIncidents(
  incidents: Incident[],
  severity: SeverityFilter,
  status: StatusFilter,
): Incident[] {
  return incidents.filter((incident) => {
    const severityMatch = severity === 'ALL' || incident.severity === severity;
    const statusMatch = status === 'ALL' || incident.status === status;
    return severityMatch && statusMatch;
  });
}

function FilterableIncidentsFixture() {
  const [severity, setSeverity] = useState<SeverityFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const filtered = useMemo(
    () => filterIncidents(mockIncidents, severity, status),
    [severity, status],
  );

  return (
    <>
      <FilterBar
        severity={severity}
        status={status}
        onSeverityChange={setSeverity}
        onStatusChange={setStatus}
        resultCount={filtered.length}
        totalCount={mockIncidents.length}
      />
      <IncidentsTable incidents={filtered} />
    </>
  );
}

describe('IncidentsTable', () => {
  it('filters incidents by severity and status', async () => {
    const user = userEvent.setup();
    render(<FilterableIncidentsFixture />);

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'SEV-2' }));
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('INC-1042')).toBeInTheDocument();
    expect(screen.queryByText('INC-1039')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'OPEN' }));
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('INC-1042')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'RESOLVED' }));
    expect(screen.getByRole('status')).toHaveTextContent('No incidents match the current filters.');
  });
});
