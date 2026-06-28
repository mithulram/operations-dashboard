import type {
  CheckHistoryItem,
  Incident,
  Monitor,
  MonitorStatus,
  PublicStatusComponent,
  PublicStatusLevel,
  PublicStatusMonitor,
  PublicStatusPage,
  AdminStatusPage,
  AdminStatusPageComponent,
  Summary,
} from '../types';
import { ApiError } from '../types';

const KNOWN_SEVERITIES = new Set(['SEV-1', 'SEV-2', 'SEV-3']);
const KNOWN_INCIDENT_STATUSES = new Set(['OPEN', 'RESOLVED']);
const KNOWN_MONITOR_STATUSES = new Set<MonitorStatus>(['up', 'down', 'paused', 'unknown']);
const KNOWN_HTTP_METHODS = new Set(['GET', 'HEAD']);
const KNOWN_PUBLIC_STATUS_LEVELS = new Set<PublicStatusLevel>([
  'operational',
  'degraded',
  'outage',
  'unknown',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRatio(value: unknown, field: string): number {
  if (!isFiniteNumber(value) || value < 0 || value > 1) {
    throw new ApiError(`Invalid summary response: ${field} must be a ratio between 0 and 1.`);
  }
  return value;
}

function isNonNegativeInteger(value: unknown, field: string): number {
  if (!isFiniteNumber(value) || !Number.isInteger(value) || value < 0) {
    throw new ApiError(`Invalid summary response: ${field} must be a non-negative integer.`);
  }
  return value;
}

function isValidIsoDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function optionalNonNegativeInteger(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return isNonNegativeInteger(value, field);
}

function optionalNullableNumber(value: unknown, field: string): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (!isFiniteNumber(value) || value < 0) {
    throw new ApiError(`Invalid summary response: ${field} must be a non-negative number or null.`);
  }
  return value;
}

export function parseSummary(data: unknown): Summary {
  if (!isRecord(data)) {
    throw new ApiError('Invalid summary response: expected an object.');
  }

  const requests_total = isNonNegativeInteger(data.requests_total, 'requests_total');
  const requests_successful = isNonNegativeInteger(data.requests_successful, 'requests_successful');
  const requests_failed = isNonNegativeInteger(data.requests_failed, 'requests_failed');
  const open_incident_count = isNonNegativeInteger(data.open_incident_count, 'open_incident_count');

  if (requests_successful + requests_failed > requests_total) {
    throw new ApiError(
      'Invalid summary response: successful and failed request counts exceed requests_total.',
    );
  }

  return {
    requests_total,
    requests_successful,
    requests_failed,
    availability_ratio: isRatio(data.availability_ratio, 'availability_ratio'),
    slo_target_ratio: isRatio(data.slo_target_ratio, 'slo_target_ratio'),
    error_budget_remaining_ratio: isRatio(
      data.error_budget_remaining_ratio,
      'error_budget_remaining_ratio',
    ),
    open_incident_count,
    monitors_total: optionalNonNegativeInteger(data.monitors_total, 'monitors_total'),
    monitors_up: optionalNonNegativeInteger(data.monitors_up, 'monitors_up'),
    monitors_down: optionalNonNegativeInteger(data.monitors_down, 'monitors_down'),
    monitors_paused: optionalNonNegativeInteger(data.monitors_paused, 'monitors_paused'),
    monitors_unknown: optionalNonNegativeInteger(data.monitors_unknown, 'monitors_unknown'),
    average_response_time_ms_24h: optionalNullableNumber(
      data.average_response_time_ms_24h,
      'average_response_time_ms_24h',
    ),
  };
}

function parseIncident(data: unknown, index: number): Incident {
  if (!isRecord(data)) {
    throw new ApiError(`Invalid incidents response: item at index ${index} must be an object.`);
  }

  const identifier = data.identifier;
  if (!isNonEmptyString(identifier)) {
    throw new ApiError(`Invalid incidents response: item at index ${index} is missing identifier.`);
  }

  const service = data.service;
  if (!isNonEmptyString(service)) {
    throw new ApiError(`Invalid incidents response: item at index ${index} is missing service.`);
  }

  const severity = data.severity;
  if (!isNonEmptyString(severity)) {
    throw new ApiError(`Invalid incidents response: item at index ${index} is missing severity.`);
  }
  if (!KNOWN_SEVERITIES.has(severity)) {
    throw new ApiError(
      `Invalid incidents response: item at index ${index} has unsupported severity "${severity}".`,
    );
  }

  const status = data.status;
  if (!isNonEmptyString(status)) {
    throw new ApiError(`Invalid incidents response: item at index ${index} is missing status.`);
  }
  if (!KNOWN_INCIDENT_STATUSES.has(status)) {
    throw new ApiError(
      `Invalid incidents response: item at index ${index} has unsupported status "${status}".`,
    );
  }

  const summary = data.summary;
  if (!isNonEmptyString(summary)) {
    throw new ApiError(`Invalid incidents response: item at index ${index} is missing summary.`);
  }

  const started_at = data.started_at;
  if (!isNonEmptyString(started_at) || !isValidIsoDate(started_at)) {
    throw new ApiError(
      `Invalid incidents response: item at index ${index} has an invalid started_at timestamp.`,
    );
  }

  return {
    identifier,
    service,
    severity,
    status,
    summary,
    started_at,
  };
}

export function parseIncidents(data: unknown): Incident[] {
  if (!Array.isArray(data)) {
    throw new ApiError('Invalid incidents response: expected an array.');
  }

  return data.map((item, index) => parseIncident(item, index));
}

export function parseMonitor(data: unknown, index: number): Monitor {
  if (!isRecord(data)) {
    throw new ApiError(`Invalid monitor response: item at index ${index} must be an object.`);
  }

  const id = isNonNegativeInteger(data.id, 'id');
  const name = data.name;
  if (!isNonEmptyString(name)) {
    throw new ApiError(`Invalid monitor response: item at index ${index} is missing name.`);
  }

  const url = data.url;
  if (!isNonEmptyString(url)) {
    throw new ApiError(`Invalid monitor response: item at index ${index} is missing url.`);
  }

  const method = data.method;
  if (!isNonEmptyString(method) || !KNOWN_HTTP_METHODS.has(method)) {
    throw new ApiError(`Invalid monitor response: item at index ${index} has invalid method.`);
  }

  const last_status = data.last_status;
  const parsedStatus: MonitorStatus =
    isNonEmptyString(last_status) && KNOWN_MONITOR_STATUSES.has(last_status as MonitorStatus)
      ? (last_status as MonitorStatus)
      : 'unknown';

  return {
    id,
    name,
    url,
    method: method as Monitor['method'],
    interval_seconds: isNonNegativeInteger(data.interval_seconds, 'interval_seconds'),
    timeout_seconds: isNonNegativeInteger(data.timeout_seconds, 'timeout_seconds'),
    expected_status_min: isNonNegativeInteger(data.expected_status_min, 'expected_status_min'),
    expected_status_max: isNonNegativeInteger(data.expected_status_max, 'expected_status_max'),
    is_paused: Boolean(data.is_paused),
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
    last_check_at:
      data.last_check_at === null || data.last_check_at === undefined
        ? null
        : String(data.last_check_at),
    last_status: parsedStatus,
    last_status_code:
      data.last_status_code === null || data.last_status_code === undefined
        ? null
        : isNonNegativeInteger(data.last_status_code, 'last_status_code'),
    last_response_time_ms:
      data.last_response_time_ms === null || data.last_response_time_ms === undefined
        ? null
        : isNonNegativeInteger(data.last_response_time_ms, 'last_response_time_ms'),
    consecutive_failures: isNonNegativeInteger(data.consecutive_failures, 'consecutive_failures'),
    uptime_ratio_24h:
      data.uptime_ratio_24h === null || data.uptime_ratio_24h === undefined
        ? null
        : isRatio(data.uptime_ratio_24h, 'uptime_ratio_24h'),
    uptime_ratio_7d:
      data.uptime_ratio_7d === null || data.uptime_ratio_7d === undefined
        ? null
        : isRatio(data.uptime_ratio_7d, 'uptime_ratio_7d'),
  };
}

export function parseMonitors(data: unknown): Monitor[] {
  if (!Array.isArray(data)) {
    throw new ApiError('Invalid monitors response: expected an array.');
  }
  return data.map((item, index) => parseMonitor(item, index));
}

export function parseCheckHistory(data: unknown): CheckHistoryItem[] {
  if (!Array.isArray(data)) {
    throw new ApiError('Invalid check history response: expected an array.');
  }

  return data.map((item, index) => {
    if (!isRecord(item)) {
      throw new ApiError(`Invalid check history response: item at index ${index} must be an object.`);
    }

    const checked_at = item.checked_at;
    if (!isNonEmptyString(checked_at) || !isValidIsoDate(checked_at)) {
      throw new ApiError(
        `Invalid check history response: item at index ${index} has invalid checked_at.`,
      );
    }

    return {
      checked_at,
      status_code:
        item.status_code === null || item.status_code === undefined
          ? null
          : isNonNegativeInteger(item.status_code, 'status_code'),
      response_time_ms:
        item.response_time_ms === null || item.response_time_ms === undefined
          ? null
          : isNonNegativeInteger(item.response_time_ms, 'response_time_ms'),
      success: Boolean(item.success),
      error_message:
        item.error_message === null || item.error_message === undefined
          ? null
          : String(item.error_message),
    };
  });
}

function parsePublicStatusLevel(value: unknown, field: string): PublicStatusLevel {
  if (!isNonEmptyString(value) || !KNOWN_PUBLIC_STATUS_LEVELS.has(value as PublicStatusLevel)) {
    throw new ApiError(`Invalid status page response: ${field} is invalid.`);
  }
  return value as PublicStatusLevel;
}

function parsePublicStatusMonitor(data: unknown, index: number): PublicStatusMonitor {
  if (!isRecord(data)) {
    throw new ApiError(`Invalid status page response: monitor at index ${index} must be an object.`);
  }

  const status = data.status;
  const parsedStatus: MonitorStatus =
    isNonEmptyString(status) && KNOWN_MONITOR_STATUSES.has(status as MonitorStatus)
      ? (status as MonitorStatus)
      : 'unknown';

  const monitor: PublicStatusMonitor = {
    id: isNonNegativeInteger(data.id, 'id'),
    name: isNonEmptyString(data.name) ? data.name : 'Monitor',
    status: parsedStatus,
    last_check_at:
      data.last_check_at === null || data.last_check_at === undefined
        ? null
        : String(data.last_check_at),
  };

  if ('last_response_time_ms' in data) {
    monitor.last_response_time_ms =
      data.last_response_time_ms === null || data.last_response_time_ms === undefined
        ? null
        : isNonNegativeInteger(data.last_response_time_ms, 'last_response_time_ms');
  }

  return monitor;
}

function parsePublicStatusComponent(data: unknown, index: number): PublicStatusComponent {
  if (!isRecord(data)) {
    throw new ApiError(
      `Invalid status page response: component at index ${index} must be an object.`,
    );
  }

  const monitors = data.monitors;
  if (!Array.isArray(monitors)) {
    throw new ApiError(
      `Invalid status page response: component at index ${index} must include monitors array.`,
    );
  }

  return {
    id: isNonNegativeInteger(data.id, 'id'),
    name: isNonEmptyString(data.name) ? data.name : 'Component',
    status: parsePublicStatusLevel(data.status, 'status'),
    monitors: monitors.map((item, monitorIndex) => parsePublicStatusMonitor(item, monitorIndex)),
  };
}

export function parsePublicStatusPage(data: unknown): PublicStatusPage {
  if (!isRecord(data)) {
    throw new ApiError('Invalid status page response: expected an object.');
  }

  const components = data.components;
  if (!Array.isArray(components)) {
    throw new ApiError('Invalid status page response: expected components array.');
  }

  const updated_at = data.updated_at;
  if (!isNonEmptyString(updated_at) || !isValidIsoDate(updated_at)) {
    throw new ApiError('Invalid status page response: updated_at is invalid.');
  }

  return {
    title: isNonEmptyString(data.title) ? data.title : 'Status',
    slug: isNonEmptyString(data.slug) ? data.slug : 'default',
    overall_status: parsePublicStatusLevel(data.overall_status, 'overall_status'),
    updated_at,
    components: components.map((item, index) => parsePublicStatusComponent(item, index)),
    recent_incidents: Array.isArray(data.recent_incidents) ? data.recent_incidents : [],
  };
}

function parseAdminStatusPageComponent(data: unknown, index: number): AdminStatusPageComponent {
  if (!isRecord(data)) {
    throw new ApiError(
      `Invalid admin status page response: component at index ${index} must be an object.`,
    );
  }

  const monitor_ids = data.monitor_ids;
  if (!Array.isArray(monitor_ids)) {
    throw new ApiError(
      `Invalid admin status page response: component at index ${index} must include monitor_ids.`,
    );
  }

  return {
    id: isNonNegativeInteger(data.id, 'id'),
    name: isNonEmptyString(data.name) ? data.name : 'Component',
    sort_order: isNonNegativeInteger(data.sort_order, 'sort_order'),
    monitor_ids: monitor_ids.map((value, monitorIndex) =>
      isNonNegativeInteger(value, `monitor_ids[${monitorIndex}]`),
    ),
  };
}

export function parseStatusPage(data: unknown): AdminStatusPage {
  if (!isRecord(data)) {
    throw new ApiError('Invalid admin status page response: expected an object.');
  }

  const components = data.components;
  if (!Array.isArray(components)) {
    throw new ApiError('Invalid admin status page response: expected components array.');
  }

  return {
    id: isNonNegativeInteger(data.id, 'id'),
    slug: isNonEmptyString(data.slug) ? data.slug : 'default',
    title: isNonEmptyString(data.title) ? data.title : 'Status',
    is_public: Boolean(data.is_public),
    show_response_times: Boolean(data.show_response_times),
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
    components: components.map((item, index) => parseAdminStatusPageComponent(item, index)),
  };
}
