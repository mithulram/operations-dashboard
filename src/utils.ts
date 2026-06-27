export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
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
