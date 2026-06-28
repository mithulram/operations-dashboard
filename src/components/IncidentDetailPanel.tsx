import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  addIncidentUpdate,
  getIncident,
  getIncidentUpdates,
  updateIncident,
} from '../api/client';
import { useAdminKey } from '../context/AdminKeyContext';
import type { Incident, IncidentUpdate } from '../types';
import { formatTimestamp } from '../utils';

interface IncidentDetailPanelProps {
  incidentId: number;
  onClose: () => void;
  onUpdated: (incident: Incident) => void;
}

function statusClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'badge badge--open';
    case 'ACKNOWLEDGED':
      return 'badge badge--acknowledged';
    case 'RESOLVED':
      return 'badge badge--resolved';
    default:
      return 'badge';
  }
}

export function IncidentDetailPanel({ incidentId, onClose, onUpdated }: IncidentDetailPanelProps) {
  const { adminApiKey, isConfigured } = useAdminKey();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, timeline] = await Promise.all([
        getIncident(incidentId),
        getIncidentUpdates(incidentId),
      ]);
      setIncident(detail);
      setUpdates(timeline);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load incident detail.');
      setIncident(null);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function handleStatusChange(nextStatus: 'acknowledged' | 'resolved') {
    if (!adminApiKey || !incident) {
      return;
    }
    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateIncident(incident.id!, { status: nextStatus }, adminApiKey);
      setIncident(updated);
      onUpdated(updated);
      setUpdates(await getIncidentUpdates(incidentId));
      setStatusMessage(nextStatus === 'acknowledged' ? 'Incident acknowledged.' : 'Incident resolved.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to update incident.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminApiKey || !incident || !noteDraft.trim()) {
      return;
    }
    setSaving(true);
    setStatusMessage(null);
    try {
      await addIncidentUpdate(incident.id!, noteDraft.trim(), adminApiKey);
      setNoteDraft('');
      setUpdates(await getIncidentUpdates(incidentId));
      const refreshed = await getIncident(incidentId);
      setIncident(refreshed);
      onUpdated(refreshed);
      setStatusMessage('Timeline update added.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to add update.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel incident-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-panel__header">
          <h2 id="incident-detail-title">{incident?.title ?? incident?.identifier ?? 'Incident'}</h2>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? (
          <p>Loading incident…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : incident ? (
          <>
            <dl className="incident-detail__meta">
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={statusClass(incident.status)}>{incident.status}</span>
                </dd>
              </div>
              <div>
                <dt>Severity</dt>
                <dd>{incident.severity}</dd>
              </div>
              <div>
                <dt>Monitor</dt>
                <dd>{incident.monitor_name ?? incident.service}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>
                  <time dateTime={incident.started_at}>{formatTimestamp(incident.started_at)}</time>
                </dd>
              </div>
              {incident.resolved_at && (
                <div>
                  <dt>Resolved</dt>
                  <dd>
                    <time dateTime={incident.resolved_at}>
                      {formatTimestamp(incident.resolved_at)}
                    </time>
                  </dd>
                </div>
              )}
            </dl>

            <p className="incident-detail__summary">{incident.summary}</p>

            <section className="incident-detail__timeline" aria-label="Incident timeline">
              <h3>Timeline</h3>
              {updates.length === 0 ? (
                <p className="panel-section__hint">No timeline updates yet.</p>
              ) : (
                <ol className="incident-timeline">
                  {updates.map((update) => (
                    <li key={update.id}>
                      <time dateTime={update.created_at}>{formatTimestamp(update.created_at)}</time>
                      <p>{update.message}</p>
                      {update.status && <span className={statusClass(update.status)}>{update.status}</span>}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {!isConfigured ? (
              <p className="incident-detail__locked">
                Save your admin API key in Settings to acknowledge, resolve, or add timeline notes.
              </p>
            ) : (
              <div className="incident-detail__actions">
                {incident.status === 'OPEN' && (
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={saving}
                    onClick={() => void handleStatusChange('acknowledged')}
                  >
                    Acknowledge
                  </button>
                )}
                {incident.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    className="button button--ghost"
                    disabled={saving}
                    onClick={() => void handleStatusChange('resolved')}
                  >
                    Resolve
                  </button>
                )}
                <form className="incident-detail__note-form" onSubmit={handleAddUpdate}>
                  <label htmlFor="incident-update-note">Add update</label>
                  <textarea
                    id="incident-update-note"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={3}
                    placeholder="Share investigation progress…"
                  />
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={saving || !noteDraft.trim()}
                  >
                    Post update
                  </button>
                </form>
              </div>
            )}

            {statusMessage && (
              <p className="settings-message" role="status">
                {statusMessage}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
