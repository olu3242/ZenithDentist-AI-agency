# Analytics Report
**Sprint:** Batch 2 — Runtime Convergence
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31

## Score: 84/100

## analyticsProjector() — lib/analytics/projector.ts

Canonical analytics path: Event Fabric → automation_traces → usage_metrics → AnalyticsProjection

### Output Shape

```
AnalyticsProjection {
  organizationId, period (YYYY-MM)
  eventFabric: { totalEvents, byType, bySource, deliveredCount, deliveryRate }
  workflowMetrics: { totalTraces, successRate, avgLatencyMs, deadLetterCount, topWorkflows[] }
  businessMetrics: { remindersProcessed, recallsProcessed, reviewsGenerated, aiInsightsConsumed }
  projectedAt
}
```

### Data Sources

| Source | Table | Org Scoped | Window |
|--------|-------|-----------|--------|
| Event Fabric | runtime_event_fabric_events | ✓ | 30 days |
| Workflow Traces | automation_traces | ✓ | 30 days |
| Dead Letters | automation_dead_letters | ✓ (post-migration) | 30 days |
| Business Metrics | usage_metrics | ✓ | Current month |

### Org Scoping

All 4 queries use `.eq("organization_id", organizationId)`. organizationId resolves
from parameter or getTenantData() fallback.

## Workflow Analytics — lib/workflow-os/workflow-analytics.ts

`getWorkflowAnalyticsSummary(organizationId?)` — now accepts org param.
Resolves via getTenantData() when absent.

`getTenantWorkflowAnalytics(organizationId)` — org-scoped end-to-end.

### Callers Updated

- lib/mission-control/index.ts → getWorkflowAnalyticsSummary(organizationId)
- lib/mission-control/roi-intelligence-center.ts → getWorkflowAnalyticsSummary(organizationId)
- lib/mission-control/dental-revenue-center.ts → getWorkflowAnalyticsSummary(organizationId)

## Gaps

- No time-series chart data (only current-period snapshots)
- No analytics export API endpoint
- No percentile/benchmark comparisons in projector
- No real-time streaming (batch projection only)
- No anomaly detection on analytics trends

## Recommendation

Analytics path is functional and org-isolated. Add export API and time-series
snapshots before enterprise launch.
