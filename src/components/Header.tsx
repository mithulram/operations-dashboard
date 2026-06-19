export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true" />
        <div>
          <h1>Operations Dashboard</h1>
          <p className="app-header__subtitle">
            Portfolio demo — unified SLO, error budget, and incident visibility
          </p>
        </div>
      </div>
      <p className="app-header__badge">Live API · Project #5</p>
    </header>
  );
}
