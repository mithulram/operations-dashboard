const STORAGE_KEY = 'operations-dashboard-admin-api-key';

export function getAdminApiKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const value = window.localStorage.getItem(STORAGE_KEY)?.trim();
  return value ? value : null;
}

export function setAdminApiKey(key: string): void {
  window.localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearAdminApiKey(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function maskAdminApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) {
    return '••••';
  }
  return `••••${trimmed.slice(-4)}`;
}
