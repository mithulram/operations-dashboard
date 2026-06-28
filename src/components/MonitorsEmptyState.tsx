interface MonitorsEmptyStateProps {
  onAddMonitor: () => void;
}

export function MonitorsEmptyState({ onAddMonitor }: MonitorsEmptyStateProps) {
  return (
    <section className="workspace-empty-state" aria-label="No monitors">
      <h3>No monitors yet</h3>
      <p>
        Add a URL monitor to start scheduled checks. After the first check succeeds, assign the
        monitor on the Status Page tab so it appears on your public page.
      </p>
      <button type="button" className="button button--primary" onClick={onAddMonitor}>
        Add your first monitor
      </button>
    </section>
  );
}
