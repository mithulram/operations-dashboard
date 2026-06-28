import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import type { Incident, Summary } from '../src/types';

const mockSummary: Summary = {
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

type FetchOutcome =
  | { ok: true; body: unknown }
  | { ok: false; status: number }
  | { error: 'network' };

function createFetchMock(outcomes: {
  summary?: FetchOutcome | FetchOutcome[];
  incidents?: FetchOutcome | FetchOutcome[];
}) {
  const summaryQueue = Array.isArray(outcomes.summary)
    ? [...outcomes.summary]
    : outcomes.summary
      ? [outcomes.summary]
      : [{ ok: true as const, body: mockSummary }];
  const incidentsQueue = Array.isArray(outcomes.incidents)
    ? [...outcomes.incidents]
    : outcomes.incidents
      ? [outcomes.incidents]
      : [{ ok: true as const, body: mockIncidents }];

  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/api/v1/summary')) {
      const next = summaryQueue.shift() ?? summaryQueue[summaryQueue.length - 1];
      if ('error' in next) {
        throw new TypeError('Failed to fetch');
      }
      if (!next.ok) {
        return { ok: false, status: next.status, json: async () => ({}) };
      }
      return { ok: true, json: async () => next.body };
    }

    if (url.includes('/api/v1/incidents')) {
      const next = incidentsQueue.shift() ?? incidentsQueue[incidentsQueue.length - 1];
      if ('error' in next) {
        throw new TypeError('Failed to fetch');
      }
      if (!next.ok) {
        return { ok: false, status: next.status, json: async () => ({}) };
      }
      return { ok: true, json: async () => next.body };
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', createFetchMock({}));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows loading skeleton then renders dashboard data on success', async () => {
    render(<App />);

    expect(screen.getByLabelText('Loading dashboard data')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('Service health summary')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Status Page' })).toBeInTheDocument();
    expect(screen.getByText('99.75%')).toBeInTheDocument();
    expect(screen.getByText('INC-1042')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading dashboard data')).not.toBeInTheDocument();
  });

  it('shows an error banner on API failure and retries successfully', async () => {
    const fetchMock = createFetchMock({
      summary: [
        { error: 'network' },
        { ok: true, body: mockSummary },
      ],
      incidents: [
        { error: 'network' },
        { ok: true, body: mockIncidents },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to load dashboard data');
    });
    expect(screen.getByText(/Unable to reach the service health API/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Service health summary')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(2);
  });

  it('filters incidents through the mounted App', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

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

  it('shows a user-facing error for malformed API payloads', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        summary: { ok: true, body: { requests_total: -1 } },
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid summary response');
    });
    expect(screen.queryByLabelText('Service health summary')).not.toBeInTheDocument();
  });

  it('auto-refreshes on an interval and clears timers on unmount', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const fetchMock = createFetchMock({});
    vi.stubGlobal('fetch', fetchMock);

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText('Service health summary')).toBeInTheDocument();
    });

    const callsAfterInitialLoad = fetchMock.mock.calls.length;
    expect(callsAfterInitialLoad).toBe(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterInitialLoad);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    const callsAfterUnmount = fetchMock.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(fetchMock.mock.calls.length).toBe(callsAfterUnmount);
  });
});
