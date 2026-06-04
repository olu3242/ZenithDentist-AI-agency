# Marketplace Framework

## Overview

The Marketplace Framework is the integration catalog and installation management system within Integration OS. It maintains a registry of all available integrations, manages per-organization installations, monitors health, and provides a full audit trail of all integration activity.

---

## Tables

### `integration_registry` — The Integration Catalog

Global catalog of all integrations available on the platform. Seeded with 9 integrations.

| Column          | Type      | Notes                                     |
|-----------------|-----------|-------------------------------------------|
| id              | uuid      | Primary key                               |
| integration_key | text      | Unique slug (e.g., "opendental")          |
| display_name    | text      | Human-readable name                       |
| category        | text      | pms / calendar / payment / video / voice / communication |
| description     | text      | What this integration does                |
| logo_url        | text      | Marketplace UI display                    |
| docs_url        | text      | Setup documentation link                  |
| required_config | jsonb     | Config keys required at install time      |
| is_active       | boolean   | Available for new installs                |
| created_at      | timestamp |                                           |

### 9 Seeded Integrations

| Key                 | Display Name        | Category      |
|---------------------|---------------------|---------------|
| `opendental`        | OpenDental          | PMS           |
| `dentrix`           | Henry Schein Dentrix| PMS           |
| `eaglesoft`         | Patterson Eaglesoft | PMS           |
| `curve`             | Curve Dental        | PMS           |
| `carestack`         | CareStack           | PMS           |
| `google_calendar`   | Google Calendar     | Calendar      |
| `stripe`            | Stripe              | Payment       |
| `heygen`            | HeyGen              | Video         |
| `elevenlabs`        | ElevenLabs          | Voice         |

---

### `integration_installations` — Per-Organization Installations

One row per integration per organization. Organizations can install and configure integrations independently.

| Column          | Type      | Notes                                          |
|-----------------|-----------|------------------------------------------------|
| id              | uuid      | Primary key                                    |
| organization_id | uuid      | Tenant FK                                      |
| integration_key | text      | FK to integration_registry.integration_key     |
| status          | text      | active / disabled / error                      |
| sync_count      | int       | Total successful syncs                         |
| error_count     | int       | Total failed syncs (rolling)                   |
| last_synced_at  | timestamp | Last successful sync time                      |
| metadata        | jsonb     | API keys, endpoint URLs, config values         |
| created_at      | timestamp |                                                |
| updated_at      | timestamp |                                                |

---

### `integration_health` — Real-Time Health Monitoring

One row per installation, updated on each health check cycle (every 5 minutes).

| Column               | Type      | Notes                                       |
|----------------------|-----------|---------------------------------------------|
| id                   | uuid      | Primary key                                 |
| organization_id      | uuid      | Tenant FK                                   |
| integration_key      | text      |                                             |
| status               | text      | healthy / degraded / down                   |
| last_check_at        | timestamp | Most recent health check time               |
| consecutive_failures | int       | Failures since last success                 |
| avg_latency_ms       | int       | Rolling average latency                     |
| error_message        | text      | Last error detail (if any)                  |
| updated_at           | timestamp |                                             |

---

### `integration_events` — Audit Trail

Immutable event log. Every sync, error, and configuration change appends a record.

| Column          | Type      | Notes                                          |
|-----------------|-----------|------------------------------------------------|
| id              | uuid      | Primary key                                    |
| organization_id | uuid      | Tenant FK                                      |
| integration_key | text      |                                                |
| event_type      | text      | sync / error / install / disable / health_check |
| records_synced  | int       | Count of records processed                     |
| duration_ms     | int       | Time taken for operation                       |
| error           | text      | Error message if event_type = error            |
| occurred_at     | timestamp | Event timestamp                                |

---

## Installation Flow

```
1. Practice admin selects integration from marketplace
2. Provides required_config values (API keys, endpoints)
3. installIntegration(orgId, key, config) called
   → Inserts integration_installations row with status: "active"
   → Records "install" event in integration_events
4. First sync triggered immediately
5. Health monitoring begins on 5-minute cadence
```

---

## Disable Flow

```
1. Admin disables integration
2. disableIntegration(orgId, key) called
   → Updates status to "disabled"
   → Records "disable" event in integration_events
3. Health checks suspended for disabled integrations
4. Historical sync data preserved
5. Re-activation restores prior configuration
```

---

## Health Check Flow

```
Every 5 minutes per installed integration:

1. Ping integration endpoint
2. Record latency_ms
3. If success:
   → status = "healthy"
   → consecutive_failures = 0
4. If failure:
   → consecutive_failures++
   → if consecutive_failures >= 3: status = "degraded"
   → if consecutive_failures >= 6: status = "down"
5. Update integration_health row
6. If status changed to "down": alert Executive Dashboard
```

---

## Executive Dashboard Integration Panel

The Integration Command Center in Executive Dashboard displays:
- All installed integrations with current health status
- Last synced timestamp and sync count
- Error counts with drill-down to integration_events
- Quick-action: re-enable / disable / test connection
- Alert banner for integrations with `status = "down"`

See `INTEGRATION_HEALTH_FRAMEWORK.md` for monitoring detail.

---

## Future Marketplace Expansion

The integration_registry architecture supports third-party integrations:
- Patient financing (CareCredit, LendingClub)
- Review platforms (Google, Yelp, Healthgrades)
- Automated scheduling (Nexhealth, Luma Health)
- Imaging systems (Dexis, Apteryx)
- Patient communication (Weave, Lighthouse 360)

New integrations require: registry entry, adapter implementation, normalization function. No changes to platform business logic.
