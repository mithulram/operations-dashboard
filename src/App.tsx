import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDashboardData } from './api/client';
import { ErrorBanner } from './components/ErrorBanner';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { IncidentsTable } from './components/IncidentsTable';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { SummaryCards } from './components/SummaryCards';
import type { Incident, SeverityFilter, StatusFilter, Summary } from './types';
import './App.css';

const REFRESH_INTERVAL_MS = 30_000;

function filterIncidents(
  incidents: Incident[],
  severity: SeverityFilter,
  status: StatusFilter,
): Incident[] {
  return incidents.filter((incident) => {
    const severityMatch = severity === 'ALL' || incident.severity === severity;
    const statusMatch = status === 'ALL' || incident.status === status;
    return severityMatch && statusMatch;
  });
}

export default function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const loadData = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? false;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const data = await fetchDashboardData();
      setSummary(data.summary);
      setIncidents(data.incidents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData({ showLoading: true });
  }, [loadData]);

  useEffect(() => {
    if (error) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadData();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [error, loadData]);

  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, severity, status),
    [incidents, severity, status],
  );

  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        {error && <ErrorBanner message={error} onRetry={() => void loadData({ showLoading: true })} />}

        {loading && !summary ? (
          <LoadingSkeleton />
        ) : (
          summary && (
            <>
              <SummaryCards summary={summary} />

              <FilterBar
                severity={severity}
                status={status}
                onSeverityChange={setSeverity}
                onStatusChange={setStatus}
                resultCount={filteredIncidents.length}
                totalCount={incidents.length}
              />

              <IncidentsTable incidents={filteredIncidents} />
            </>
          )
        )}

        {!loading && !error && summary && (
          <p className="refresh-note" aria-live="polite">
            Auto-refreshes every 30 seconds while the API is healthy.
          </p>
        )}
      </main>
    </div>
  );
}
