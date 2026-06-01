# Analytics Report — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Source:** `lib/analytics/projector.ts` + `lib/revenue-attribution/index.ts`

---

## Analytics Projector

**File:** `lib/analytics/projector.ts`

`analyticsProjector(organizationId?): Promise<AnalyticsProjection>` is the canonical analytics function. It projects Event Fabric + automation_traces into a unified snapshot.

### Data Sources (4 parallel queries)

1. `runtime_event_fabric_events` — event counts by type and source (30-day window, limit 1000)
2. `automation_traces` — workflow metrics: success rate, avg latency, dead letter count, SLA breaches
3. `automation_dead_letters` — dead letter count
4. Usage metrics — AI insights consumed

### Output: AnalyticsProjection

```typescript
interface AnalyticsProjection {
  eventFabric: {
    totalEvents: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    deliveredCount: number;
    deliveryRate: number;          // delivered / total
  };
  workflowMetrics: {
    totalTraces: number;
    successRate: number;           // 0–1
    avgLatencyMs: number;
    deadLetterCount: number;
    slaBreachCount: number;
    topWorkflows: Array<{ workflowId: string; executions: number; successRate: number }>;
  };
  businessMetrics: {
    remindersProcessed: number;
    recallsProcessed: number;
    reviewsGenerated: number;
    aiInsightsConsumed: number;
  };
}
```

---

## Attribution Engine

**File:** `lib/revenue-attribution/index.ts`

### Model

Attribution links `workflow_executions → revenue events → dollar amounts` using the `workflow_revenue_attribution` view (migration 202606010002).

### 7-Bucket Breakdown

| Bucket | Source Table | Attribution Field |
|--------|-------------|-----------------|
| `recallRecovery` | `recall_recovery_events` | `revenue_attributed` |
| `noShowPrevention` | `revenue_recovery_events` | `amount_recovered` where `recovery_type = "no_show_prevention"` |
| `chairFill` | `revenue_recovery_events` | `amount_recovered` where `recovery_type = "chair_fill"` |
| `treatmentAcceptance` | `revenue_recovery_events` | `amount_recovered` where `recovery_type = "treatment_acceptance"` |
| `reviews` | `review_growth_events` | `revenue_attributed` |
| `referrals` | `revenue_recovery_events` | `amount_recovered` where `recovery_type = "referral"` |
| `other` | `revenue_recovery_events` | `amount_recovered` for all other types |

### Key Functions

- `getWorkflowAttribution(workflowId, organizationId, period)` — per-workflow breakdown
- `getOrganizationRevenueSummary(organizationId, period)` — org-wide (calls getWorkflowAttribution with `"*"`)

Both functions run 3 parallel Supabase queries (revenue_recovery_events, recall_recovery_events, review_growth_events) filtered by organization_id and date range.

---

## Patient Metrics

From dental revenue OS tables:
- `recall_recovery_events` — recall contacts, appointment_booked flag, revenue_attributed
- `revenue_recovery_events` — recovery events by type + amount_recovered
- `review_growth_events` — review conversion rate, star_rating distribution
- `chair_utilization_snapshots` — fill rate, open slots, revenue recovered

---

## Revenue Metrics (6 Engine Buckets)

Revenue is tracked through 6 workflows that feed into the 7-bucket attribution model:

| Engine | Workflow ID | Attribution Bucket |
|--------|------------|------------------|
| No-Show Prevention | `appointment_no_show` | noShowPrevention |
| Recall Recovery | `recall_due` | recallRecovery |
| Treatment Acceptance | `ai_followup_required` | treatmentAcceptance |
| Chair Fill | `recall_due` (chair_fill trigger) | chairFill |
| Review Generation | `review_request_due` | reviews |
| Referral Engine | `lead_created` | referrals |

---

## API Routes for Revenue Data

**Directory:** `app/api/dental/`

| Route | File | Function |
|-------|------|---------|
| `GET /api/dental/attribution` | `app/api/dental/attribution/route.ts` | `getWorkflowAttribution()` — query params: workflowId, start, end |
| `GET /api/dental/revenue-summary` | `app/api/dental/revenue-summary/route.ts` | `getOrganizationRevenueSummary()` — 30-day default |
| `GET /api/dental/metrics` | `app/api/dental/metrics/route.ts` | Practice-level analytics |
| `GET /api/dental/recall` | `app/api/dental/recall/route.ts` | recall_recovery_events |
| `GET /api/dental/chairs` | `app/api/dental/chairs/route.ts` | chair_utilization_snapshots |
| `GET /api/dental/reviews` | `app/api/dental/reviews/route.ts` | review_growth_events |
| `GET /api/dental/revenue` | `app/api/dental/revenue/route.ts` | revenue_recovery_events |
| `GET /api/dental/practice` | `app/api/dental/practice/route.ts` | Practice profile |

---

## Readiness Score: 82/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Analytics projector | 85 | 4 parallel queries, AnalyticsProjection complete |
| Attribution engine | 85 | 7 buckets, 3 source tables, view implemented |
| Attribution view | 90 | workflow_revenue_attribution SQL view in migration |
| API routes | 80 | 8 routes present and documented |
| Patient metrics | 80 | recall/review/revenue tables queried |
| Real-time vs cached | 70 | analyticsProjector is live query, no caching layer yet |
| Multi-period support | 70 | 30-day default, custom range via start/end params |

**Gap:** The `businessMetrics.aiInsightsConsumed` field in AnalyticsProjection is partially stubbed — it counts from usage tracking tables that may not be fully populated until ALICE agents run at sufficient volume. Revenue attribution queries filter on `deleted_at IS NULL` which requires soft-delete support to be present in the revenue tables (confirmed in migration 202605300001).
