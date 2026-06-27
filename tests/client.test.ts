import { describe, expect, it } from 'vitest';
import { buildApiUrl } from '../src/api/client';
import { normalizeApiBaseUrl } from '../src/utils';

describe('normalizeApiBaseUrl', () => {
  it('returns an empty string when unset', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('');
    expect(normalizeApiBaseUrl('')).toBe('');
  });

  it('removes trailing slashes from deployed origins', () => {
    expect(normalizeApiBaseUrl('https://monitor.example.com/')).toBe(
      'https://monitor.example.com',
    );
    expect(normalizeApiBaseUrl('https://monitor.example.com///')).toBe(
      'https://monitor.example.com',
    );
  });

  it('preserves origins without trailing slashes', () => {
    expect(normalizeApiBaseUrl('https://monitor.example.com')).toBe(
      'https://monitor.example.com',
    );
  });
});

describe('buildApiUrl', () => {
  it('uses relative paths when the API base URL is empty', () => {
    expect(buildApiUrl('/healthz', '')).toBe('/healthz');
    expect(buildApiUrl('/api/v1/summary', '')).toBe('/api/v1/summary');
  });

  it('joins deployed API origins without double slashes', () => {
    const base = normalizeApiBaseUrl('https://monitor.example.com/');
    expect(buildApiUrl('/api/v1/incidents', base)).toBe(
      'https://monitor.example.com/api/v1/incidents',
    );
    expect(buildApiUrl('/healthz', base)).toBe('https://monitor.example.com/healthz');
  });
});
