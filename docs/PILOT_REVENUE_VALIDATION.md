# Pilot Revenue Validation Framework

> How to validate that the Zenith Patient OS™ is generating measurable, attributable revenue during a pilot.

---

## Purpose

Revenue validation is the primary commercial evidence that a pilot is working. It converts pilot success into contract renewal and expansion conversations. This document defines the data pipeline, validation queries, ROI calculation, and milestone checkpoints for revenue attribution during a 30-day pilot.

---

## Revenue Touchpoint Lifecycle

```
Workflow triggers
    ↓ (Workflow OS executes communication workflow)
Communication sent
    ↓ (SMS, Email, or Video delivered via Communication Hub)
Patient engages
    ↓ (opens email, clicks link, replies to SMS)
Patient books / accepts
    ↓ (appointment created in PMS or treatment plan accepted)
revenue_attribution_records created
    ↓ (touchpoint_type, attributed_revenue, attribution_confidence)
ALICE learning loop notified
    ↓ (alice_outcome_records.revenue_attributed updated)
Client health score updated
    ↓ (revenue_attribution_score dimension recalculated)
```

---

## 4 Revenue Attribution Engines

Each engine creates records in `revenue_attribution_records` with its own `touchpoint_type` and attribution logic.

### 1. No-Show Prevention Engine

| Field | Value |
|-------|-------|
| `touchpoint_type` | `no_show_prevention` |
| Attribution logic | Prevented no-show × average appointment value |
| Evidence | Appointment status changed from 'at_risk' to 'confirmed' after reminder sent |
| Confidence | 0.85 (high — direct causal link) |
| Typical value | $150–$300 per appointment saved |

### 2. Treatment Acceptance Engine

| Field | Value |
|-------|-------|
| `touchpoint_type` | `treatment_acceptance` |
| Attribution logic | Accepted treatment fee × attribution_confidence |
| Evidence | treatment_plans.status changed to 'accepted' within 7 days of ALICE recommendation |
| Confidence | 0.70 (medium — correlation with recommendation timing) |
| Typical value | $300–$2,000 per treatment accepted |

### 3. Referral Growth Engine

| Field | Value |
|-------|-------|
| `touchpoint_type` | `referral_growth` |
| Attribution logic | Referred patient's first treatment value |
| Evidence | New patient has referral_source = existing patient who received referral request |
| Confidence | 0.90 (high — direct referral link) |
| Typical value | $200–$500 first appointment |

### 4. Chair Fill Engine

| Field | Value |
|-------|-------|
| `touchpoint_type` | `chair_fill` |
| Attribution logic | Revenue from filled slot that was empty at time of recall sequence |
| Evidence | Appointment created within 3 days of recall communication delivery |
| Confidence | 0.75 (medium — recall-to-book correlation) |
| Typical value | $150–$400 per appointment |

---

## Revenue Validation SQL Queries

### 1. Total Attributed Revenue MTD

```sql
SELECT
  SUM(attributed_revenue) AS total_attributed_mtd,
  COUNT(*) AS attribution_count
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_date >= date_trunc('month', now());
```

**Expected result by Day 21**: `total_attributed_mtd > 0`

---

### 2. Attribution by Engine

```sql
SELECT
  touchpoint_type,
  COUNT(*) AS record_count,
  SUM(attributed_revenue) AS total_revenue,
  AVG(attribution_confidence) AS avg_confidence
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_date >= date_trunc('month', now())
GROUP BY touchpoint_type
ORDER BY total_revenue DESC;
```

Use this to identify which engine is performing best and which needs tuning.

---

### 3. ALICE-Linked Revenue

```sql
SELECT
  rar.touchpoint_type,
  rar.attributed_revenue,
  aor.outcome_type,
  aor.decision_type,
  aor.feedback_signal
FROM revenue_attribution_records rar
JOIN alice_outcome_records aor
  ON rar.touchpoint_id = aor.decision_id
WHERE rar.organization_id = $1
  AND rar.attribution_date >= date_trunc('month', now());
```

