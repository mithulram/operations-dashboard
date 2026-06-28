import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  addMonitorToComponent,
  createStatusPageComponent,
  deleteStatusPageComponent,
  fetchPublicStatus,
  getMonitors,
  getStatusPage,
  removeMonitorFromComponent,
  updateStatusPage,
  updateStatusPageComponent,
} from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { LockedState } from '../components/LockedState';
import { PublicStatusView } from '../components/PublicStatusView';
import { StatusPageSetupGuide } from '../components/StatusPageSetupGuide';
import { useAdminKey } from '../context/AdminKeyContext';
import type { AdminStatusPage, Monitor, PublicStatusPage } from '../types';
import { ApiError } from '../types';

export function StatusPageAdminPage() {
  const { adminApiKey, isConfigured } = useAdminKey();
  const [statusPage, setStatusPage] = useState<AdminStatusPage | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [preview, setPreview] = useState<PublicStatusPage | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [newComponentName, setNewComponentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const publicUrl = useMemo(() => {
    if (!statusPage) {
      return '';
    }
    return `${window.location.origin}/status/${statusPage.slug}`;
  }, [statusPage]);

  const loadData = useCallback(async () => {
    if (!adminApiKey) {
      return;
    }

    setLoading(true);
    try {
      const [page, monitorList] = await Promise.all([
        getStatusPage(adminApiKey),
        getMonitors(adminApiKey),
      ]);
      setStatusPage(page);
      setTitleDraft(page.title);
      setMonitors(monitorList);
      setPreview(await fetchPublicStatus(page.slug));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 503)) {
        setError('Status page management is locked. Verify your admin API key in Settings.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load status page settings.');
      }
      setStatusPage(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [adminApiKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSaveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminApiKey || !titleDraft.trim()) {
      return;
    }
    const page = await updateStatusPage({ title: titleDraft.trim() }, adminApiKey);
    setStatusPage(page);
    setPreview(await fetchPublicStatus(page.slug));
    setSavedMessage('Status page title saved.');
  }

  async function handleToggleResponseTimes() {
    if (!adminApiKey || !statusPage) {
      return;
    }
    const page = await updateStatusPage(
      { show_response_times: !statusPage.show_response_times },
      adminApiKey,
    );
    setStatusPage(page);
    setPreview(await fetchPublicStatus(page.slug));
  }

  async function handleAddComponent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminApiKey || !newComponentName.trim()) {
      return;
    }
    const page = await createStatusPageComponent(
      { name: newComponentName.trim(), sort_order: statusPage?.components.length ?? 0 },
      adminApiKey,
    );
    setStatusPage(page);
    setNewComponentName('');
    setPreview(await fetchPublicStatus(page.slug));
  }

  async function handleRenameComponent(componentId: number, name: string) {
    if (!adminApiKey || !name.trim()) {
      return;
    }
    const page = await updateStatusPageComponent(componentId, { name: name.trim() }, adminApiKey);
    setStatusPage(page);
    setPreview(await fetchPublicStatus(page.slug));
  }

  async function handleDeleteComponent(componentId: number) {
    if (!adminApiKey) {
      return;
    }
    const confirmed = window.confirm('Delete this component?');
    if (!confirmed) {
      return;
    }
    const page = await deleteStatusPageComponent(componentId, adminApiKey);
    setStatusPage(page);
    setPreview(await fetchPublicStatus(page.slug));
  }

  async function handleAssignMonitor(componentId: number, monitorId: number) {
    if (!adminApiKey || !monitorId) {
      return;
    }
    const page = await addMonitorToComponent(componentId, monitorId, adminApiKey);
    setStatusPage(page);
    setPreview(await fetchPublicStatus(page.slug));
  }

  async function handleRemoveMonitor(componentId: number, monitorId: number) {
    if (!adminApiKey) {
      return;
    }
    const page = await removeMonitorFromComponent(componentId, monitorId, adminApiKey);
    setStatusPage(page);
    setPreview(await fetchPublicStatus(page.slug));
  }

  if (!isConfigured) {
    return (
      <LockedState
        title="Status page builder"
        lockedFeature="status page configuration and monitor assignments"
      />
    );
  }

  const hasAssignments =
    statusPage?.components.some((component) => component.monitor_ids.length > 0) ?? false;

  return (
    <section className="panel-section" aria-label="Status page builder">
      <div className="panel-section__header panel-section__header--split">
        <div>
          <h2>Status Page</h2>
          <p className="panel-section__hint">
            Configure the public status page shown at `/status/default` without exposing admin routes.
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void loadData()} />}

      {loading && !statusPage ? (
        <p className="empty-state">Loading status page settings…</p>
      ) : (
        statusPage && (
          <>
            <StatusPageSetupGuide hasMonitors={monitors.length > 0} hasAssignments={hasAssignments} />

            <div className="settings-panel">
              <form className="settings-form" onSubmit={(event) => void handleSaveTitle(event)}>
                <label htmlFor="status-page-title">Title</label>
                <input
                  id="status-page-title"
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                />
                <div className="settings-form__actions">
                  <button type="submit" className="button button--primary">
                    Save title
                  </button>
                </div>
              </form>

              <div className="status-page-meta">
                <p>
                  <strong>Slug:</strong> {statusPage.slug}
                </p>
                <p>
                  <strong>Public URL:</strong>{' '}
                  <a href={publicUrl} className="status-page-meta__link">
                    {publicUrl}
                  </a>
                </p>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={statusPage.show_response_times}
                    onChange={() => void handleToggleResponseTimes()}
                  />
                  Show response times on public page
                </label>
              </div>

              {savedMessage && (
                <p className="settings-message" role="status">
                  {savedMessage}
                </p>
              )}
            </div>

            <div className="status-page-builder">
              <div className="status-page-builder__column">
                <h3>Components</h3>
                <form className="settings-form" onSubmit={(event) => void handleAddComponent(event)}>
                  <label htmlFor="component-name">Add component</label>
                  <input
                    id="component-name"
                    value={newComponentName}
                    onChange={(event) => setNewComponentName(event.target.value)}
                    placeholder="Payments"
                  />
                  <div className="settings-form__actions">
                    <button type="submit" className="button button--primary" disabled={!newComponentName.trim()}>
                      Add component
                    </button>
                  </div>
                </form>

                <div className="status-page-components">
                  {statusPage.components.map((component) => (
                    <article key={component.id} className="status-page-component-card">
                      <div className="status-page-component-card__header">
                        <input
                          aria-label={`Component ${component.name} name`}
                          defaultValue={component.name}
                          onBlur={(event) =>
                            void handleRenameComponent(component.id, event.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="button button--danger"
                          onClick={() => void handleDeleteComponent(component.id)}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="status-page-component-card__monitors">
                        <p className="panel-section__hint">Assigned monitors</p>
                        {component.monitor_ids.length === 0 ? (
                          <p className="public-status__empty">No monitors assigned.</p>
                        ) : (
                          <ul className="status-page-monitor-tags">
                            {component.monitor_ids.map((monitorId) => {
                              const monitor = monitors.find((item) => item.id === monitorId);
                              return (
                                <li key={monitorId}>
                                  <span>{monitor?.name ?? `Monitor ${monitorId}`}</span>
                                  <button
                                    type="button"
                                    className="button button--ghost"
                                    onClick={() => void handleRemoveMonitor(component.id, monitorId)}
                                  >
                                    Remove
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        <label htmlFor={`assign-monitor-${component.id}`}>Assign monitor</label>
                        <div className="status-page-assign">
                          <select
                            id={`assign-monitor-${component.id}`}
                            defaultValue=""
                            onChange={(event) => {
                              const monitorId = Number(event.target.value);
                              if (monitorId) {
                                void handleAssignMonitor(component.id, monitorId);
                                event.target.value = '';
                              }
                            }}
                          >
                            <option value="">Select monitor…</option>
                            {monitors
                              .filter((monitor) => !component.monitor_ids.includes(monitor.id))
                              .map((monitor) => (
                                <option key={monitor.id} value={monitor.id}>
                                  {monitor.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="status-page-builder__column">
                <h3>Public preview</h3>
                {preview ? (
                  <div className="status-page-preview">
                    <PublicStatusView status={preview} />
                  </div>
                ) : (
                  <p className="empty-state">Preview unavailable.</p>
                )}
              </div>
            </div>
          </>
        )
      )}
    </section>
  );
}
