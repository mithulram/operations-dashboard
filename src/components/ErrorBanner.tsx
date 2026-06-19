interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <div className="error-banner__content">
        <strong>Unable to load dashboard data</strong>
        <p>{message}</p>
      </div>
      <button type="button" className="error-banner__retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
