import type {
  CheckHistoryItem,
  Incident,
  Monitor,
  MonitorInput,
  PublicStatusPage,
  AdminStatusPage,
  StatusPageComponentInput,
  StatusPageUpdateInput,
  Summary,
} from '../types';
import { ApiError } from '../types';
import { normalizeApiBaseUrl } from '../utils';
import {
  parseCheckHistory,
  parseIncidents,
  parseMonitor,
  parseMonitors,
  parsePublicStatusPage,
  parseStatusPage,
  parseSummary,
} from './validate';

const API_BASE = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function buildApiUrl(path: string, base: string = API_BASE): string {
  return base ? `${base}${path}` : path;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  adminApiKey?: string | null;
  requireAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, adminApiKey, requireAuth = false } = options;

  if (requireAuth && !adminApiKey) {
    throw new ApiError('Admin API key is required for monitor management.', 401);
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (adminApiKey) {
    headers.Authorization = `Bearer ${adminApiKey}`;
  }

  const url = buildApiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Unable to reach the service health API. Is the backend running on port 8090?');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        detail = payload.detail;
      }
    } catch {
      // ignore parse errors for error bodies
    }
    throw new ApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/healthz');
}

export async function fetchSummary(): Promise<Summary> {
  const data = await request<unknown>('/api/v1/summary');
  return parseSummary(data);
}

export async function fetchIncidents(): Promise<Incident[]> {
  const data = await request<unknown>('/api/v1/incidents');
  return parseIncidents(data);
}

export async function fetchDashboardData(): Promise<{ summary: Summary; incidents: Incident[] }> {
  const [summary, incidents] = await Promise.all([fetchSummary(), fetchIncidents()]);
  return { summary, incidents };
}

export async function getMonitors(adminApiKey: string | null): Promise<Monitor[]> {
  const data = await request<unknown>('/api/v1/monitors', {
    adminApiKey,
    requireAuth: true,
  });
  return parseMonitors(data);
}

export async function createMonitor(
  input: MonitorInput,
  adminApiKey: string | null,
): Promise<Monitor> {
  const data = await request<unknown>('/api/v1/monitors', {
    method: 'POST',
    body: input,
    adminApiKey,
    requireAuth: true,
  });
  return parseMonitor(data, 0);
}

export async function updateMonitor(
  id: number,
  input: Partial<MonitorInput>,
  adminApiKey: string | null,
): Promise<Monitor> {
  const data = await request<unknown>(`/api/v1/monitors/${id}`, {
    method: 'PATCH',
    body: input,
    adminApiKey,
    requireAuth: true,
  });
  return parseMonitor(data, 0);
}

export async function deleteMonitor(id: number, adminApiKey: string | null): Promise<void> {
  await request<void>(`/api/v1/monitors/${id}`, {
    method: 'DELETE',
    adminApiKey,
    requireAuth: true,
  });
}

export async function runMonitorCheck(
  id: number,
  adminApiKey: string | null,
): Promise<CheckHistoryItem & { monitor_id: number }> {
  return request<CheckHistoryItem & { monitor_id: number }>(`/api/v1/checks/run/${id}`, {
    method: 'POST',
    adminApiKey,
    requireAuth: true,
  });
}

export async function getMonitorChecks(
  id: number,
  adminApiKey: string | null,
  limit = 50,
): Promise<CheckHistoryItem[]> {
  const data = await request<unknown>(`/api/v1/monitors/${id}/checks?limit=${limit}`, {
    adminApiKey,
    requireAuth: true,
  });
  return parseCheckHistory(data);
}

export async function getStatusPage(adminApiKey: string | null): Promise<AdminStatusPage> {
  const data = await request<unknown>('/api/v1/status-page', {
    adminApiKey,
    requireAuth: true,
  });
  return parseStatusPage(data);
}

export async function updateStatusPage(
  input: StatusPageUpdateInput,
  adminApiKey: string | null,
): Promise<AdminStatusPage> {
  const data = await request<unknown>('/api/v1/status-page', {
    method: 'PATCH',
    body: input,
    adminApiKey,
    requireAuth: true,
  });
  return parseStatusPage(data);
}

export async function createStatusPageComponent(
  input: StatusPageComponentInput,
  adminApiKey: string | null,
): Promise<AdminStatusPage> {
  const data = await request<unknown>('/api/v1/status-page/components', {
    method: 'POST',
    body: input,
    adminApiKey,
    requireAuth: true,
  });
  return parseStatusPage(data);
}

export async function updateStatusPageComponent(
  id: number,
  input: Partial<StatusPageComponentInput>,
  adminApiKey: string | null,
): Promise<AdminStatusPage> {
  const data = await request<unknown>(`/api/v1/status-page/components/${id}`, {
    method: 'PATCH',
    body: input,
    adminApiKey,
    requireAuth: true,
  });
  return parseStatusPage(data);
}

export async function deleteStatusPageComponent(
  id: number,
  adminApiKey: string | null,
): Promise<AdminStatusPage> {
  const data = await request<unknown>(`/api/v1/status-page/components/${id}`, {
    method: 'DELETE',
    adminApiKey,
    requireAuth: true,
  });
  return parseStatusPage(data);
}

export async function addMonitorToComponent(
  componentId: number,
  monitorId: number,
  adminApiKey: string | null,
): Promise<AdminStatusPage> {
  const data = await request<unknown>(
    `/api/v1/status-page/components/${componentId}/monitors/${monitorId}`,
    {
      method: 'POST',
      adminApiKey,
      requireAuth: true,
    },
  );
  return parseStatusPage(data);
}

export async function removeMonitorFromComponent(
  componentId: number,
  monitorId: number,
  adminApiKey: string | null,
): Promise<AdminStatusPage> {
  const data = await request<unknown>(
    `/api/v1/status-page/components/${componentId}/monitors/${monitorId}`,
    {
      method: 'DELETE',
      adminApiKey,
      requireAuth: true,
    },
  );
  return parseStatusPage(data);
}

export async function fetchPublicStatus(slug: string): Promise<PublicStatusPage> {
  const data = await request<unknown>(`/api/public/v1/status/${encodeURIComponent(slug)}`);
  return parsePublicStatusPage(data);
}

export { API_BASE };
