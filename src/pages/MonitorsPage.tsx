import { useCallback, useEffect, useState } from 'react';
import {
  createMonitor,
  deleteMonitor,
  getMonitors,
  runMonitorCheck,
  updateMonitor,
} from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { LockedState } from '../components/LockedState';
import { MonitorsEmptyState } from '../components/MonitorsEmptyState';
import {
  MonitorFormModal,
  monitorToFormValues,
  type MonitorFormValues,
} from '../components/MonitorFormModal';
import { MonitorList } from '../components/MonitorList';
import { useAdminKey } from '../context/AdminKeyContext';
import type { Monitor, MonitorInput } from '../types';
import { ApiError } from '../types';

export function MonitorsPage() {
  const { adminApiKey, isConfigured } = useAdminKey();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyMonitorId, setBusyMonitorId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);

  const loadMonitors = useCallback(async () => {
    if (!adminApiKey) {
      setMonitors([]);
      return;
    }

    setLoading(true);
    try {
      setMonitors(await getMonitors(adminApiKey));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 503)) {
        setError('Monitor management is locked. Verify your admin API key in Settings.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load monitors.');
      }
      setMonitors([]);
    } finally {
      setLoading(false);
    }
  }, [adminApiKey]);

  useEffect(() => {
    void loadMonitors();
  }, [loadMonitors]);

  async function handleCreate(values: MonitorInput) {
    if (!adminApiKey) {
      return;
    }
    await createMonitor(values, adminApiKey);
    await loadMonitors();
  }

  async function handleUpdate(values: MonitorInput) {
    if (!adminApiKey || !editingMonitor) {
      return;
    }
    await updateMonitor(editingMonitor.id, values, adminApiKey);
    await loadMonitors();
  }

  async function handleRunCheck(monitor: Monitor) {
    if (!adminApiKey) {
      return;
    }
    setBusyMonitorId(monitor.id);
    try {
      await runMonitorCheck(monitor.id, adminApiKey);
      await loadMonitors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run monitor check.');
    } finally {
      setBusyMonitorId(null);
    }
  }

  async function handleTogglePause(monitor: Monitor) {
    if (!adminApiKey) {
      return;
    }
    setBusyMonitorId(monitor.id);
    try {
      await updateMonitor(monitor.id, { is_paused: !monitor.is_paused }, adminApiKey);
      await loadMonitors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update monitor.');
    } finally {
      setBusyMonitorId(null);
    }
  }

  async function handleDelete(monitor: Monitor) {
    if (!adminApiKey) {
      return;
    }
    const confirmed = window.confirm(`Delete monitor "${monitor.name}"?`);
    if (!confirmed) {
      return;
    }
    setBusyMonitorId(monitor.id);
    try {
      await deleteMonitor(monitor.id, adminApiKey);
      await loadMonitors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete monitor.');
    } finally {
      setBusyMonitorId(null);
    }
  }

  const modalInitialValues: MonitorFormValues | undefined = editingMonitor
    ? monitorToFormValues(editingMonitor)
    : undefined;

  if (!isConfigured) {
    return (
      <LockedState message="The dashboard and public status page stay readable without a key. Paste your backend ADMIN_API_KEY in Settings to create monitors, run checks, and delete monitors." />
    );
  }

  return (
    <section className="panel-section" aria-label="Monitors">
      <div className="panel-section__header panel-section__header--split">
        <div>
          <h2>Monitors</h2>
          <p className="panel-section__hint">Manage persisted URL monitors against the live backend.</p>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            setEditingMonitor(null);
            setModalOpen(true);
          }}
        >
          Add monitor
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void loadMonitors()} />}

      {loading ? (
        <p className="empty-state">Loading monitors…</p>
      ) : monitors.length === 0 ? (
        <MonitorsEmptyState
          onAddMonitor={() => {
            setEditingMonitor(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <MonitorList
          monitors={monitors}
          adminApiKey={adminApiKey ?? ''}
          onRunCheck={handleRunCheck}
          onEdit={(monitor) => {
            setEditingMonitor(monitor);
            setModalOpen(true);
          }}
          onTogglePause={handleTogglePause}
          onDelete={handleDelete}
          busyMonitorId={busyMonitorId}
        />
      )}

      <MonitorFormModal
        isOpen={modalOpen}
        title={editingMonitor ? 'Edit monitor' : 'Add monitor'}
        initialValues={modalInitialValues}
        submitLabel={editingMonitor ? 'Save changes' : 'Create monitor'}
        onClose={() => {
          setModalOpen(false);
          setEditingMonitor(null);
        }}
        onSubmit={editingMonitor ? handleUpdate : handleCreate}
      />
    </section>
  );
}
