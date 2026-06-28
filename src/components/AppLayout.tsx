import { NavLink, Outlet } from 'react-router-dom';
import { useAdminKey } from '../context/AdminKeyContext';

const navItems: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/monitors', label: 'Monitors' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/status-page', label: 'Status Page' },
  { to: '/settings', label: 'Settings' },
];

export function AppLayout() {
  const { isConfigured } = useAdminKey();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__mark" aria-hidden="true" />
          <div>
            <h1>Operations Dashboard</h1>
            <p className="app-header__subtitle">
              Monitor fleet health, uptime checks, and incident context in one operations view.
            </p>
          </div>
        </div>
        <div className="app-header__meta">
          <p className="app-header__badge">{isConfigured ? 'Admin connected' : 'Read-only mode'}</p>
          <nav className="app-nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
