import { Link } from 'react-router-dom';

interface LockedStateProps {
  title?: string;
  message?: string;
}

export function LockedState({
  title = 'Monitor management is locked',
  message = 'Paste your backend ADMIN_API_KEY in Settings to create, edit, run checks, or delete monitors.',
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
