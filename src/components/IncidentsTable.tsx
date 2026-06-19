import type { Incident } from '../types';
import { formatTimestamp } from '../utils';

interface IncidentsTableProps {
  incidents: Incident[];
}

function severityClass(severity: string): string {
  switch (severity) {
    case 'SEV-1':
      return 'badge badge--sev1';
    case 'SEV-2':
      return 'badge badge--sev2';
    case 'SEV-3':
      return 'badge badge--sev3';
    default:
      return 'badge';
  }
}

function statusClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'badge badge--open';
    case 'RESOLVED':
      return 'badge badge--resolved';
    default:
      return 'badge';
  }
}

export function IncidentsTable({ incidents }: IncidentsTableProps) {
  if (incidents.length === 0) {
    return (
      <section className="incidents-panel" aria-label="Incidents">
        <h2>Incidents</h2>
        <p className="empty-state" role="status">
          No incidents match the current filters.
        </p>
      </section>
    );
  }

  return (
    <section className="incidents-panel" aria-label="Incidents">
      <h2>Incidents</h2>
      <div className="table-scroll">
        <table className="incidents-table">
          <caption className="visually-hidden">
            Active and resolved incidents with severity and service context
          </caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Service</th>
              <th scope="col">Severity</th>
              <th scope="col">Status</th>
              <th scope="col">Summary</th>
              <th scope="col">Started</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.identifier}>
                <td>
                  <code>{incident.identifier}</code>
                </td>
                <td>{incident.service}</td>
                <td>
                  <span className={severityClass(incident.severity)}>{incident.severity}</span>
                </td>
                <td>
                  <span className={statusClass(incident.status)}>{incident.status}</span>
                </td>
                <td className="incident-summary">{incident.summary}</td>
                <td>
                  <time dateTime={incident.started_at}>{formatTimestamp(incident.started_at)}</time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
