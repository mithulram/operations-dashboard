import { useState } from 'react';
import type { Monitor } from '../types';
import {
  formatMilliseconds,
  formatOptionalPercent,
  formatTimestamp,
  truncateUrl,
} from '../utils';
import { MonitorCheckHistory } from './MonitorCheckHistory';

interface MonitorListProps {
  monitors: Monitor[];
  adminApiKey: string;
  onRunCheck: (monitor: Monitor) => Promise<void>;
  onEdit: (monitor: Monitor) => void;
  onTogglePause: (monitor: Monitor) => Promise<void>;
  onDelete: (monitor: Monitor) => Promise<void>;
  busyMonitorId: number | null;
}

function statusClass(status: Monitor['last_status']): string {
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

export function MonitorList({
  monitors,
  adminApiKey,
  onRunCheck,
  onEdit,
  onTogglePause,
  onDelete,
  busyMonitorId,
}: MonitorListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="monitor-list">
      {monitors.map((monitor) => {
        const isExpanded = expandedId === monitor.id;
        const isBusy = busyMonitorId === monitor.id;

        return (
          <article key={monitor.id} className="monitor-card">
            <div className="monitor-card__header">
              <div className="monitor-card__title">
                <span className={statusClass(monitor.last_status)} aria-hidden="true" />
                <div>
                  <h3>{monitor.name}</h3>
                  <p className="monitor-card__url" title={monitor.url}>
                    {truncateUrl(monitor.url)}
                  </p>
                </div>
              </div>
              <div className="monitor-card__meta">
                <span className="badge badge--open">{monitor.last_status.toUpperCase()}</span>
                {monitor.is_paused && <span className="badge badge--sev3">PAUSED</span>}
              </div>
            </div>

            <dl className="monitor-card__stats">
              <div>
                <dt>Last response</dt>
                <dd>{formatMilliseconds(monitor.last_response_time_ms)}</dd>
              </div>
              <div>
                <dt>Uptime 24h</dt>
                <dd>{formatOptionalPercent(monitor.uptime_ratio_24h)}</dd>
              </div>
              <div>
                <dt>Uptime 7d</dt>
                <dd>{formatOptionalPercent(monitor.uptime_ratio_7d)}</dd>
              </div>
              <div>
                <dt>Last checked</dt>
                <dd>{monitor.last_check_at ? formatTimestamp(monitor.last_check_at) : '—'}</dd>
              </div>
            </dl>

            <div className="monitor-card__actions">
              <button
                type="button"
                className="button button--ghost"
                disabled={isBusy}
                onClick={() => void onRunCheck(monitor)}
              >
                {isBusy ? 'Running…' : 'Run check'}
              </button>
              <button type="button" className="button button--ghost" onClick={() => onEdit(monitor)}>
                Edit
              </button>
              <button
                type="button"
                className="button button--ghost"
                disabled={isBusy}
                onClick={() => void onTogglePause(monitor)}
              >
                {monitor.is_paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                className="button button--danger"
                disabled={isBusy}
                onClick={() => void onDelete(monitor)}
              >
                Delete
              </button>
              <button
                type="button"
                className="button button--ghost"
                aria-expanded={isExpanded}
                onClick={() => setExpandedId(isExpanded ? null : monitor.id)}
              >
                {isExpanded ? 'Hide history' : 'Show history'}
              </button>
            </div>

            <MonitorCheckHistory
              monitorId={monitor.id}
              adminApiKey={adminApiKey}
              isExpanded={isExpanded}
            />
          </article>
        );
      })}
    </div>
  );
}
