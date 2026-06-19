import type { SeverityFilter, StatusFilter } from '../types';

interface FilterBarProps {
  severity: SeverityFilter;
  status: StatusFilter;
  onSeverityChange: (value: SeverityFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
  resultCount: number;
  totalCount: number;
}

const severityOptions: SeverityFilter[] = ['ALL', 'SEV-1', 'SEV-2', 'SEV-3'];
const statusOptions: StatusFilter[] = ['ALL', 'OPEN', 'RESOLVED'];

export function FilterBar({
  severity,
  status,
  onSeverityChange,
  onStatusChange,
  resultCount,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="filter-bar" role="search" aria-label="Incident filters">
      <fieldset className="filter-group">
        <legend>Severity</legend>
        <div className="filter-options" role="group" aria-label="Filter by severity">
          {severityOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`filter-chip ${severity === option ? 'filter-chip--active' : ''}`}
              aria-pressed={severity === option}
              onClick={() => onSeverityChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="filter-group">
        <legend>Status</legend>
        <div className="filter-options" role="group" aria-label="Filter by status">
          {statusOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`filter-chip ${status === option ? 'filter-chip--active' : ''}`}
              aria-pressed={status === option}
              onClick={() => onStatusChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="filter-count" aria-live="polite">
        Showing {resultCount} of {totalCount} incidents
      </p>
    </div>
  );
}
