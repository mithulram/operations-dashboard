# Operations Dashboard

A production-style React dashboard that gives operations teams a single view of availability SLOs, error-budget headroom, and active incidents. It consumes live REST data from the companion [Service Health & Incident Monitor](../service-health-incident-monitor) backend (portfolio project #4).

> **Scope note:** This is a portfolio frontend paired with a synthetic in-memory API. It demonstrates how operational signals are surfaced to on-call engineers; it is not a replacement for Grafana, PagerDuty, or an enterprise observability stack.

![Operations dashboard — desktop](docs/screenshots/dashboard-desktop.png)

## Problem statement

Platform and SRE teams routinely juggle separate tools for SLO tracking, error-budget burn, and incident context. During an outage, switching between dashboards slows triage. This project shows a focused operations view that pulls quantitative health signals and qualitative incident metadata into one responsive, accessible UI with filtering, loading states, and automatic refresh.

## Quick start

Start the backend first (project #4):

```bash
cd ../service-health-incident-monitor
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[test]'
uvicorn service_monitor.app:app --host 127.0.0.1 --port 8090
```

Then run the dashboard:

```bash
cd ../operations-dashboard
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite proxies `/api` and `/healthz` to `http://127.0.0.1:8090` during development.

### Environment

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Optional API origin. Leave empty to use relative paths via the Vite dev proxy or same-origin deployment. |

Example for a deployed API:

```bash
VITE_API_BASE_URL=https://monitor.example.com npm run build
```

## Scripts

```bash
npm install    # install dependencies
npm run dev      # start Vite dev server with API proxy
npm test         # run Vitest component tests
npm run build    # type-check and produce production build
```

## Architecture

- **React + TypeScript + Vite** for a fast, typed SPA toolchain.
- **`src/api/client.ts`** — typed `fetch` wrapper with network and HTTP error handling.
- **`App.tsx`** — orchestrates data loading, 30-second auto-refresh (paused on error), and client-side incident filtering.
- **Components** — summary metric cards, filter bar, incidents table, loading skeleton, and error banner with retry.
- **Accessibility** — semantic landmarks, `aria-live` regions, keyboard-friendly filter chips, and table captions.
- **CI** — GitHub Actions runs `npm ci`, `npm test`, and `npm run build` on every push.

## API contract

| Endpoint | Used for |
|---|---|
| `GET /healthz` | Liveness check |
| `GET /api/v1/summary` | Availability, SLO target, error budget, open incident count |
| `GET /api/v1/incidents` | Incident list with severity, status, and timestamps |

## Screenshots

| View | File |
|---|---|
| Desktop | `docs/screenshots/dashboard-desktop.png` |
| Mobile | `docs/screenshots/dashboard-mobile.png` |

Capture after starting the Service Health backend and `npm run dev`.

## Resume-ready description

> Built a TypeScript/React operations dashboard that consumes a live SLO and incident API, surfaces availability and error-budget metrics with accessible filtering, handles loading and retry states, auto-refreshes on a 30-second cadence, and ships with Vitest component tests and GitHub Actions CI.

## License

MIT. See [LICENSE](LICENSE).
