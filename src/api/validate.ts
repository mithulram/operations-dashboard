import type { Incident, Summary } from '../types';
import { ApiError } from '../types';

const KNOWN_SEVERITIES = new Set(['SEV-1', 'SEV-2', 'SEV-3']);
const KNOWN_STATUSES = new Set(['OPEN', 'RESOLVED']);

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
  if (!KNOWN_STATUSES.has(status)) {
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
