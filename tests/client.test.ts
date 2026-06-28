import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildApiUrl,
  fetchPublicStatus,
  fetchSummary,
  getAlertEvents,
  getAlertSettings,
  getMonitors,
  getStatusPage,
  runMonitorCheck,
  sendTestAlert,
  updateAlertSettings,
} from '../src/api/client';
import { normalizeApiBaseUrl } from '../src/utils';

describe('normalizeApiBaseUrl', () => {
  it('returns an empty string when unset', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('');
    expect(normalizeApiBaseUrl('')).toBe('');
  });

  it('removes trailing slashes from deployed origins', () => {
    expect(normalizeApiBaseUrl('https://monitor.example.com/')).toBe(
      'https://monitor.example.com',
    );
    expect(normalizeApiBaseUrl('https://monitor.example.com///')).toBe(
      'https://monitor.example.com',
    );
  });

  it('preserves origins without trailing slashes', () => {
    expect(normalizeApiBaseUrl('https://monitor.example.com')).toBe(
      'https://monitor.example.com',
    );
  });
});

describe('buildApiUrl', () => {
  it('uses relative paths when the API base URL is empty', () => {
    expect(buildApiUrl('/healthz', '')).toBe('/healthz');
    expect(buildApiUrl('/api/v1/summary', '')).toBe('/api/v1/summary');
  });

  it('joins deployed API origins without double slashes', () => {
    const base = normalizeApiBaseUrl('https://monitor.example.com/');
    expect(buildApiUrl('/api/v1/incidents', base)).toBe(
      'https://monitor.example.com/api/v1/incidents',
    );
    expect(buildApiUrl('/healthz', base)).toBe('https://monitor.example.com/healthz');
  });
});

describe('protected API client auth headers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes Bearer token only for protected monitor calls', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/v1/summary')) {
        expect(init?.headers).not.toMatchObject({ Authorization: expect.any(String) });
        return {
          ok: true,
          json: async () => ({
            requests_total: 1,
            requests_successful: 1,
            requests_failed: 0,
            availability_ratio: 1,
            slo_target_ratio: 0.995,
            error_budget_remaining_ratio: 1,
            open_incident_count: 0,
          }),
        };
      }
      if (url.includes('/api/v1/monitors')) {
        expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret-key' });
        return { ok: true, json: async () => [] };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchSummary();
    await getMonitors('secret-key');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sends Authorization header when running a monitor check', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret-key' });
      expect(init?.method).toBe('POST');
      return {
        ok: true,
        json: async () => ({
          monitor_id: 1,
          checked_at: '2026-06-19T08:14:00Z',
          status_code: 200,
          response_time_ms: 100,
          success: true,
          error_message: null,
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    await runMonitorCheck(1, 'secret-key');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws before calling fetch when auth is required but missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMonitors(null)).rejects.toThrow(/Admin API key is required/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not send Authorization for public status fetch', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).not.toMatchObject({ Authorization: expect.any(String) });
      return {
        ok: true,
        json: async () => ({
          title: 'Service Status',
          slug: 'default',
          overall_status: 'unknown',
          updated_at: '2026-06-19T08:14:00Z',
          components: [],
          recent_incidents: [],
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchPublicStatus('default');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends Authorization for protected status page admin calls', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret-key' });
      return {
        ok: true,
        json: async () => ({
          id: 1,
          slug: 'default',
          title: 'Service Status',
          is_public: true,
          show_response_times: true,
          created_at: '2026-06-19T08:14:00Z',
          updated_at: '2026-06-19T08:14:00Z',
          components: [],
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    await getStatusPage('secret-key');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends Authorization for alert settings calls', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret-key' });
      const url = String(input);
      if (url.includes('/events')) {
        return { ok: true, json: async () => [] };
      }
      if (url.includes('/test')) {
        return { ok: true, json: async () => ({ status: 'sent', event_id: 1, recipient: 'ops@example.com' }) };
      }
      if (url.includes('/settings/alerts')) {
        return {
          ok: true,
          json: async () => ({
            enabled: true,
            send_resolved: true,
            smtp_host: 'smtp.example.com',
            smtp_port: 587,
            smtp_username: null,
            smtp_from: 'monitor@example.com',
            alert_to: 'ops@example.com',
            smtp_password_configured: true,
            smtp_configured: true,
            alerts_ready: true,
            env_alerts_enabled: true,
            created_at: '2026-06-28T00:00:00Z',
            updated_at: '2026-06-28T00:00:00Z',
          }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await getAlertSettings('secret-key');
    await updateAlertSettings({ enabled: true }, 'secret-key');
    await sendTestAlert('secret-key');
    await getAlertEvents('secret-key');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
