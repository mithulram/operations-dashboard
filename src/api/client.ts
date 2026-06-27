import type { Incident, Summary } from '../types';
import { ApiError } from '../types';
import { normalizeApiBaseUrl } from '../utils';
import { parseIncidents, parseSummary } from './validate';

const API_BASE = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

function buildApiUrl(path: string, base: string = API_BASE): string {
  return base ? `${base}${path}` : path;
}

async function request<T>(path: string): Promise<T> {
  const url = buildApiUrl(path);

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError('Unable to reach the service health API. Is the backend running on port 8090?');
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
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

export { API_BASE, buildApiUrl };
