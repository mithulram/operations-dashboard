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

if (!FRONTEND_URL || !API_URL) {
  console.error('FRONTEND_URL and API_URL are required.');
  process.exit(1);
}

const API_ENDPOINTS = ['/healthz', '/api/v1/summary', '/api/v1/incidents'];

async function check(name, url, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${name} failed: HTTP ${response.status} for ${url}`);
  }
  return response;
}

async function main() {
  console.log(`Checking frontend at ${FRONTEND_URL}`);
  const frontendResponse = await check('Frontend', FRONTEND_URL);
  const frontendBody = await frontendResponse.text();
  if (!frontendBody.toLowerCase().includes('<html')) {
    throw new Error('Frontend response does not look like HTML');
  }
  console.log(`OK   Frontend: HTTP ${frontendResponse.status} (${frontendBody.length} bytes)`);

  for (const path of API_ENDPOINTS) {
    const url = `${API_URL}${path}`;
    const response = await check(`API ${path}`, url);
    const body = await response.text();
    console.log(`OK   ${path}: HTTP ${response.status} (${body.length} bytes)`);
  }

  console.log(`Checking CORS for origin ${FRONTEND_URL}`);
  const corsResponse = await fetch(`${API_URL}/api/v1/summary`, {
    method: 'OPTIONS',
    headers: {
      Origin: FRONTEND_URL,
      'Access-Control-Request-Method': 'GET',
    },
  });

  const allowedOrigin = corsResponse.headers.get('access-control-allow-origin');
  if (allowedOrigin !== FRONTEND_URL) {
    throw new Error(
      `CORS check failed: expected access-control-allow-origin ${FRONTEND_URL}, got ${allowedOrigin ?? '(missing)'}`,
    );
  }
  console.log(`OK   CORS: access-control-allow-origin=${allowedOrigin}`);

  console.log('Deployed smoke test passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
