# Health Monitoring Report

**Sprint:** Error Resilience
**Score:** 88 / 100 — GO

---

## Summary

A public health check endpoint provides real-time service-level status for all platform dependencies. Latency per service is captured and returned, enabling SLA dashboards and uptime monitors to consume structured health data without custom instrumentation.

---

## Endpoint — GET /api/health

- No authentication required
- Safe for use by external uptime monitors, load balancers, and status pages

---

## Services Checked

| Service | Check Method |
|---|---|
| database | SELECT 1 ping against organizations table |
| runtime | SELECT 1 ping against automation_traces table |
| event_fabric | SELECT 1 ping against runtime_event_fabric_events table |
| auth | NEXTAUTH_SECRET environment variable presence |
| AI | ANTHROPIC_API_KEY environment variable presence |

---

## Response Shape

| Field | Type | Description |
|---|---|---|
| status | string | Overall platform status |
| timestamp | string | ISO 8601 check time |
| version | string | Application version string |
| services | array | Per-service status objects |

Each service entry in the array includes: name, status, and latencyMs.

---

## Status Levels

| Status | Meaning |
|---|---|
| healthy | All checks passed within normal latency |
| degraded | Check passed but latency elevated or partial failure |
| unavailable | Check failed — service unreachable or env var missing |

---

## HTTP Behavior

- Returns **HTTP 200** when all services are healthy or degraded (degraded status visible in response body)
- Returns **HTTP 503** when any single service is unavailable
- Load balancers should use 503 as the signal to remove the instance from rotation

---

## Findings

- Latency capture per service enables percentile tracking over time if health check results are stored
- auth and AI checks are lightweight (env var only) and add negligible overhead
- database, runtime, and event_fabric checks use minimal-cost table pings

---

## Recommendations

- Store health check results in a time-series table for 30-day availability reporting
- Add circuit breaker state per service to the health response body
- Set external monitor check interval to 60 seconds or less for responsive alerting
