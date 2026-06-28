export interface FleetSummaryFields {
  monitors_total?: number;
  monitors_up?: number;
  monitors_down?: number;
  monitors_paused?: number;
  monitors_unknown?: number;
  average_response_time_ms_24h?: number | null;
}

export interface Summary extends FleetSummaryFields {
  requests_total: number;
  requests_successful: number;
  requests_failed: number;
  availability_ratio: number;
  slo_target_ratio: number;
  error_budget_remaining_ratio: number;
  open_incident_count: number;
  is_sample_data?: boolean;
  sample_reason?: string;
}

export interface Incident {
  id?: number;
  identifier: string;
  monitor_id?: number | null;
  monitor_name?: string | null;
  service: string;
  title?: string;
  severity: string;
  status: string;
  summary: string;
  started_at: string;
  is_sample?: boolean;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  auto_created?: boolean;
}

export interface IncidentUpdate {
  id: number;
  incident_id: number;
  message: string;
  status: string | null;
  created_at: string;
}

export interface IncidentUpdateInput {
  status?: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'open' | 'acknowledged' | 'resolved';
}

export interface PublicRecentIncident {
  title: string;
  status: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  updates_count: number;
}

export type SeverityFilter = 'ALL' | 'SEV-1' | 'SEV-2' | 'SEV-3';
export type StatusFilter = 'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type MonitorStatus = 'up' | 'down' | 'paused' | 'unknown';
export type HttpMethod = 'GET' | 'HEAD';

export interface Monitor {
  id: number;
  name: string;
  url: string;
  method: HttpMethod;
  interval_seconds: number;
  timeout_seconds: number;
  expected_status_min: number;
  expected_status_max: number;
  is_paused: boolean;
  created_at: string;
  updated_at: string;
  last_check_at: string | null;
  last_status: MonitorStatus;
  last_status_code: number | null;
  last_response_time_ms: number | null;
  consecutive_failures: number;
  uptime_ratio_24h: number | null;
  uptime_ratio_7d: number | null;
}

export interface CheckHistoryItem {
  checked_at: string;
  status_code: number | null;
  response_time_ms: number | null;
  success: boolean;
  error_message: string | null;
}

export interface MonitorInput {
  name: string;
  url: string;
  method: HttpMethod;
  interval_seconds: number;
  timeout_seconds: number;
  expected_status_min: number;
  expected_status_max: number;
  is_paused: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function hasFleetSummary(summary: Summary): boolean {
  return typeof summary.monitors_total === 'number';
}

export function isSampleSummary(summary: Summary): boolean {
  return summary.is_sample_data === true;
}

export function isSampleIncident(incident: Incident): boolean {
  return incident.is_sample === true;
}

export type PublicStatusLevel = 'operational' | 'degraded' | 'outage' | 'unknown';

export interface PublicStatusMonitor {
  id: number;
  name: string;
  status: MonitorStatus;
  last_check_at: string | null;
  last_response_time_ms?: number | null;
}

export interface PublicStatusComponent {
  id: number;
  name: string;
  status: PublicStatusLevel;
  monitors: PublicStatusMonitor[];
}

export interface PublicStatusPage {
  title: string;
  slug: string;
  overall_status: PublicStatusLevel;
  updated_at: string;
  components: PublicStatusComponent[];
  recent_incidents: PublicRecentIncident[];
  is_sample_data?: boolean;
  sample_reason?: string;
}

export interface AdminStatusPageComponent {
  id: number;
  name: string;
  sort_order: number;
  monitor_ids: number[];
}

export interface AdminStatusPage {
  id: number;
  slug: string;
  title: string;
  is_public: boolean;
  show_response_times: boolean;
  created_at: string;
  updated_at: string;
  components: AdminStatusPageComponent[];
}

export interface StatusPageUpdateInput {
  title?: string;
  is_public?: boolean;
  show_response_times?: boolean;
}

export interface StatusPageComponentInput {
  name: string;
  sort_order?: number;
}

export interface AlertSettings {
  enabled: boolean;
  send_resolved: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_from: string | null;
  alert_to: string | null;
  smtp_password_configured: boolean;
  smtp_configured: boolean;
  alerts_ready: boolean;
  env_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertSettingsUpdateInput {
  enabled?: boolean;
  send_resolved?: boolean;
  smtp_from?: string | null;
  alert_to?: string | null;
}

export interface AlertEvent {
  id: number;
  monitor_id: number | null;
  check_result_id: number | null;
  event_type: 'opened' | 'resolved' | 'test' | string;
  recipient: string;
  subject: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface TestAlertResponse {
  status: string;
  event_id: number;
  recipient: string;
}
