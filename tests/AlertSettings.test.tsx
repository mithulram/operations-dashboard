import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertSettingsSection } from '../src/components/AlertSettingsSection';
import { setAdminApiKey } from '../src/auth/adminKey';
import { renderWithProviders } from './testUtils';

const alertSettingsPayload = {
  enabled: false,
  send_resolved: true,
  smtp_host: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'smtp-user',
  smtp_from: 'monitor@example.com',
  alert_to: 'ops@example.com',
  smtp_password_configured: true,
  smtp_configured: true,
  alerts_ready: false,
  env_alerts_enabled: true,
  created_at: '2026-06-28T00:00:00Z',
  updated_at: '2026-06-28T00:00:00Z',
};

describe('AlertSettingsSection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('shows locked state without admin key', () => {
    renderWithProviders(<AlertSettingsSection />, { route: '/settings' });
    expect(screen.getByText('Alerts locked')).toBeInTheDocument();
    expect(screen.queryByLabelText('Alert recipient')).not.toBeInTheDocument();
  });

  it('loads settings with Bearer auth and does not display secrets', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret-key' });

      if (url.includes('/api/v1/settings/alerts/events')) {
        return { ok: true, json: async () => [] };
      }
      if (url.includes('/api/v1/settings/alerts')) {
        return { ok: true, json: async () => alertSettingsPayload };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    setAdminApiKey('secret-key');
    renderWithProviders(<AlertSettingsSection />, { route: '/settings' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('ops@example.com')).toBeInTheDocument();
    });

    expect(screen.queryByText('smtp-pass')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('smtp-pass')).not.toBeInTheDocument();
    expect(screen.getByText(/SMTP password is configured on the backend \(presence only\)/)).toBeInTheDocument();
  });

  it('updates recipient and enabled settings with Bearer auth', async () => {
    const user = userEvent.setup();
    let patchBody: unknown;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/events')) {
        return { ok: true, json: async () => [] };
      }
      if (url.endsWith('/api/v1/settings/alerts') && init?.method === 'PATCH') {
        patchBody = JSON.parse(String(init.body));
        return {
          ok: true,
          json: async () => ({
            ...alertSettingsPayload,
            enabled: true,
            alert_to: 'new-ops@example.com',
          }),
        };
      }
      if (url.includes('/api/v1/settings/alerts')) {
        return { ok: true, json: async () => alertSettingsPayload };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    setAdminApiKey('secret-key');
    renderWithProviders(<AlertSettingsSection />, { route: '/settings' });

    await waitFor(() => {
      expect(screen.getByLabelText('Alert recipient')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText('Alert recipient'));
    await user.type(screen.getByLabelText('Alert recipient'), 'new-ops@example.com');
    await user.click(screen.getByRole('checkbox', { name: 'Enable email alerts' }));

    await waitFor(() => {
      expect(patchBody).toMatchObject({ enabled: true });
    });

    await user.click(screen.getByRole('button', { name: 'Save alert settings' }));

    await waitFor(() => {
      expect(patchBody).toMatchObject({
        enabled: true,
        alert_to: 'new-ops@example.com',
      });
    });
  });

  it('calls test email endpoint', async () => {
    const user = userEvent.setup();
    let testCalled = false;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/test') && init?.method === 'POST') {
        testCalled = true;
        return {
          ok: true,
          json: async () => ({ status: 'sent', event_id: 1, recipient: 'ops@example.com' }),
        };
      }
      if (url.includes('/events')) {
        return { ok: true, json: async () => [] };
      }
      if (url.includes('/api/v1/settings/alerts')) {
        return { ok: true, json: async () => ({ ...alertSettingsPayload, enabled: true, alerts_ready: true }) };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    setAdminApiKey('secret-key');
    renderWithProviders(<AlertSettingsSection />, { route: '/settings' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send test email' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Send test email' }));

    await waitFor(() => {
      expect(testCalled).toBe(true);
      expect(screen.getByRole('status')).toHaveTextContent('Test email sent to ops@example.com');
    });
  });

  it('shows missing SMTP config message when backend is not configured', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/events')) {
        return { ok: true, json: async () => [] };
      }
      if (url.includes('/api/v1/settings/alerts')) {
        return {
          ok: true,
          json: async () => ({
            ...alertSettingsPayload,
            enabled: true,
            smtp_password_configured: false,
            smtp_configured: false,
            alerts_ready: false,
          }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    setAdminApiKey('secret-key');
    renderWithProviders(<AlertSettingsSection />, { route: '/settings' });

    await waitFor(() => {
      expect(screen.getByText(/Missing SMTP env on backend/)).toBeInTheDocument();
      expect(screen.getByText(/does not collect SMTP passwords/)).toBeInTheDocument();
    });
  });
});
