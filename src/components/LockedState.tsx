import { Link } from 'react-router-dom';
import { ReadOnlyNotice } from './ReadOnlyNotice';

interface LockedStateProps {
  title?: string;
  lockedFeature?: string;
}

export function LockedState({
  title = 'Admin key required',
  lockedFeature = 'monitor changes, status page configuration, and alert settings',
}: LockedStateProps) {
  return (
    <section className="locked-state" aria-label={title}>
      <h2>{title}</h2>
      <ReadOnlyNotice lockedFeature={lockedFeature} />
      <Link className="button button--primary" to="/settings">
        Connect admin key
      </Link>
    </section>
  );
}
