# Mission Control™ — Automation Health Dashboard

## Purpose

The Workflow Command Center within Mission Control™ surfaces automation health metrics, providing real-time visibility into the performance of Workflow OS™, the Communication Hub, ALICE decision engine, and Event Fabric. This dashboard is the canonical observability platform for Zenith automation.

**API Endpoint:** `GET /api/automation-health`

---

## Panel 1: Automation Engine Status

Surfaces the operational health of Workflow OS™ execution.

### Metrics

| Metric | Description |
|--------|-------------|
| Workflow Throughput (24h) | Total workflow executions in the past 24 hours |
| Success Rate | `(succeeded / total) * 100` |
| Failure Count | Workflows in `failed` status |
| Retry Count | Workflows that required at least one retry attempt |
| Dead Letter Count | Workflows that exceeded max retries and were moved to DLQ |

### SQL Queries

```sql
-- Workflow Throughput (24h)
SELECT COUNT(*) as throughput_24h
FROM workflow_executions
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Success Rate
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as success_rate
FROM workflow_executions
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Failure Count
SELECT COUNT(*) as failure_count
FROM workflow_executions
WHERE organization_id = $1
  AND status = 'failed'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Retry Count
SELECT COUNT(*) as retry_count
FROM workflow_executions
WHERE organization_id = $1
  AND retry_count > 0
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Dead Letter Count
SELECT COUNT(*) as dlq_count
FROM workflow_executions
WHERE organization_id = $1
  AND status = 'dead_lettered'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

---

## Panel 2: Communication Hub Status

Surfaces delivery performance across all communication channels and providers.

### Metrics

| Metric | Description |
|--------|-------------|
| Internal Delivery Rate | % of messages delivered via internal adapters vs n8n |
| Provider Status per Channel | Health of SMS, Email, WhatsApp, Video, Voice, Portal |
| Delivery Success Rate per Provider | Successful deliveries / total attempts per provider |

### SQL Queries

```sql
-- Internal Delivery Rate
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE delivery_owner = 'internal') * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as internal_delivery_rate
FROM communication_deliveries
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Delivery Success Rate by Channel and Provider
SELECT
  channel,
  provider,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'delivered') * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as success_rate
FROM communication_deliveries
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY channel, provider
ORDER BY channel, provider;
```

---

## Panel 3: n8n Dependency Score

Tracks progress toward Zenith's goal of near-zero internal n8n dependency.

### Metrics

| Metric | Description |
|--------|-------------|
| Dependency Score | 0–100 (lower is better) |
| Formula | `(n8n_dependent_workflows / total_workflows) * 100` |
| Current Score | ~4 |
| Target | < 15 |
| Trend | Direction indicator (improving / stable / degrading) |

### SQL Queries

```sql
-- n8n Dependency Score
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE delivery_owner = 'n8n') * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as n8n_dependency_score,
  COUNT(*) FILTER (WHERE delivery_owner = 'n8n') as n8n_count,
  COUNT(*) as total_count
FROM communication_deliveries
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Trend (compare last 24h vs previous 24h)
SELECT
  period,
  ROUND(
    n8n_count * 100.0 / NULLIF(total_count, 0),
    2
  ) as n8n_score
FROM (
  SELECT
    'current_24h' as period,
    COUNT(*) FILTER (WHERE delivery_owner = 'n8n') as n8n_count,
    COUNT(*) as total_count
  FROM communication_deliveries
  WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'
  UNION ALL
  SELECT
    'previous_24h' as period,
    COUNT(*) FILTER (WHERE delivery_owner = 'n8n') as n8n_count,
    COUNT(*) as total_count
  FROM communication_deliveries
  WHERE organization_id = $1
    AND created_at >= NOW() - INTERVAL '48 hours'
    AND created_at < NOW() - INTERVAL '24 hours'
) periods;
```

---

## Panel 4: ALICE Command Center Metrics

Surfaces the operational health of the ALICE Decision Engine.

### Metrics

| Metric | Description |
|--------|-------------|
| Pending Decisions | Recommendations generated but not yet actioned |
| Average Confidence Score | Mean confidence across all decisions (0–100) |
| Decisions Actioned Today | Recommendations acted on in the last 24h |
| Fallback Rate | AI failures that fell back to rule-based decisions |

### SQL Queries

```sql
-- Pending Decisions
SELECT COUNT(*) as pending_decisions
FROM alice_recommendations
WHERE organization_id = $1
  AND status = 'pending'
  AND created_at >= NOW() - INTERVAL '7 days';

-- Average Confidence Score
SELECT ROUND(AVG(confidence_score), 2) as avg_confidence
FROM alice_recommendations
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Decisions Actioned Today
SELECT COUNT(*) as actioned_today
FROM alice_recommendations
WHERE organization_id = $1
  AND status = 'actioned'
  AND updated_at >= NOW() - INTERVAL '24 hours';

-- Fallback Rate
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE recommendation_source = 'fallback_rules') * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) as fallback_rate
FROM alice_recommendations
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';
```

---

## Panel 5: Event Fabric Health

Surfaces the operational health of the Event Fabric™ event pipeline.

### Metrics

| Metric | Description |
|--------|-------------|
| Events Published (24h) | Total events written to runtime_event_fabric_events |
| Events by Type | Breakdown by eventType enum |
| Dual Write Confirmation | Count in mission_control_events vs runtime_event_fabric_events |
| Event-to-Workflow Lag | Time from event published to corresponding workflow triggered |

### SQL Queries

```sql
-- Events Published (24h)
SELECT COUNT(*) as events_24h
FROM runtime_event_fabric_events
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Events by Type
SELECT
  event_type,
  COUNT(*) as count
FROM runtime_event_fabric_events
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;

-- Dual Write Check (events should match between tables)
SELECT
  'runtime_event_fabric_events' as source,
  COUNT(*) as event_count
FROM runtime_event_fabric_events
WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'mission_control_events' as source,
  COUNT(*) as event_count
FROM mission_control_events
WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '24 hours';

-- Average Event-to-Workflow Lag (milliseconds)
SELECT
  ROUND(AVG(
    EXTRACT(EPOCH FROM (we.created_at - e.created_at)) * 1000
  ), 2) as avg_lag_ms
FROM runtime_event_fabric_events e
JOIN workflow_executions we
  ON we.trigger_event_id = e.id
WHERE e.organization_id = $1
  AND e.created_at >= NOW() - INTERVAL '24 hours';
```

---

## Refresh Cadence

| Panel | Refresh Mode | Interval |
|-------|-------------|----------|
| Automation Engine Status | Event-driven (real-time) | On workflow state change |
| Communication Hub Status | Standard polling | 5 minutes |
| n8n Dependency Score | Standard polling | 5 minutes |
| ALICE Command Center | Standard polling | 5 minutes |
| Event Fabric Health | Event-driven (real-time) | On event publish |

---

## Alert Thresholds

| Metric | Yellow Alert | Red Alert |
|--------|-------------|-----------|
| Workflow Success Rate | < 90% | < 75% |
| Dead Letter Queue Count | > 5 (warning) | > 10 (alert) |
| Event-to-Workflow Lag | > 5,000ms | > 30,000ms |
| ALICE Fallback Rate | > 20% | > 40% |
| n8n Dependency Score | > 15 | > 30 |
| Internal Delivery Rate | < 90% | < 75% |

---

*Report generated: 2026-06-02 | Branch: release/platform-convergence*
