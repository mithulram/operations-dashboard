import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  MonitorFormModal,
  validateMonitorForm,
  type MonitorFormValues,
} from '../src/components/MonitorFormModal';

const validValues: MonitorFormValues = {
  name: 'API health',
  url: 'https://example.com/health',
  method: 'GET',
  interval_seconds: 60,
  timeout_seconds: 5,
  expected_status_min: 200,
  expected_status_max: 399,
  is_paused: false,
};

describe('validateMonitorForm', () => {
  it('rejects invalid monitor input', () => {
    expect(validateMonitorForm({ ...validValues, name: '' })).toMatch(/Name is required/);
    expect(validateMonitorForm({ ...validValues, url: 'ftp://bad.example' })).toMatch(/http/);
    expect(validateMonitorForm({ ...validValues, interval_seconds: 10 })).toMatch(/Interval/);
    expect(validateMonitorForm({ ...validValues, timeout_seconds: 45 })).toMatch(/Timeout/);
    expect(
      validateMonitorForm({ ...validValues, expected_status_min: 500, expected_status_max: 400 }),
    ).toMatch(/max status/);
  });
});

describe('MonitorFormModal', () => {
  it('does not submit invalid forms', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);

    render(
      <MonitorFormModal
        isOpen
        title="Add monitor"
        submitLabel="Create monitor"
        onClose={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Create monitor' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/Name is required/);
  });
});
