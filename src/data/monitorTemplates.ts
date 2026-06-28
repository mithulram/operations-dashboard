import type { MonitorFormValues } from '../components/MonitorFormModal';

export interface MonitorTemplate {
  id: string;
  label: string;
  description: string;
  values: MonitorFormValues;
}

export const MONITOR_TEMPLATES: MonitorTemplate[] = [
  {
    id: 'website-uptime',
    label: 'Website uptime',
    description: 'GET https://example.com every 60s',
    values: {
      name: 'Website uptime',
      url: 'https://example.com',
      method: 'GET',
      interval_seconds: 60,
      timeout_seconds: 5,
      expected_status_min: 200,
      expected_status_max: 399,
      is_paused: false,
    },
  },
  {
    id: 'api-health',
    label: 'API health check',
    description: 'GET https://api.example.com/health every 60s',
    values: {
      name: 'API health check',
      url: 'https://api.example.com/health',
      method: 'GET',
      interval_seconds: 60,
      timeout_seconds: 5,
      expected_status_min: 200,
      expected_status_max: 399,
      is_paused: false,
    },
  },
  {
    id: 'status-dependency',
    label: 'Status page dependency',
    description: 'GET https://status.example.com every 300s',
    values: {
      name: 'Status page dependency',
      url: 'https://status.example.com',
      method: 'GET',
      interval_seconds: 300,
      timeout_seconds: 5,
      expected_status_min: 200,
      expected_status_max: 399,
      is_paused: false,
    },
  },
];

export function getMonitorTemplate(templateId: string): MonitorTemplate | undefined {
  return MONITOR_TEMPLATES.find((template) => template.id === templateId);
}
