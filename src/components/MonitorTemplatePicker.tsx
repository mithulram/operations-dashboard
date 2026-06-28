import { Link } from 'react-router-dom';
import { MONITOR_TEMPLATES } from '../data/monitorTemplates';
import type { MonitorFormValues } from './MonitorFormModal';

interface MonitorTemplatePickerProps {
  isAdminConnected: boolean;
  onSelectTemplate?: (values: MonitorFormValues) => void;
}

export function MonitorTemplatePicker({
  isAdminConnected,
  onSelectTemplate,
}: MonitorTemplatePickerProps) {
  return (
    <div className="monitor-templates" aria-label="Sample monitor templates">
      <h4>Start from a sample template</h4>
      <p className="monitor-templates__hint">
        Templates prefill the form only — nothing is created until you confirm.
      </p>
      <ul className="monitor-templates__list">
        {MONITOR_TEMPLATES.map((template) => (
          <li key={template.id}>
            {isAdminConnected && onSelectTemplate ? (
              <button
                type="button"
                className="monitor-template-card"
                onClick={() => onSelectTemplate(template.values)}
              >
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </button>
            ) : isAdminConnected ? (
              <Link className="monitor-template-card" to={`/monitors?template=${template.id}`}>
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </Link>
            ) : (
              <Link className="monitor-template-card" to="/settings">
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
