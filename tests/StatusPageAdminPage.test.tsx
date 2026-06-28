import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setAdminApiKey } from '../src/auth/adminKey';
import { StatusPageAdminPage } from '../src/pages/StatusPageAdminPage';
import { renderWithProviders } from './testUtils';

const adminStatusPage = {
  id: 1,
  slug: 'default',
  title: 'Service Status',
  is_public: true,
  show_response_times: true,
  created_at: '2026-06-19T08:14:00Z',
  updated_at: '2026-06-19T08:14:00Z',
  components: [{ id: 1, name: 'Core services', sort_order: 0, monitor_ids: [] }],
};

const publicStatusPage = {
  title: 'Service Status',
  slug: 'default',
  overall_status: 'unknown',
  updated_at: '2026-06-19T08:14:00Z',
  recent_incidents: [],
  components: [{ id: 1, name: 'Core services', status: 'unknown', monitors: [] }],
};

function createStatusFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes('/api/public/v1/status/default')) {
      expect(init?.headers).not.toMatchObject({ Authorization: expect.any(String) });
      return { ok: true, json: async () => publicStatusPage };
    }

    if (url.includes('/api/v1/status-page')) {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-admin-key' });
      return { ok: true, json: async () => adminStatusPage };
    }

    if (url.includes('/api/v1/monitors') && !url.includes('/checks')) {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-admin-key' });
      return { ok: true, json: async () => [] };
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });
}

describe('StatusPageAdminPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows locked state without admin key', () => {
    renderWithProviders(<StatusPageAdminPage />, { route: '/status-page' });
    expect(screen.getByText('Status page builder is locked')).toBeInTheDocument();
  });

  it('renders title and components with admin key', async () => {
    setAdminApiKey('test-admin-key');
    vi.stubGlobal('fetch', createStatusFetchMock());

    renderWithProviders(<StatusPageAdminPage />, { route: '/status-page' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Service Status')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Core services')).toBeInTheDocument();
    expect(screen.getByText('Public preview')).toBeInTheDocument();
  });
});