This query links revenue directly to ALICE decisions, validating the AI contribution.

---

### 4. 7-Day Rolling Attribution Trend

```sql
SELECT
  DATE_TRUNC('day', attribution_date) AS day,
  SUM(attributed_revenue) AS daily_revenue,
  COUNT(*) AS daily_records
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_date >= now() - interval '7 days'
GROUP BY 1
ORDER BY 1;
```

A flat or declining trend after Day 14 is a risk signal.

---

## Pilot ROI Calculation

### Formula

```
Monthly Subscription Fee = client_accounts.monthly_fee (from package_type)
Revenue Attributed MTD   = SUM(revenue_attribution_records.attributed_revenue) WHERE month = current
ROI = (Revenue Attributed MTD / Monthly Subscription Fee) × 100
```

### ROI Targets

| Timeline | Target ROI | Status |
|----------|-----------|--------|
| Day 21 | ≥ 100% (break-even) | Minimum threshold |
| Day 30 | ≥ 300% (3x return) | Pilot success target |
| Month 3 | ≥ 500% (5x return) | Expansion trigger |

### Example Calculation

```
Package: Growth (monthly_fee = $997)
Attributed Revenue MTD: $3,200
ROI = (3200 / 997) × 100 = 320.96%
Status: ✅ Exceeds 300% target
```

---

## Revenue Dashboard API

```
GET /api/pilot?organizationId={orgId}
```

Returns `revenue_attribution_score` (0–100) as part of the client health calculation:

| Score Range | Meaning |
|-------------|---------|
| 100 | ≥ 10 attribution records MTD |
| 75 | 6–9 attribution records MTD |
| 50 | 3–5 attribution records MTD |
| 25 | 1–2 attribution records MTD |
| 0 | 0 attribution records MTD |

---

## Validation Milestones

| Day | Milestone | Validation Query | Success Condition |
|-----|-----------|-----------------|------------------|
| 7 | First communication delivered | journey_scheduled_steps WHERE status='delivered' | count ≥ 1 |
| 14 | First patient engagement | pilot_health_events WHERE event_type='patient_engaged' | count ≥ 1 |
| 21 | **First revenue attribution** | revenue_attribution_records WHERE org = $1 | count ≥ 1, revenue > 0 |
| 30 | ROI target achieved | revenue_attribution_records SUM | ROI ≥ 300% |

**Day 21 is the critical commercial milestone.** If no attribution is recorded by Day 21, immediate intervention is required.

---

## Risk: No Revenue Attribution After 14 Days

If `revenue_attribution_records.count = 0` after 14 days, the Growth Agent automatically generates:

```json
{
  "recommendation_type": "revenue_risk",
  "priority": "high",
  "title": "No revenue attribution after 14 days",
  "recommendations": [
    "Verify communication channels are delivering (check journey_health)",
    "Confirm PMS sync is pulling real patient data",
    "Review appointment booking workflow triggers",
    "Escalate to CSM: manual attribution review needed"
  ]
}
```

CSM receives this recommendation via `agent_recommendations` and must act within 24 hours.

---

## Attribution Integrity

To maintain clean attribution data:

1. **De-duplication**: One attribution record per `(patient_id, touchpoint_type, appointment_id)` combination
2. **Confidence floor**: Records with `attribution_confidence < 0.50` are flagged for manual review
3. **Time window**: Attribution window is 7 days from communication delivery — bookings after 7 days are not attributed
4. **No double counting**: If both ALICE and a journey step touch the same patient, only the higher-confidence attribution is recorded

---

## Related Documents

- `docs/ALICE_LEARNING_LOOP.md` — ALICE-linked revenue queries
- `docs/CLIENT_HEALTH_FRAMEWORK.md` — revenue_attribution_score dimension
- `docs/EBR_TEMPLATE.md` — Section 3: Revenue Impact reporting
- `docs/GO_LIVE_RUNBOOK.md` — Day 14 revenue check commands
