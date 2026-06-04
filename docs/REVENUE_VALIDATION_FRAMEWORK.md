# Revenue Validation Framework

## Overview

Every dollar of revenue claimed by the ZenithDentist platform must be traceable through a complete causal chain. Estimated revenue without evidence is not acceptable. This framework defines the attribution chain, validation queries, attribution models, and dispute resolution process.

---

## Revenue Attribution Chain

Every attributed revenue event must traverse all 6 links:

```
1. OPPORTUNITY
   ↓ (ALICE identified revenue opportunity for patient)
2. TRIGGER
   ↓ (Journey step or recommendation was triggered)
3. ENGAGEMENT
   ↓ (Patient engaged with touchpoint: video watched, message opened, CTA clicked)
4. APPOINTMENT
   ↓ (Patient confirmed appointment)
5. TREATMENT
   ↓ (Treatment plan accepted and services delivered)
6. REVENUE
   (Revenue recorded and attributed to platform touchpoint)
```

**Rule:** No row may be inserted into `revenue_attribution_records` unless all 6 links are populated or the attribution type explicitly permits partial chain (e.g., `revenue_influenced` allows chains ending at APPOINTMENT).

---

## Source of Truth

`revenue_attribution_records` is the authoritative table for all revenue attribution. Every row must reference:
- `organization_id` — org scope
- `patient_id` — the patient
- `journey_assignment_id` — the journey that triggered the chain (required, see Integrity Checks)
- `attribution_type` — the type of attribution: `recall_converted`, `treatment_accepted`, `membership_enrolled`, `referral_converted`
- `attribution_model` — the model used: `first_touch`, `last_touch`, `multi_touch`, `weighted_influence`
- `amount` — the revenue amount in dollars
- `status` — `confirmed`, `pending`, `disputed`

---

## 6-Step Validation SQL

### Step 1: Opportunity Identified
```sql
SELECT id, patient_id, opportunity_score, opportunity_type, status
FROM revenue_opportunities
WHERE organization_id = $1
  AND journey_assignment_id = $2
  AND status IN ('open', 'won');
```

### Step 2: Trigger Fired
```sql
SELECT id, step_type, triggered_at
FROM journey_scheduled_steps
WHERE organization_id = $1
  AND journey_assignment_id = $2
  AND step_status = 'sent';
```

### Step 3: Engagement Confirmed
```sql
-- Video engagement
SELECT id, watch_duration, cta_clicked
FROM video_deliveries
WHERE organization_id = $1
  AND journey_assignment_id = $2
  AND watch_duration > 0;

-- OR message open
SELECT id, opened_at
FROM communication_logs
WHERE organization_id = $1
  AND journey_assignment_id = $2
  AND opened_at IS NOT NULL;
```

### Step 4: Appointment Confirmed
```sql
SELECT id, appointment_date, status
FROM appointment_records
WHERE organization_id = $1
  AND patient_id = $2
  AND status = 'confirmed'
  AND confirmed_at >= (SELECT triggered_at FROM journey_scheduled_steps WHERE id = $3);
```

### Step 5: Treatment Accepted
```sql
SELECT id, treatment_value, accepted_at
FROM treatment_plans
WHERE organization_id = $1
  AND patient_id = $2
  AND status = 'accepted'
  AND accepted_at >= (SELECT appointment_date FROM appointment_records WHERE id = $3);
```

### Step 6: Revenue Attributed
```sql
SELECT id, amount, attribution_type, attribution_model, status
FROM revenue_attribution_records
WHERE organization_id = $1
  AND patient_id = $2
  AND journey_assignment_id = $3
  AND status = 'confirmed';
```

---

## Attribution Models

| Model | Definition | Use Case |
|-------|-----------|---------|
| `first_touch` | 100% credit to the first platform touchpoint | Recall campaigns |
| `last_touch` | 100% credit to the final touchpoint before treatment | Treatment journeys |
| `multi_touch` | Equal credit across all touchpoints in the chain | Multi-step journeys |
| `weighted_influence` | Credit weighted by engagement depth (watch_duration, CTA click) | Video-heavy journeys |

All revenue-recovered claims use `first_touch` or `multi_touch`. Revenue-influenced claims use `weighted_influence`.

---

## Validation Process: Daily Reconciliation

The daily reconciliation job runs at 02:00 UTC and:
1. Identifies all `revenue_opportunities` with `status = 'open'` and `opportunity_score >= 70` created more than 14 days ago (Revenue At Risk)
2. For each opportunity, checks whether Steps 4–6 have corresponding records
3. If chain is broken: marks `revenue_opportunities.status = 'stalled'`, logs to `practice_memory_records`
4. If chain is complete: creates or confirms `revenue_attribution_records` row
5. Updates `pilot_daily_metrics.revenue_recovered` and `pilot_scorecards.total_revenue_recovered`

---

## Revenue At Risk

Revenue At Risk identifies high-scoring opportunities that have not converted:

```sql
SELECT
  ro.patient_id,
  ro.opportunity_score,
  ro.opportunity_type,
  ro.amount_potential,
  ro.created_at,
  CURRENT_DATE - ro.created_at::date AS days_open
FROM revenue_opportunities ro
WHERE ro.organization_id = $1
  AND ro.opportunity_score >= 70
  AND ro.status = 'open'
  AND ro.created_at < CURRENT_DATE - INTERVAL '14 days'
ORDER BY ro.opportunity_score DESC, days_open DESC;
```

Revenue At Risk surfaced in the weekly executive review and assigned to the success team for manual outreach.

---

## Dispute Resolution

When a practice disputes an attribution:
1. Success team sets `revenue_attribution_records.status = 'disputed'`
2. Manual review of all 6 chain links using validation queries above
3. Override decision recorded in `practice_memory_records` with `memory_type = 'attribution_override'`
4. `revenue_attribution_records.status` updated to `confirmed` or `voided`
5. Audit trail is immutable — no rows are deleted, only status is changed

---

## Integrity Checks

Before any `revenue_attribution_records` insert:
- `journey_assignment_id` must exist in `patient_journey_assignments` — **required, no exceptions**
- `patient_id` must exist in `patient_profiles`
- `amount` must be > 0
- `attribution_type` must be one of the 4 allowed values
- `status` defaults to `pending` until reconciliation confirms the chain

Violations are logged to `practice_memory_records` with `memory_type = 'attribution_integrity_violation'` and blocked from insert.

---

## Revenue Classification

| Class | Attribution Type | Chain Required | Model |
|-------|----------------|---------------|-------|
| Recovered | `recall_converted` | Steps 1–6 complete | `first_touch` |
| Recovered | `membership_enrolled` | Steps 1–4 + enrollment record | `last_touch` |
| Influenced | `treatment_accepted` | Steps 1–5 | `weighted_influence` |
| Influenced | `referral_converted` | Referral record + appointment | `first_touch` |

---

*Last updated: 2026-06-03*
