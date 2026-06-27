export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

export function formatOptionalPercent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined) {
    return '—';
  }
  return formatPercent(ratio);
}

export function formatMilliseconds(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) {
    return '—';
  }
  return `${ms} ms`;
}

export function truncateUrl(url: string, maxLength = 48): string {
  if (url.length <= maxLength) {
    return url;
  }
  return `${url.slice(0, maxLength - 1)}…`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** Strip trailing slashes so `${base}${path}` never produces `//api/...`. */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  if (!raw) {
    return '';
  }
  return raw.replace(/\/+$/, '');
}
