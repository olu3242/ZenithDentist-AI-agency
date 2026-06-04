# Integration Health Framework

## Overview

The Integration Health Framework provides continuous monitoring of all installed integrations. Every integration installation is health-checked on a 5-minute cadence, with automatic status classification, alert escalation, and Mission Control visibility.

---

## Table: `integration_health`

| Column               | Type      | Notes                                            |
|----------------------|-----------|--------------------------------------------------|
| id                   | uuid      | Primary key                                      |
| organization_id      | uuid      | Tenant FK                                        |
| integration_key      | text      | FK to integration_registry                       |
| status               | text      | healthy / degraded / down                        |
| last_check_at        | timestamp | Most recent health check execution time          |
| consecutive_failures | int       | Count of consecutive failed checks               |
| avg_latency_ms       | int       | Rolling 10-check average latency                 |
| error_message        | text      | Last error detail (null if healthy)              |
| updated_at           | timestamp | Last record update                               |

---

## Health Check Cadence

```
Every 5 minutes:
  For each active integration_installation:
    1. Execute integration-specific health check
    2. Measure latency_ms
    3. Classify response as success or failure
    4. Update integration_health record
    5. Evaluate alert thresholds
    6. Publish health_check event to integration_events
```

Health checks are disabled for integrations with `status = "disabled"` in `integration_installations`.

---

## Health Check Methods by Category

| Category      | Health Check Method                            |
|---------------|------------------------------------------------|
| PMS           | Authenticated API ping — list endpoint         |
| Calendar      | OAuth token validation + calendar list fetch   |
| Payment       | Stripe: retrieve account object                |
| Video         | HeyGen: list avatars API call                  |
| Voice         | ElevenLabs: list voices API call               |
| Communication | Twilio: account SID lookup                     |

---

## Status Classification

```
consecutive_failures = 0:     status = "healthy"
consecutive_failures 1–2:    status = "degraded" (intermittent issues)
consecutive_failures >= 3:   status = "down" (integration unavailable)

Additionally:
  avg_latency_ms > 5000:     status = "degraded" (latency threshold)
  avg_latency_ms > 15000:    status = "down" (timeout threshold)
```

### Status Definitions

| Status     | Meaning                                                    |
|------------|------------------------------------------------------------|
| `healthy`  | All checks passing, latency within normal parameters       |
| `degraded` | Intermittent failures or elevated latency, monitor closely |
| `down`     | Integration consistently unavailable, action required      |

---

## Alert Thresholds

| Threshold               | Value  | Alert Triggered                         |
|-------------------------|--------|-----------------------------------------|
| consecutive_failures    | 3      | Status → "down", Mission Control alert  |
| avg_latency_ms (warn)   | 5,000  | Status → "degraded"                     |
| avg_latency_ms (down)   | 15,000 | Status → "down"                         |
| No sync in 24 hours     | —      | Stale integration warning               |
| error_count spike       | +10/hr | Elevated error rate notification        |

---

## Degraded vs Down Classification

| Scenario                        | Classification | Auto-Disable |
|---------------------------------|----------------|--------------|
| 1–2 consecutive failures        | Degraded       | No           |
| 3–5 consecutive failures        | Down           | No           |
| 6+ consecutive failures         | Down           | Yes (auto-disable) |
| High latency, no failures       | Degraded       | No           |
| Authentication expired          | Down           | No (notify to reconfigure) |

---

## Auto-Disable Policy

When `consecutive_failures >= 6`:
1. Integration status set to `disabled` in `integration_installations`
2. Mission Control: Critical alert — "Integration auto-disabled: {name}"
3. Practice manager email notification (when email enabled)
4. Integration must be manually re-enabled after credential verification

Auto-disable prevents runaway error accumulation and protects sync counters.

---

## Mission Control Integration Command Center

Located at `/mission-control/integrations`:

### Integration Status Grid
All installed integrations displayed as status cards:
- Green = healthy
- Yellow = degraded
- Red = down
- Grey = disabled

Each card shows:
- Integration name and category logo
- Last synced timestamp
- Sync count (total successful syncs)
- Error count (last 24 hours)
- Average latency
- Quick actions: Test Connection, Disable, View Events

### Alert Banner
When any integration has `status = "down"`, a persistent banner appears:
> "⚠ Integration Alert: [Name] is unavailable. Last successful sync: [time]."

### Integration Event Log
Drill-down view per integration shows the last 100 `integration_events`:
- Timestamp, event type, records synced, duration, error

### Latency Chart
Rolling 24-hour latency chart per integration — identifies performance degradation trends before failures occur.

---

## Integration Health API

| Route                               | Method | Purpose                          |
|-------------------------------------|--------|----------------------------------|
| `/api/integration-os/health`        | GET    | Get health for all installations |
| `/api/integration-os/health/:key`   | GET    | Get health for specific integration |
| `/api/integration-os/health/check`  | POST   | Trigger manual health check      |

---

## Observability Integration

Integration health events are published to the Event Fabric:
```
Event Key: integration.health.{key}.{status}
Event Type: platform
Source: integration_os
Payload: { integrationKey, status, consecutiveFailures, avgLatencyMs }
```

ALICE monitors integration health signals as part of operational context — a down PMS integration affects data freshness for all patient-facing agents.
