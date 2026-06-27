import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from '../src/pages/DashboardPage';
import type { Incident, Summary } from '../src/types';

const baseSummary: Summary = {
  requests_total: 400,
  requests_successful: 399,
  requests_failed: 1,
  availability_ratio: 0.9975,
  slo_target_ratio: 0.995,
  error_budget_remaining_ratio: 0.5,
  open_incident_count: 1,
};

const mockIncidents: Incident[] = [
  {
    identifier: 'INC-1042',
    service: 'checkout-api',
    severity: 'SEV-2',
    status: 'OPEN',
    summary: 'Elevated p95 latency after a downstream inventory timeout spike.',
    started_at: '2026-06-19T08:14:00Z',
  },
];

function mockFetch(summary: Summary) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/v1/summary')) {
      return { ok: true, json: async () => summary };
    }
    if (url.includes('/api/v1/incidents')) {
      return { ok: true, json: async () => mockIncidents };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch(baseSummary));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders fleet summary cards when fleet fields are present', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        ...baseSummary,
        monitors_total: 4,
        monitors_up: 3,
        monitors_down: 1,
        monitors_paused: 0,
        monitors_unknown: 0,
        average_response_time_ms_24h: 142,
      }),
    );

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Monitor fleet summary')).toBeInTheDocument();
    });

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('142 ms')).toBeInTheDocument();
    expect(screen.queryByLabelText('Service health summary')).not.toBeInTheDocument();
  });

  it('falls back to legacy summary cards when fleet fields are missing', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Service health summary')).toBeInTheDocument();
    });

    expect(screen.getByText('99.75%')).toBeInTheDocument();
    expect(screen.queryByLabelText('Monitor fleet summary')).not.toBeInTheDocument();
  });
});
