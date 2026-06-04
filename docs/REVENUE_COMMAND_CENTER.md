# Revenue Command Center

## Overview

The Executive Dashboard Revenue Command Center is the primary financial intelligence panel for practice owners and administrators. It surfaces nine key revenue metrics in real time, enabling immediate visibility into revenue health, recovery opportunities, and forecast performance.

---

## 9 Revenue Metrics

### 1. Monthly Revenue

**Definition:** Total revenue collected in the current calendar month.

**Data Source:** `revenue_attribution_records.revenue_amount` where `attributed_at >= start_of_month`

```sql
SELECT COALESCE(SUM(revenue_amount), 0) AS monthly_revenue
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attributed_at >= date_trunc('month', NOW())
  AND attributed_at < date_trunc('month', NOW()) + INTERVAL '1 month';
```

---

### 2. Revenue Influenced

**Definition:** Total revenue where ALICE or automation touchpoints contributed to the patient converting (any attribution model).

**Data Source:** `revenue_attribution_records` where `influenced_by IS NOT NULL`

```sql
SELECT COALESCE(SUM(revenue_amount), 0) AS revenue_influenced
FROM revenue_attribution_records
WHERE organization_id = $1
  AND influenced_by IS NOT NULL
  AND attributed_at >= date_trunc('month', NOW());
```

---

### 3. Revenue Recovered

**Definition:** Revenue from opportunities that were marked `won` — i.e., patients who were at risk and converted after outreach.

**Data Source:** `revenue_opportunities` joined to `revenue_attribution_records`

```sql
SELECT COALESCE(SUM(ro.estimated_revenue), 0) AS revenue_recovered
FROM revenue_opportunities ro
WHERE ro.organization_id = $1
  AND ro.status = 'won'
  AND ro.won_at >= date_trunc('month', NOW());
```

---

### 4. Revenue At Risk

**Definition:** Open opportunities with `opportunity_score >= 70` that have not been actioned for more than 14 days. This represents revenue that is actively at risk of being lost if not addressed.

**Data Source:** `revenue_opportunities`

```sql
SELECT COALESCE(SUM(estimated_revenue), 0) AS revenue_at_risk
FROM revenue_opportunities
WHERE organization_id = $1
  AND status = 'open'
  AND opportunity_score >= 70
  AND (actioned_at IS NULL OR actioned_at < NOW() - INTERVAL '14 days')
  AND created_at < NOW() - INTERVAL '14 days';
```

**Alert threshold:** Revenue At Risk > $10,000 → flag in dashboard with red indicator.

---

### 5. Treatment Revenue

**Definition:** Revenue attributed to treatment completions this month.

**Data Source:** `revenue_attribution_records` where `revenue_type = 'treatment'`

```sql
SELECT COALESCE(SUM(revenue_amount), 0) AS treatment_revenue
FROM revenue_attribution_records
WHERE organization_id = $1
  AND revenue_type = 'treatment'
  AND attributed_at >= date_trunc('month', NOW());
```

---

### 6. Membership Revenue

**Definition:** Active membership MRR — current monthly value of all active memberships.

**Data Source:** `membership_tracking`

```sql
SELECT COALESCE(SUM(monthly_value), 0) AS membership_revenue
FROM membership_tracking
WHERE organization_id = $1
  AND status = 'active';
```

---

### 7. Recall Revenue

**Definition:** Revenue attributed to recall appointments completed this month.

**Data Source:** `revenue_attribution_records` where `revenue_type = 'recall'`

```sql
SELECT COALESCE(SUM(revenue_amount), 0) AS recall_revenue
FROM revenue_attribution_records
WHERE organization_id = $1
  AND revenue_type = 'recall'
  AND attributed_at >= date_trunc('month', NOW());
```

---

### 8. Referral Revenue

**Definition:** Revenue from patients referred by existing patients, attributed this month.

**Data Source:** `revenue_attribution_records` where `revenue_type = 'referral'`

