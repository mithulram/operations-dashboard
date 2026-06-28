import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAlertEvents,
  getAlertSettings,
  sendTestAlert,
  updateAlertSettings,
} from '../api/client';
import { useAdminKey } from '../context/AdminKeyContext';
import type { AlertEvent, AlertSettings } from '../types';
import { ApiError } from '../types';

function describeConfigStatus(settings: AlertSettings | null): {
  label: string;
  tone: 'ok' | 'warn' | 'muted';
} {
  if (!settings) {
    return { label: 'Loading…', tone: 'muted' };
  }
  if (!settings.enabled || !settings.env_alerts_enabled) {
    return { label: 'Disabled', tone: 'muted' };
  }
  if (!settings.smtp_configured) {
    return { label: 'Missing SMTP env on backend', tone: 'warn' };
  }
  if (settings.alerts_ready) {
    return { label: 'Configured', tone: 'ok' };
  }
  return { label: 'Incomplete configuration', tone: 'warn' };
}

function formatEventType(eventType: string): string {
  if (eventType === 'opened') {
    return 'Down alert';
  }
  if (eventType === 'resolved') {
    return 'Recovery alert';
  }
  if (eventType === 'test') {
    return 'Test email';
  }
  return eventType;
}

export function AlertSettingsSection() {
  const { adminApiKey, isConfigured } = useAdminKey();
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [recipientDraft, setRecipientDraft] = useState('');
  const [fromDraft, setFromDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const configStatus = useMemo(() => describeConfigStatus(settings), [settings]);

  const loadData = useCallback(async () => {
    if (!adminApiKey) {
      setSettings(null);
      setEvents([]);
      return;
    }

    setLoading(true);
    try {
      const [alertSettings, alertEvents] = await Promise.all([
        getAlertSettings(adminApiKey),
        getAlertEvents(adminApiKey),
      ]);
      setSettings(alertSettings);
      setRecipientDraft(alertSettings.alert_to ?? '');
      setFromDraft(alertSettings.smtp_from ?? '');
      setEvents(alertEvents);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 503)) {
        setError('Alert settings are locked. Verify your admin API key above.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load alert settings.');
      }
      setSettings(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [adminApiKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminApiKey || !settings) {
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateAlertSettings(
        {
          enabled: settings.enabled,
          send_resolved: settings.send_resolved,
          alert_to: recipientDraft.trim() || null,
          smtp_from: fromDraft.trim() || null,
        },
        adminApiKey,
      );
      setSettings(updated);
      setRecipientDraft(updated.alert_to ?? '');
      setFromDraft(updated.smtp_from ?? '');
      setStatusMessage('Alert settings saved.');
      setError(null);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Unable to save alert settings.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEnabled() {
    if (!adminApiKey || !settings) {
      return;
    }
    const nextEnabled = !settings.enabled;
    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateAlertSettings({ enabled: nextEnabled }, adminApiKey);
      setSettings(updated);
      setStatusMessage(nextEnabled ? 'Email alerts enabled.' : 'Email alerts disabled.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to update alert toggle.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSendResolved() {
    if (!adminApiKey || !settings) {
      return;
    }
    const nextValue = !settings.send_resolved;
    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateAlertSettings({ send_resolved: nextValue }, adminApiKey);
      setSettings(updated);
      setStatusMessage(
        nextValue ? 'Recovery alerts enabled.' : 'Recovery alerts disabled.',
      );
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to update recovery toggle.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    if (!adminApiKey) {
      return;
    }
    setTesting(true);
    setStatusMessage(null);
    try {
      const result = await sendTestAlert(adminApiKey);
      setStatusMessage(`Test email sent to ${result.recipient}.`);
      setEvents(await getAlertEvents(adminApiKey));
      setError(null);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Test email failed.');
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="alert-settings" aria-label="Email alerts">
      <div className="panel-section__header">
        <h3>Email alerts</h3>
        <p className="panel-section__hint">
          Send plain-text emails when monitors go down or recover. SMTP credentials stay on the
          backend host only and are never shown in this UI.
        </p>
      </div>

      {!isConfigured ? (
        <div className="alert-settings__locked">
          <strong>Alerts locked</strong>
          <p>Save your admin API key above to view and update email alert settings.</p>
        </div>
      ) : loading ? (
        <p className="alert-settings__loading">Loading alert settings…</p>
      ) : (
        <>
          {error && (
            <p className="alert-settings__error" role="alert">
              {error}
            </p>
          )}

          {settings && (
            <>
              <div className={`alert-settings__status alert-settings__status--${configStatus.tone}`}>
                <strong>Config status: {configStatus.label}</strong>
                <p>
                  {settings.smtp_password_configured
                    ? 'SMTP password is configured on the backend (presence only).'
                    : 'SMTP password is not configured in backend env.'}
                  {!settings.env_alerts_enabled && ' Set ALERTS_ENABLED=true on Render to allow delivery.'}
                </p>
              </div>

              {!settings.smtp_configured && (
                <div className="alert-settings__warning" role="note">
                  SMTP is incomplete on the backend. Configure SMTP_HOST, SMTP_PORT, SMTP_FROM,
                  SMTP_PASSWORD, and ALERT_EMAIL_TO as Render environment variables. This dashboard
                  does not collect SMTP passwords.
                </div>
              )}

              <div className="alert-settings__toggles">
                <label className="alert-settings__toggle">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={() => void handleToggleEnabled()}
                    disabled={saving}
                  />
                  Enable email alerts
                </label>
                <label className="alert-settings__toggle">
                  <input
                    type="checkbox"
                    checked={settings.send_resolved}
                    onChange={() => void handleToggleSendResolved()}
                    disabled={saving}
                  />
                  Send recovery alerts
                </label>
              </div>

              <form className="settings-form alert-settings__form" onSubmit={handleSave}>
                <label htmlFor="alert-recipient">Alert recipient</label>
                <input
                  id="alert-recipient"
                  name="alert-recipient"
                  type="email"
                  autoComplete="off"
                  placeholder="ops@example.com"
                  value={recipientDraft}
                  onChange={(event) => setRecipientDraft(event.target.value)}
                />

                <label htmlFor="alert-from">From address</label>
                <input
                  id="alert-from"
                  name="alert-from"
                  type="email"
                  autoComplete="off"
                  placeholder="monitor@example.com"
                  value={fromDraft}
                  onChange={(event) => setFromDraft(event.target.value)}
                />

                <div className="settings-form__actions">
                  <button type="submit" className="button button--primary" disabled={saving}>
                    Save alert settings
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => void handleSendTest()}
                    disabled={testing || saving}
                  >
                    {testing ? 'Sending…' : 'Send test email'}
                  </button>
                </div>
              </form>

              <div className="alert-settings__events">
                <h4>Recent alert events</h4>
                {events.length === 0 ? (
                  <p className="panel-section__hint">No alert delivery events yet.</p>
                ) : (
                  <div className="alert-events-table-wrap">
                    <table className="alert-events-table">
                      <caption className="sr-only">Recent email alert delivery attempts</caption>
                      <thead>
                        <tr>
                          <th scope="col">When</th>
                          <th scope="col">Type</th>
                          <th scope="col">Recipient</th>
                          <th scope="col">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((event) => (
                          <tr key={event.id}>
                            <td>{new Date(event.created_at).toLocaleString()}</td>
                            <td>{formatEventType(event.event_type)}</td>
                            <td>{event.recipient}</td>
                            <td>
                              {event.success ? (
                                <span className="alert-events-table__success">Sent</span>
                              ) : (
                                <span className="alert-events-table__failure" title={event.error_message ?? undefined}>
                                  Failed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {statusMessage && (
        <p className="settings-message" role="status">
          {statusMessage}
        </p>
      )}
    </section>
  );
}
