export interface Summary {
  requests_total: number;
  requests_successful: number;
  requests_failed: number;
  availability_ratio: number;
  slo_target_ratio: number;
  error_budget_remaining_ratio: number;
  open_incident_count: number;
}

export interface Incident {
  identifier: string;
  service: string;
  severity: string;
  status: string;
  summary: string;
  started_at: string;
}

export type SeverityFilter = 'ALL' | 'SEV-1' | 'SEV-2' | 'SEV-3';
export type StatusFilter = 'ALL' | 'OPEN' | 'RESOLVED';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
