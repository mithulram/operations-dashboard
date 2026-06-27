import { useEffect, useState } from 'react';
import { getMonitorChecks } from '../api/client';
import type { CheckHistoryItem } from '../types';
import { formatMilliseconds, formatTimestamp } from '../utils';

interface MonitorCheckHistoryProps {
  monitorId: number;
  adminApiKey: string;
  isExpanded: boolean;
}

export function MonitorCheckHistory({ monitorId, adminApiKey, isExpanded }: MonitorCheckHistoryProps) {
  const [checks, setChecks] = useState<CheckHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getMonitorChecks(monitorId, adminApiKey, 20)
      .then((history) => {
        if (!cancelled) {
          setChecks(history);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load check history.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adminApiKey, isExpanded, monitorId]);

  if (!isExpanded) {
    return null;
  }

  if (loading) {
    return <p className="history-panel__status">Loading check history…</p>;
  }

  if (error) {
    return <p className="history-panel__status history-panel__status--error">{error}</p>;
  }

  if (checks.length === 0) {
    return <p className="history-panel__status">No checks recorded yet.</p>;
  }

  return (
    <div className="history-panel">
      <h3>Recent checks</h3>
      <div className="table-scroll">
        <table className="history-table">
          <thead>
            <tr>
              <th scope="col">Checked at</th>
              <th scope="col">Status</th>
              <th scope="col">Response</th>
              <th scope="col">Result</th>
              <th scope="col">Error</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={`${check.checked_at}-${check.status_code ?? 'none'}`}>
                <td>{formatTimestamp(check.checked_at)}</td>
                <td>{check.status_code ?? '—'}</td>
                <td>{formatMilliseconds(check.response_time_ms)}</td>
                <td>
                  <span className={`badge ${check.success ? 'badge--resolved' : 'badge--open'}`}>
                    {check.success ? 'Success' : 'Failed'}
                  </span>
                </td>
                <td>{check.error_message ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
