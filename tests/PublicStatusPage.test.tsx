import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicStatusPageRoute } from '../src/pages/PublicStatusPage';
import type { PublicStatusPage } from '../src/types';

const operationalStatus: PublicStatusPage = {
  title: 'Service Status',
  slug: 'default',
  overall_status: 'operational',
  updated_at: '2026-06-19T08:14:00Z',
  recent_incidents: [],
  components: [
    {
      id: 1,
      name: 'Core services',
      status: 'operational',
      monitors: [
        {
          id: 1,
          name: 'Example API',
          status: 'up',
          last_check_at: '2026-06-19T08:14:00Z',
          last_response_time_ms: 120,
        },
      ],
    },
  ],
};

const outageStatus: PublicStatusPage = {
  ...operationalStatus,
  overall_status: 'outage',
  components: [
    {
      ...operationalStatus.components[0],
      status: 'outage',
      monitors: [{ ...operationalStatus.components[0].monitors[0], status: 'down' }],
    },
  ],
};

function mockPublicFetch(payload: PublicStatusPage) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    expect(init?.headers).not.toMatchObject({ Authorization: expect.any(String) });
    if (url.includes('/api/public/v1/status/default')) {
      return { ok: true, json: async () => payload };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  });
}

describe('PublicStatusPageRoute', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders operational public status without admin navigation', async () => {
    vi.stubGlobal('fetch', mockPublicFetch(operationalStatus));

    render(
      <MemoryRouter initialEntries={['/status/default']}>
        <Routes>
          <Route path="/status/:slug" element={<PublicStatusPageRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('All systems operational')).toBeInTheDocument();
    });

    expect(screen.getByText('Example API')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('renders outage state', async () => {
    vi.stubGlobal('fetch', mockPublicFetch(outageStatus));

    render(
      <MemoryRouter initialEntries={['/status/default']}>
        <Routes>
          <Route path="/status/:slug" element={<PublicStatusPageRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Service outage')).toBeInTheDocument();
    });
  });

  it('renders sample badge on public status preview', async () => {
    vi.stubGlobal(
      'fetch',
      mockPublicFetch({
        ...operationalStatus,
        is_sample_data: true,
        sample_reason: 'No monitors have been configured yet',
      }),
    );

    render(
      <MemoryRouter initialEntries={['/status/default']}>
        <Routes>
          <Route path="/status/:slug" element={<PublicStatusPageRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Sample data · setup preview')).toBeInTheDocument();
    });
  });

  it('renders intentional empty and no-incident states', async () => {
    vi.stubGlobal(
      'fetch',
      mockPublicFetch({
        title: 'Service Status',
        slug: 'default',
        overall_status: 'unknown',
        updated_at: '2026-06-19T08:14:00Z',
        recent_incidents: [],
        components: [{ id: 1, name: 'Core services', status: 'unknown', monitors: [] }],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/status/default']}>
        <Routes>
          <Route path="/status/:slug" element={<PublicStatusPageRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Service components will appear here/i)).toBeInTheDocument();
    });

    expect(screen.getByText('No recent incidents reported.')).toBeInTheDocument();
    expect(screen.queryByText(/example\.com/i)).not.toBeInTheDocument();
  });

  it('renders recent incidents from public status JSON', async () => {
    vi.stubGlobal(
      'fetch',
      mockPublicFetch({
        ...operationalStatus,
        recent_incidents: [
          {
            title: 'Example API is down',
            status: 'OPEN',
            severity: 'SEV-2',
            started_at: '2026-06-28T00:00:00Z',
            resolved_at: null,
            updates_count: 1,
          },
        ],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/status/default']}>
        <Routes>
          <Route path="/status/:slug" element={<PublicStatusPageRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Recent incidents')).toBeInTheDocument();
      expect(screen.getByText('Example API is down')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
    });
  });
});
