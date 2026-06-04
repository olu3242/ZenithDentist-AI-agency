# ALICE Learning Loop Architecture

> Closing the feedback loop: ALICE decisions → patient outcomes → improved future decisions.

---

## Problem Statement

ALICE (AI-driven Learning and Intelligence for Clinical Engagement) was generating patient decisions (`alice_patient_decisions`) but outcomes were never captured. This meant:

1. ALICE had no signal to distinguish good recommendations from poor ones.
2. Revenue attribution could not be linked to ALICE decisions.
3. Confidence thresholds were static rather than data-driven.

---

## Solution

**Files**:
- `lib/alice/outcome-reconciliation.ts` — core reconciliation logic
- `alice_outcome_records` table — persistent outcome and signal storage

---

## Learning Loop: End-to-End Flow

```
ALICE decision created
    ↓ (alice_patient_decisions: status='pending')
Action taken by staff or Automation Platform
    ↓ (appointment booked, treatment accepted, etc.)
Outcome observed
    ↓
recordAliceOutcome() called from revenue engines
    ↓
alice_outcome_records: stores decision_type, outcome_type,
    days_to_outcome, revenue_attributed, feedback_signal
    ↓
getAliceLearningSignals() aggregates positive_rate per decision_type
    ↓
Next generatePatientDecision() call uses learning signals
    to adjust confidence thresholds dynamically
```

---

## Core Functions

### `recordAliceOutcome(decisionId, outcome)`

Called by revenue attribution engines when an outcome is observed.

**Parameters**:
- `decisionId`: FK → alice_patient_decisions.id
- `outcome`: `{ outcomeType, revenueAttributed, notes }`

**Outcome types**:
| Type | Description | feedback_signal |
|------|-------------|-----------------|
| `appointment_booked` | Patient booked after recommendation | positive |
| `treatment_accepted` | Treatment plan accepted | positive |
| `referral_converted` | Referred patient booked | positive |
| `no_show_recovered` | No-show rebooked | positive |
| `no_action` | Patient did not respond | neutral |
| `declined` | Patient explicitly declined | negative |
| `no_outcome` | Auto-reconciled after 7 days | neutral |

---

### `getAliceLearningSignals(orgId)`

Aggregates outcome data by decision type to produce learning signals.

**Returns**:
```typescript
{
  [decision_type: string]: {
    total_decisions: number,
    positive_outcomes: number,
    positive_rate: number,       // 0.0 – 1.0
    avg_days_to_outcome: number,
    avg_revenue_attributed: number
  }
}
```

These signals are passed into `generatePatientDecision()` to adjust confidence thresholds. Decision types with `positive_rate < 0.4` get higher required confidence before ALICE recommends them again.

---

### `getAliceAccuracyMetrics(orgId)`

Provides executive-level accuracy reporting.

**Returns**:
```typescript
{
  accuracyRate: number,           // positive_outcomes / total_with_outcomes
  avgDaysToOutcome: number,       // mean days from decision to observed outcome
  avgRevenueAttributed: number,   // mean revenue per positive outcome
  totalDecisions: number,
  totalOutcomesRecorded: number
}
```

**API**: `GET /api/alice/outcomes?organizationId={orgId}`

---

### `reconcileAliceDecisions(orgId)`

Runs automatically (or on-demand) to handle stale decisions.

**Logic**:
1. Query `alice_patient_decisions` WHERE `status = 'pending'` AND `created_at < now() - interval '7 days'`
2. For each stale decision: create `alice_outcome_records` with `outcome_type = 'no_outcome'`, `feedback_signal = 'neutral'`
3. Update `alice_patient_decisions.status = 'reconciled'`

This prevents learning signals from being polluted by decisions that were simply never followed up on.

**API**:
```
POST /api/pilot
{ "action": "reconcile_alice", "organizationId": "..." }

POST /api/alice/outcomes
{ "organizationId": "...", "action": "reconcile_stale" }
```

---

## `alice_outcome_records` Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Tenant isolation |
| `decision_id` | uuid | FK → alice_patient_decisions.id |
| `patient_id` | uuid | FK → patients.id |
| `decision_type` | text | recall, no_show, treatment, referral, etc. |
| `outcome_type` | text | appointment_booked, treatment_accepted, no_outcome, etc. |
| `outcome_recorded_at` | timestamptz | When outcome was observed |
| `days_to_outcome` | int | Days from decision.created_at to outcome |
| `revenue_attributed` | numeric | Dollar amount attributed to this decision |
| `feedback_signal` | text | positive \| neutral \| negative |
| `notes` | text | Optional context from staff or automation |
| `created_at` | timestamptz | Record creation timestamp |

---

## ALICE Command Center Integration

The ALICE Command Center dashboard surfaces:

| Panel | Metric | Source |
|-------|--------|--------|
| Accuracy Rate Trend | accuracyRate over time | alice_outcome_records aggregated by week |
| Learning Signals by Decision Type | positive_rate per type | getAliceLearningSignals() |
| Revenue per Decision | avgRevenueAttributed | getAliceAccuracyMetrics() |
| Stale Decision Count | pending > 7 days | alice_patient_decisions |
| Top Decision Type | highest positive_rate | learning signals |

---

## API Reference

### Get Accuracy Metrics

```
GET /api/alice/outcomes?organizationId={orgId}
```

Response:
```json
{
  "accuracyRate": 0.73,
  "avgDaysToOutcome": 4.2,
  "avgRevenueAttributed": 287.50,
  "totalDecisions": 48,
  "totalOutcomesRecorded": 31
}
```

### Record Specific Outcome

```
POST /api/alice/outcomes
{
  "organizationId": "...",
  "decisionId": "...",
  "outcomeType": "appointment_booked",
  "revenueAttributed": 350.00,
  "notes": "Patient booked hygiene after recall sequence"
}
```

### Get Learning Signals

```
GET /api/alice/outcomes?organizationId={orgId}&view=signals
```

---

## Confidence Threshold Adjustment

ALICE uses learning signals to modify its internal confidence thresholds:

| Condition | Adjustment |
|-----------|-----------|
| positive_rate ≥ 0.70 | Lower confidence threshold by 10% (recommend more aggressively) |
| positive_rate 0.40–0.69 | No change (hold current threshold) |
| positive_rate < 0.40 | Raise confidence threshold by 15% (recommend more conservatively) |
| < 5 outcomes recorded | No adjustment (insufficient data) |

This ensures ALICE learns from each practice's specific patient population without requiring manual tuning.

---

## Pilot Milestones

| Day | Milestone | Success Condition |
|-----|-----------|-------------------|
| 12 | First ALICE decisions | alice_patient_decisions.count > 0 |
| 14 | First outcomes recorded | alice_outcome_records.count > 0 |
| 21 | Revenue linked to ALICE | alice_outcome_records.revenue_attributed > 0 |
| 30 | Learning signals active | positive_rate data available for ≥ 2 decision types |

---

## Related Documents

- `docs/PILOT_OPERATIONS_OS.md` — ALICE Learning Loop panel
- `docs/PILOT_REVENUE_VALIDATION.md` — ALICE-linked revenue queries
- `docs/30_DAY_ACTIVATION_PLAN.md` — Day 12 and Day 25 ALICE milestones
