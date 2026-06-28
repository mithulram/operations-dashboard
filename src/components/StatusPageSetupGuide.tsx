import { Link } from 'react-router-dom';

interface StatusPageSetupGuideProps {
  hasMonitors: boolean;
  hasAssignments: boolean;
}

export function StatusPageSetupGuide({ hasMonitors, hasAssignments }: StatusPageSetupGuideProps) {
  if (hasAssignments) {
    return null;
  }

  return (
    <section className="workspace-empty-state workspace-empty-state--compact" aria-label="Status page setup">
      <h3>Publish monitors on your status page</h3>
      {!hasMonitors ? (
        <p>
          Create at least one monitor first, then return here to assign it to a component on the
          default page.
        </p>
      ) : (
        <p>
          Monitors exist but none are assigned yet. Use the assign dropdown on each component below,
          then preview the public page.
        </p>
      )}
      {!hasMonitors && (
        <Link className="button button--primary" to="/monitors">
          Go to Monitors
        </Link>
      )}
    </section>
  );
}
