import { Link } from 'react-router-dom';

interface LockedStateProps {
  title?: string;
  message?: string;
}

export function LockedState({
  title = 'Monitor management is locked',
  message = 'The dashboard and public status page stay readable without a key. Paste your backend ADMIN_API_KEY in Settings to create monitors, run checks, and edit the status page builder.',
}: LockedStateProps) {
  return (
    <section className="locked-state" aria-label={title}>
      <h2>{title}</h2>
      <p>{message}</p>
      <Link className="button button--primary" to="/settings">
        Open Settings
      </Link>
    </section>
  );
}