```sql
SELECT COALESCE(SUM(revenue_amount), 0) AS referral_revenue
FROM revenue_attribution_records
WHERE organization_id = $1
  AND revenue_type = 'referral'
  AND attributed_at >= date_trunc('month', NOW());
```

---

### 9. Review Influence Revenue

**Definition:** Revenue from patients who booked after reading or interacting with a review-related touchpoint.

**Data Source:** `revenue_attribution_records` where `attribution_source = 'review'`

```sql
SELECT COALESCE(SUM(revenue_amount), 0) AS review_influence_revenue
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_source = 'review'
  AND attributed_at >= date_trunc('month', NOW());
```

---

## Metrics Summary Table

| Metric | Source Table | Update Cadence | Alert Threshold |
|--------|-------------|----------------|-----------------|
| Monthly Revenue | revenue_attribution_records | Real-time | N/A |
| Revenue Influenced | revenue_attribution_records | Real-time | N/A |
| Revenue Recovered | revenue_opportunities | Every 5 min | N/A |
| Revenue At Risk | revenue_opportunities | Every 5 min | > $10,000 → red flag |
| Treatment Revenue | revenue_attribution_records | Real-time | N/A |
| Membership Revenue | membership_tracking | Hourly | N/A |
| Recall Revenue | revenue_attribution_records | Real-time | N/A |
| Referral Revenue | revenue_attribution_records | Real-time | N/A |
| Review Influence Revenue | revenue_attribution_records | Real-time | N/A |

---

## API Queries

### Opportunities Panel

```
GET /api/revenue-os/opportunities?minScore=50&status=open
```

Refresh cadence: every 5 minutes via polling or WebSocket invalidation.

### Forecast Panel

```
GET /api/revenue-os/forecast?horizon=30,90,365
```

Refresh cadence: daily (forecast recalculated nightly).

### Revenue Summary

```
GET /api/revenue-os
```

Returns all 9 metrics in a single aggregated response.

---

## Refresh Cadence

| Data Type | Cadence | Mechanism |
|-----------|---------|-----------|
| Opportunities (open/at-risk) | Every 5 minutes | Polling or server-sent events |
| Forecasts | Daily | Nightly cron job |
| Attribution records | Real-time | DB trigger + cache invalidation |
| Provider leaderboard | Hourly | Background job |
| Benchmark percentiles | Weekly | Scheduled snapshot |

---

## Alert Thresholds

| Alert | Condition | Display |
|-------|-----------|---------|
| Revenue At Risk | Total at-risk > $10,000 | Red badge on command center |
| Forecast Accuracy | `accuracy_score < 0.70` after horizon passes | Yellow warning in forecast panel |
| No Recent Attribution | No attribution records in 14 days | Warning: "No revenue attributed recently" |
| Stale Opportunities | >20 open opportunities unactioned >7 days | Notification to admin |

---

## Dashboard Layout (Executive Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│  REVENUE COMMAND CENTER                              [Practice] │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Monthly Rev  │ Rev Influenced│ Rev Recovered │ ⚠ Rev At Risk     │
│  $42,300     │  $31,200      │  $8,500       │  $12,400          │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│  Treatment   │  Membership   │  Recall       │  Referral  │Review│
│  $28,000     │  $6,300       │  $5,100       │  $2,400   │$500  │
├─────────────────────────────────────────────────────────────────┤
│  FORECAST                        │  OPPORTUNITIES               │
│  30d: $44,000 (±30%)             │  17 open  |  $38,400 est.    │
│  90d: $135,000 (±30%)            │  [View All Opportunities]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- [Revenue OS Architecture](REVENUE_OS_ARCHITECTURE.md)
- [Revenue Opportunity Engine](REVENUE_OPPORTUNITY_ENGINE.md)
- [Revenue Forecasting Engine](REVENUE_FORECASTING_ENGINE.md)
- [Executive Dashboard Master Spec](MISSION_CONTROL_MASTER_SPEC.md)
