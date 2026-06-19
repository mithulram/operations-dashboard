export function LoadingSkeleton() {
  return (
    <div className="loading-skeleton" aria-busy="true" aria-label="Loading dashboard data">
      <div className="skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-card" />
        ))}
      </div>
      <div className="skeleton-table">
        <div className="skeleton-row skeleton-row--header" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton-row" />
        ))}
      </div>
    </div>
  );
}
