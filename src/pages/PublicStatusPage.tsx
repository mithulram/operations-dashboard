import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicStatus } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PublicStatusView } from '../components/PublicStatusView';
import type { PublicStatusPage } from '../types';

export function PublicStatusPageRoute() {
  const { slug = 'default' } = useParams();
  const [status, setStatus] = useState<PublicStatusPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await fetchPublicStatus(slug));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load status page.');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <div className="public-status-shell">
      {error && <ErrorBanner message={error} onRetry={() => void loadStatus()} />}
      {loading && !status ? (
        <LoadingSkeleton />
      ) : (
        status && <PublicStatusView status={status} />
      )}
    </div>
  );
}
