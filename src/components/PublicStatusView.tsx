import type { PublicStatusLevel, PublicStatusPage } from '../types';
import { formatMilliseconds, formatTimestamp } from '../utils';

interface PublicStatusViewProps {
  status: PublicStatusPage;
}

const statusLabels: Record<PublicStatusLevel, string> = {
  operational: 'All systems operational',
  degraded: 'Partial degradation',
  outage: 'Service outage',
  unknown: 'Status unknown',
};

function statusBannerClass(status: PublicStatusLevel): string {
  return `public-status__banner public-status__banner--${status}`;
}

function componentStatusClass(status: PublicStatusLevel): string {
  return `public-status__component-status public-status__component-status--${status}`;
}

function monitorStatusClass(status: string): string {
  switch (status) {
    case 'up':
      return 'status-dot status-dot--up';
    case 'down':
      return 'status-dot status-dot--down';
    case 'paused':
      return 'status-dot status-dot--paused';
    default:
      return 'status-dot status-dot--unknown';
  }
}

export function PublicStatusView({ status }: PublicStatusViewProps) {
  const hasComponents = status.components.length > 0;
  const hasMonitors = status.components.some((component) => component.monitors.length > 0);

  return (
    <div className="public-status">
      <header className="public-status__header">
        <h1>{status.title}</h1>
        <p className="public-status__updated">Last updated {formatTimestamp(status.updated_at)}</p>
      </header>

      <section className={statusBannerClass(status.overall_status)} aria-label="Overall status">
        <strong>{statusLabels[status.overall_status]}</strong>
      </section>

      {!hasComponents || !hasMonitors ? (
        <section className="public-status__setup" aria-label="Published services">
          <p className="public-status__setup-lead">
            This status page is live and ready to share with your users.
          </p>
          <p className="public-status__empty">
            Service components will appear here after monitors are assigned in the admin status
            page builder. Monitor URLs are never shown on this public page.
          </p>
        </section>
      ) : (
        <section className="public-status__components" aria-label="Service components">
          {status.components.map((component) => (
            <article key={component.id} className="public-status__component">
              <div className="public-status__component-header">
                <h2>{component.name}</h2>
                <span className={componentStatusClass(component.status)}>
                  {component.status}
                </span>
              </div>

              {component.monitors.length === 0 ? (
                <p className="public-status__empty">No monitors assigned.</p>
              ) : (
                <ul className="public-status__monitor-list">
                  {component.monitors.map((monitor) => (
                    <li key={monitor.id} className="public-status__monitor">
                      <div className="public-status__monitor-title">
                        <span className={monitorStatusClass(monitor.status)} aria-hidden="true" />
                        <span>{monitor.name}</span>
                      </div>
                      <div className="public-status__monitor-meta">
                        <span>{monitor.status.toUpperCase()}</span>
                        {monitor.last_check_at && (
                          <span>Checked {formatTimestamp(monitor.last_check_at)}</span>
                        )}
                        {monitor.last_response_time_ms !== undefined && (
                          <span>{formatMilliseconds(monitor.last_response_time_ms)}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}

      <section className="public-status__incidents" aria-label="Recent incidents">
        <h2>Recent incidents</h2>
        {status.recent_incidents.length === 0 ? (
          <p className="public-status__empty">No recent incidents reported.</p>
        ) : (
          <ul className="public-status__incident-list">
            {status.recent_incidents.map((incident, index) => (
              <li key={`${incident.title}-${incident.started_at}-${index}`}>
                <div className="public-status__incident-header">
                  <strong>{incident.title}</strong>
                  <span
                    className={
                      incident.status === 'RESOLVED'
                        ? 'badge badge--resolved'
                        : 'badge badge--open'
                    }
                  >
                    {incident.status === 'RESOLVED' ? 'Resolved' : 'Open'}
                  </span>
                </div>
                <p className="public-status__incident-meta">
                  {incident.severity} · Started {formatTimestamp(incident.started_at)}
                  {incident.resolved_at && ` · Resolved ${formatTimestamp(incident.resolved_at)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
