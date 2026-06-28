import { Link } from 'react-router-dom';
import { MonitorTemplatePicker } from './MonitorTemplatePicker';
import { OperationalCoverage } from './OperationalCoverage';

interface FirstRunOnboardingProps {
  isAdminConnected: boolean;
}

const steps = [
  {
    title: 'Connect admin key',
    detail: 'Paste your backend ADMIN_API_KEY in Settings. It stays in this browser only.',
  },
  {
    title: 'Add a monitor',
    detail: 'Use a sample template or create a URL monitor with interval and status codes.',
  },
  {
    title: 'Run the first check',
    detail: 'Trigger a manual check to confirm the endpoint responds.',
  },
  {
    title: 'Review the public status page',
    detail: 'Assign monitors in Status Page, then share /status/default.',
  },
];

export function FirstRunOnboarding({ isAdminConnected }: FirstRunOnboardingProps) {
  const primaryTo = isAdminConnected ? '/monitors' : '/settings';
  const primaryLabel = isAdminConnected ? 'Add your first monitor' : 'Connect admin key in Settings';

  return (
    <section className="onboarding-panel" aria-label="Getting started">
      <div className="onboarding-panel__header">
        <h2>Get started with Ops Monitor</h2>
        <p className="onboarding-panel__intro">
          {isAdminConnected
            ? 'Your admin key is connected. Add a monitor to begin tracking uptime and publishing status.'
            : 'Browse the dashboard, incidents, and public status in read-only mode. Connect an admin key when you are ready to manage monitors.'}
        </p>
      </div>

      <OperationalCoverage />

      <ol className="onboarding-steps">
        {steps.map((step, index) => (
          <li key={step.title} className="onboarding-step">
            <span className="onboarding-step__number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <MonitorTemplatePicker isAdminConnected={isAdminConnected} />

      <div className="onboarding-panel__actions">
        <Link className="button button--primary" to={primaryTo}>
          {primaryLabel}
        </Link>
        <Link className="button button--ghost" to="/status/default">
          Open public status page
        </Link>
      </div>
    </section>
  );
}
