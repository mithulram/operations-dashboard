import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IncidentsPage } from '../src/pages/IncidentsPage';
import { setAdminApiKey } from '../src/auth/adminKey';
import { renderWithProviders } from './testUtils';

const realIncident = {
  id: 1,
  identifier: 'INC-0001',
  monitor_id: 1,
  monitor_name: 'Example API',
  service: 'Example API',
  title: 'Example API is down',
  severity: 'SEV-2',
  status: 'OPEN',
  summary: 'Monitor check failed: HTTP 503',
  started_at: '2026-06-28T00:00:00Z',
  acknowledged_at: null,
  resolved_at: null,
  auto_created: true,
};

const incidentUpdates = [
  {
    id: 1,
    incident_id: 1,
    message: 'Monitor check failed: HTTP 503',
    status: 'OPEN',
    created_at: '2026-06-28T00:00:00Z',
  },
];

describe('IncidentsPage timeline', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders real incident fields from the public incidents list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/v1/incidents')) {
          return { ok: true, json: async () => [realIncident] };
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      }),
    );

    renderWithProviders(<IncidentsPage />, { route: '/incidents' });

    await waitFor(() => {
      expect(screen.getByText('INC-0001')).toBeInTheDocument();
      expect(screen.getByText('Example API')).toBeInTheDocument();
      expect(screen.getByText('Monitor check failed: HTTP 503')).toBeInTheDocument();
    });
  });

  it('shows read-only incident detail without admin key', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/v1/incidents/1')) {
          return { ok: true, json: async () => realIncident };
        }
        if (url.endsWith('/api/v1/incidents/1/updates')) {
          return { ok: true, json: async () => incidentUpdates };
        }
        if (url.endsWith('/api/v1/incidents')) {
          return { ok: true, json: async () => [realIncident] };
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      }),
    );

    renderWithProviders(<IncidentsPage />, { route: '/incidents' });
    await waitFor(() => expect(screen.getByText('INC-0001')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /INC-0001/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Example API is down')).toBeInTheDocument();
    expect(within(dialog).getByText(/Save your admin API key/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Acknowledge' })).not.toBeInTheDocument();
  });

  it('acknowledge and add update send Bearer token', async () => {
    const user = userEvent.setup();
    let patchHeaders: HeadersInit | undefined;
    let postHeaders: HeadersInit | undefined;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/v1/incidents/1') && init?.method === 'PATCH') {
          patchHeaders = init.headers;
          return {
            ok: true,
            json: async () => ({ ...realIncident, status: 'ACKNOWLEDGED' }),
          };
        }
        if (url.endsWith('/api/v1/incidents/1/updates') && init?.method === 'POST') {
          postHeaders = init.headers;
          return {
            ok: true,
            json: async () => ({
              id: 2,
              incident_id: 1,
              message: 'Investigating root cause.',
              status: null,
              created_at: '2026-06-28T00:05:00Z',
            }),
          };
        }
        if (url.endsWith('/api/v1/incidents/1/updates')) {
          return { ok: true, json: async () => incidentUpdates };
        }
        if (url.endsWith('/api/v1/incidents/1')) {
          return { ok: true, json: async () => realIncident };
        }
        if (url.endsWith('/api/v1/incidents')) {
          return { ok: true, json: async () => [realIncident] };
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      }),
    );

    setAdminApiKey('secret-key');
    renderWithProviders(<IncidentsPage />, { route: '/incidents' });
    await waitFor(() => expect(screen.getByText('INC-0001')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /INC-0001/i }));

    await user.click(await screen.findByRole('button', { name: 'Acknowledge' }));
    await waitFor(() => {
      expect(patchHeaders).toMatchObject({ Authorization: 'Bearer secret-key' });
    });

    await user.type(screen.getByLabelText('Add update'), 'Investigating root cause.');
    await user.click(screen.getByRole('button', { name: 'Post update' }));
    await waitFor(() => {
      expect(postHeaders).toMatchObject({ Authorization: 'Bearer secret-key' });
    });
  });
});
