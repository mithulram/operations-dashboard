import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchIncidents } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { FilterBar } from '../components/FilterBar';
import { IncidentDetailPanel } from '../components/IncidentDetailPanel';
import { IncidentsTable } from '../components/IncidentsTable';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { SampleDataBadge } from '../components/SampleDataBadge';
import type { Incident, SeverityFilter, StatusFilter } from '../types';
import { isSampleIncident } from '../types';

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

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      setIncidents(await fetchIncidents());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, severity, status),
    [incidents, severity, status],
  );
  const showSampleBadge = incidents.some(isSampleIncident);

  function handleSelectIncident(incident: Incident) {
    if (incident.id !== undefined) {
      setSelectedIncidentId(incident.id);
    }
  }

  function handleIncidentUpdated(updated: Incident) {
    setIncidents((current) =>
      current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
    );
  }

  return (
    <section className="panel-section" aria-label="Incidents">
      <div className="panel-section__header">
        <h2>Incidents</h2>
        <p className="panel-section__hint">
          Track automatic incidents from monitor outages. Open a row for timeline details and actions.
        </p>
        {showSampleBadge && <SampleDataBadge />}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void loadIncidents()} />}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <FilterBar
            severity={severity}
            status={status}
            onSeverityChange={setSeverity}
            onStatusChange={setStatus}
            resultCount={filteredIncidents.length}
            totalCount={incidents.length}
          />
          <IncidentsTable incidents={filteredIncidents} onSelect={handleSelectIncident} />
        </>
      )}

      {selectedIncidentId !== null && (
        <IncidentDetailPanel
          incidentId={selectedIncidentId}
          onClose={() => setSelectedIncidentId(null)}
          onUpdated={handleIncidentUpdated}
        />
      )}
    </section>
  );
}
