#!/usr/bin/env node
/**
 * Smoke test a deployed operations dashboard and its backend API.
 *
 * Usage:
 *   FRONTEND_URL=https://dashboard.example.com \
 *   API_URL=https://monitor.example.com \
 *   npm run smoke:deployed
 */

const FRONTEND_URL = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '');
const API_URL = process.env.API_URL?.trim().replace(/\/+$/, '');

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
const API_ENDPOINTS = ['/healthz', '/api/v1/summary', '/api/v1/incidents'];

if (!FRONTEND_URL || !API_URL) {
  console.error('FRONTEND_URL and API_URL are required.');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function previewBody(body, maxLength = 120) {
  const text = body.replace(/\s+/g, ' ').trim();
  if (!text) {
    return '(empty body)';
  }
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

function shouldRetryStatus(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function isRetryableNetworkError(error) {
  return error instanceof TypeError;
}

async function fetchGetWithRetry(label, url, init = {}) {
  let lastError;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, method: 'GET' });
      const body = await response.text();

      if (response.ok) {
        return { response, body };
      }

      const message = [
        `${label} failed`,
        `URL: ${url}`,
        `HTTP ${response.status}`,
        `Preview: ${previewBody(body)}`,
      ].join('\n');

      if (attempt < RETRY_ATTEMPTS && shouldRetryStatus(response.status)) {
        console.warn(`Retry ${attempt}/${RETRY_ATTEMPTS - 1} for ${label} after HTTP ${response.status}`);
        lastError = new Error(message);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      throw new Error(message);
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < RETRY_ATTEMPTS) {
        console.warn(`Retry ${attempt}/${RETRY_ATTEMPTS - 1} for ${label} after network error`);
        lastError = error;
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      if (error instanceof Error && error.message.includes('URL:')) {
        throw error;
      }

      throw new Error(`${label} failed\nURL: ${url}\n${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw lastError ?? new Error(`${label} failed\nURL: ${url}`);
}

async function checkFrontend() {
  const { response, body } = await fetchGetWithRetry('Frontend', FRONTEND_URL);
  if (!body.toLowerCase().includes('<html')) {
    throw new Error([
      'Frontend response does not look like HTML',
      `URL: ${FRONTEND_URL}`,
      `HTTP ${response.status}`,
      `Preview: ${previewBody(body)}`,
    ].join('\n'));
  }

  console.log(`OK   Frontend: HTTP ${response.status} (${body.length} bytes)`);
}

async function checkApiEndpoints() {
  for (const path of API_ENDPOINTS) {
    const url = `${API_URL}${path}`;
    const { response, body } = await fetchGetWithRetry(`API ${path}`, url);
    console.log(`OK   ${path}: HTTP ${response.status} (${body.length} bytes)`);
  }
}

async function checkCors() {
  const url = `${API_URL}/api/v1/summary`;
  console.log(`Checking CORS for origin ${FRONTEND_URL}`);

  let lastError;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: FRONTEND_URL,
          'Access-Control-Request-Method': 'GET',
        },
      });

      const allowedOrigin = response.headers.get('access-control-allow-origin');
      if (allowedOrigin === FRONTEND_URL) {
        console.log(`OK   CORS: access-control-allow-origin=${allowedOrigin}`);
        return;
      }

      const message = [
        'CORS check failed',
        `URL: ${url}`,
        `HTTP ${response.status}`,
        `Expected access-control-allow-origin: ${FRONTEND_URL}`,
        `Got: ${allowedOrigin ?? '(missing)'}`,
      ].join('\n');

      if (attempt < RETRY_ATTEMPTS && shouldRetryStatus(response.status)) {
        console.warn(`Retry ${attempt}/${RETRY_ATTEMPTS - 1} for CORS after HTTP ${response.status}`);
        lastError = new Error(message);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      throw new Error(message);
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < RETRY_ATTEMPTS) {
        console.warn(`Retry ${attempt}/${RETRY_ATTEMPTS - 1} for CORS after network error`);
        lastError = error;
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      if (error instanceof Error && error.message.includes('URL:')) {
        throw error;
      }

      throw new Error(`CORS check failed\nURL: ${url}\n${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw lastError ?? new Error(`CORS check failed\nURL: ${url}`);
}

async function main() {
  console.log(`Checking frontend at ${FRONTEND_URL}`);
  await checkFrontend();
  await checkApiEndpoints();
  await checkCors();
  console.log('Deployed smoke test passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
