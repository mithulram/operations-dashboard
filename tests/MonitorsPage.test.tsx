import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setAdminApiKey } from '../src/auth/adminKey';
import { MonitorsPage } from '../src/pages/MonitorsPage';
import type { Monitor } from '../src/types';
import { renderWithProviders } from './testUtils';

const mockMonitor: Monitor = {
  id: 7,
  name: 'Render health',
  url: 'https://example.com/healthz',
  method: 'GET',
  interval_seconds: 60,
  timeout_seconds: 5,
  expected_status_min: 200,
  expected_status_max: 399,
  is_paused: false,
  created_at: '2026-06-19T08:14:00Z',
  updated_at: '2026-06-19T08:14:00Z',
  last_check_at: '2026-06-19T08:15:00Z',
  last_status: 'up',
  last_status_code: 200,
  last_response_time_ms: 118,
  consecutive_failures: 0,
  uptime_ratio_24h: 0.995,
  uptime_ratio_7d: 0.991,
};

function createMonitorFetchMock(outcome: 'ok' | 'unauthorized' = 'ok') {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes('/api/v1/monitors') && !url.includes('/checks')) {
      if (outcome === 'unauthorized') {
        return {
          ok: false,
          status: 401,
          json: async () => ({ detail: 'Invalid admin API key' }),
        };
      }
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer test-admin-key',
      });
      return { ok: true, json: async () => [mockMonitor] };
    }

    if (url.includes('/api/v1/checks/run/')) {
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer test-admin-key',
      });
      return {
        ok: true,
        json: async () => ({
          monitor_id: mockMonitor.id,
          checked_at: '2026-06-19T08:16:00Z',
          status_code: 200,
          response_time_ms: 95,
          success: true,
          error_message: null,
        }),
      };
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });
}

describe('MonitorsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows locked state when no admin key is saved', () => {
    renderWithProviders(<MonitorsPage />, { route: '/monitors' });

    expect(screen.getByText('Monitor management')).toBeInTheDocument();
    expect(screen.getByText(/Dashboard, incidents, and public status stay readable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Connect admin key' })).toHaveAttribute('href', '/settings');
    expect(screen.queryByRole('button', { name: 'Add monitor' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Bearer /)).not.toBeInTheDocument();
  });

  it('shows guided empty state when authenticated with no monitors', async () => {
    setAdminApiKey('test-admin-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/v1/monitors') && !url.includes('/checks')) {
          return { ok: true, json: async () => [] };
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      }),
    );

    renderWithProviders(<MonitorsPage />, { route: '/monitors' });

    await waitFor(() => {
      expect(screen.getByLabelText('No monitors')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Add your first monitor' })).toBeInTheDocument();
  });

  it('prefills the monitor form from a sample template', async () => {
    const user = userEvent.setup();
    setAdminApiKey('test-admin-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/v1/monitors') && !url.includes('/checks')) {
          return { ok: true, json: async () => [] };
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      }),
    );

    renderWithProviders(<MonitorsPage />, { route: '/monitors' });

    await waitFor(() => {
      expect(screen.getByLabelText('Sample monitor templates')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Website uptime/i }));

    expect(screen.getByDisplayValue('Website uptime')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
  });

  it('opens prefilled monitor form from template query param', async () => {
    setAdminApiKey('test-admin-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/v1/monitors') && !url.includes('/checks')) {
          return { ok: true, json: async () => [] };
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      }),
    );

    renderWithProviders(<MonitorsPage />, { route: '/monitors?template=api-health' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('API health check')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('https://api.example.com/health')).toBeInTheDocument();
  });

  it('renders mocked monitors when authenticated', async () => {
    setAdminApiKey('test-admin-key');
    vi.stubGlobal('fetch', createMonitorFetchMock());

    renderWithProviders(<MonitorsPage />, { route: '/monitors' });

    await waitFor(() => {
      expect(screen.getByText('Render health')).toBeInTheDocument();
    });

    expect(screen.getByText(/example\.com\/healthz/)).toBeInTheDocument();
  });

  it('shows helpful locked-state messaging for unauthorized monitor routes', async () => {
    setAdminApiKey('bad-key');
    vi.stubGlobal('fetch', createMonitorFetchMock('unauthorized'));

    renderWithProviders(<MonitorsPage />, { route: '/monitors' });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Monitor management is locked. Verify your admin API key in Settings.',
      );
    });
  });

  it('runs a monitor check with Authorization header', async () => {
    const user = userEvent.setup();
    setAdminApiKey('test-admin-key');
    const fetchMock = createMonitorFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<MonitorsPage />, { route: '/monitors' });

    await waitFor(() => {
      expect(screen.getByText('Render health')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Run check' }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/v1/checks/run/7'))).toBe(
        true,
      );
    });
  });
});
