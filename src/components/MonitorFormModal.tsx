import { FormEvent, useEffect, useState } from 'react';
import type { HttpMethod, Monitor, MonitorInput } from '../types';

export interface MonitorFormValues {
  name: string;
  url: string;
  method: HttpMethod;
  interval_seconds: number;
  timeout_seconds: number;
  expected_status_min: number;
  expected_status_max: number;
  is_paused: boolean;
}

interface MonitorFormModalProps {
  isOpen: boolean;
  title: string;
  initialValues?: MonitorFormValues;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: MonitorInput) => Promise<void>;
}

const defaultValues: MonitorFormValues = {
  name: '',
  url: '',
  method: 'GET',
  interval_seconds: 60,
  timeout_seconds: 5,
  expected_status_min: 200,
  expected_status_max: 399,
  is_paused: false,
};

export function monitorToFormValues(monitor: Monitor): MonitorFormValues {
  return {
    name: monitor.name,
    url: monitor.url,
    method: monitor.method,
    interval_seconds: monitor.interval_seconds,
    timeout_seconds: monitor.timeout_seconds,
    expected_status_min: monitor.expected_status_min,
    expected_status_max: monitor.expected_status_max,
    is_paused: monitor.is_paused,
  };
}

export function validateMonitorForm(values: MonitorFormValues): string | null {
  if (!values.name.trim()) {
    return 'Name is required.';
  }
  const url = values.url.trim();
  if (!url) {
    return 'URL is required.';
  }
  if (!/^https?:\/\/.+/i.test(url)) {
    return 'URL must start with http:// or https://.';
  }
  if (values.interval_seconds < 30 || values.interval_seconds > 86400) {
    return 'Interval must be between 30 and 86400 seconds.';
  }
  if (values.timeout_seconds < 1 || values.timeout_seconds > 30) {
    return 'Timeout must be between 1 and 30 seconds.';
  }
  if (values.expected_status_max < values.expected_status_min) {
    return 'Expected max status must be greater than or equal to min status.';
  }
  return null;
}

export function MonitorFormModal({
  isOpen,
  title,
  initialValues,
  submitLabel,
  onClose,
  onSubmit,
}: MonitorFormModalProps) {
  const [values, setValues] = useState<MonitorFormValues>(initialValues ?? defaultValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues ?? defaultValues);
      setError(null);
      setSubmitting(false);
    }
  }, [initialValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateMonitorForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        url: values.url.trim(),
        method: values.method,
        interval_seconds: values.interval_seconds,
        timeout_seconds: values.timeout_seconds,
        expected_status_min: values.expected_status_min,
        expected_status_max: values.expected_status_max,
        is_paused: values.is_paused,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save monitor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monitor-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-panel__header">
          <h2 id="monitor-form-title">{title}</h2>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="monitor-form" noValidate onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="monitor-name">Name</label>
          <input
            id="monitor-name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            required
          />

          <label htmlFor="monitor-url">URL</label>
          <input
            id="monitor-url"
            value={values.url}
            onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))}
            required
          />

          <label htmlFor="monitor-method">Method</label>
          <select
            id="monitor-method"
            value={values.method}
            onChange={(event) =>
              setValues((current) => ({ ...current, method: event.target.value as HttpMethod }))
            }
          >
            <option value="GET">GET</option>
            <option value="HEAD">HEAD</option>
          </select>

          <div className="monitor-form__grid">
            <div>
              <label htmlFor="monitor-interval">Interval (seconds)</label>
              <input
                id="monitor-interval"
                type="number"
                min={30}
                max={86400}
                value={values.interval_seconds}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    interval_seconds: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor="monitor-timeout">Timeout (seconds)</label>
              <input
                id="monitor-timeout"
                type="number"
                min={1}
                max={30}
                value={values.timeout_seconds}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    timeout_seconds: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor="monitor-status-min">Expected status min</label>
              <input
                id="monitor-status-min"
                type="number"
                min={100}
                max={599}
                value={values.expected_status_min}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    expected_status_min: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div>
              <label htmlFor="monitor-status-max">Expected status max</label>
              <input
                id="monitor-status-max"
                type="number"
                min={100}
                max={599}
                value={values.expected_status_max}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    expected_status_max: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={values.is_paused}
              onChange={(event) =>
                setValues((current) => ({ ...current, is_paused: event.target.checked }))
              }
            />
            Paused
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="settings-form__actions">
            <button type="submit" className="button button--primary" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
