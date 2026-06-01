# API Observability Report

**Sprint:** Error Resilience
**Score:** 84 / 100 — GO

---

## Summary

All API routes now produce structured error responses with machine-readable codes, human-readable messages, recovery suggestions, and trace identifiers. A dedicated health endpoint provides real-time service status across all platform dependencies.

---

## errorToResponse() Conversion

The errorToResponse() function converts any ZenithError or raw exception into a consistent JSON envelope:

| Response Field | Source |
|---|---|
| code | ZenithError.code |
| category | ZenithError.category |
| message | ZenithError.message |
| suggestion | Blueprint recovery suggestion |
| traceId | ZenithError.traceId |

No stack traces or raw Postgres messages are included in production responses.

---

## HTTP Status Code Mapping

| Error Category | HTTP Status |
|---|---|
| VALIDATION_ERROR | 400 |
| AUTH_ERROR | 403 |
| RUNTIME_ERROR | 500 |
| DATABASE_ERROR | 500 |
| API_ERROR | 502 |

---

## Route Coverage

- All routes under /api/mission-control are wrapped with withErrorBoundary()
- All routes under /api/tenant are wrapped with withErrorBoundary()
- Raw thrown errors in unwrapped routes still produce a typed 500 via the global error handler

---

## Health Endpoint — GET /api/health

No authentication required. Returns service-level status for all platform dependencies.

| Service Checked | Method |
|---|---|
| database | organizations table ping |
| runtime | automation_traces table ping |
| event_fabric | runtime_event_fabric_events table ping |
| auth | NEXTAUTH_SECRET env var presence check |
| AI | ANTHROPIC_API_KEY env var presence check |

Response shape: `{ status, timestamp, version, services[] }` where each service entry includes name, status, and latency in milliseconds.

- Returns HTTP 200 when all services are healthy or degraded
- Returns HTTP 503 when any service is unavailable

---

## Findings

- Health endpoint latency data enables SLA dashboards without custom instrumentation
- traceId in every error response enables log correlation across Supabase, Vercel, and application layers
- Structured errors enable automated alerting rules based on error code patterns

---

## Recommendations

- Add version field to health response tied to git SHA for deployment tracking
- Wire /api/health into an uptime monitoring service (e.g. Better Uptime or Checkly)
