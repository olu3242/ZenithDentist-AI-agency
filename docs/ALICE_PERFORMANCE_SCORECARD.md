# ALICE Performance Scorecard

## Overview

ALICE (Automated Learning and Intelligent Clinical Engine) makes patient-level recommendations every day. Her accuracy directly determines the platform's clinical and commercial value. This scorecard defines what is measured, how it is measured, and what thresholds trigger action.

---

## 7 Tracked Accuracy Metrics

| # | Metric | Definition | Target |
|---|--------|-----------|--------|
| 1 | Overall Prediction Accuracy | (correct decisions) / (total decisions with outcomes) | > 70% |
| 2 | Intent Score Accuracy | Predicted intent score vs actual appointment booking rate | > 75% |
| 3 | Treatment Acceptance Accuracy | Predicted acceptance vs actual acceptance per patient | > 65% |
| 4 | Revenue Forecast Accuracy | Forecasted revenue recovered vs actual recovered | > 60% |
| 5 | Acceptance Rate | Recommendations accepted by clinical team / total generated | > 50% |
| 6 | Average Confidence | Mean confidence score of all decisions in period | > 0.65 |
| 7 | Learning Signals Processed | Count of outcome feedback signals ingested today | Trending up |

---

## alice_performance_snapshots Table Schema

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | Org scope |
| snapshot_date | date | Date of snapshot (unique per org per day) |
| recommendations_generated | integer | Total decisions made today |
| recommendations_accepted | integer | Decisions with feedback_signal = 'accepted' or 'positive' |
| recommendations_rejected | integer | Remaining decisions |
| acceptance_rate | numeric | accepted / generated |
| prediction_accuracy | numeric | positive outcomes / total outcomes with feedback |
| intent_score_accuracy | numeric | From intent calibration model |
| treatment_acceptance_accuracy | numeric | From treatment model calibration |
| revenue_forecast_accuracy | numeric | From revenue model calibration |
| avg_confidence | numeric | Mean confidence across all decisions |
| learning_signals_processed | integer | Feedback signals ingested |
| created_at | timestamptz | Row creation timestamp |

---

## snapshotAlicePerformance() Sources

The `snapshotAlicePerformance(organizationId)` function reads from two tables:

### alice_patient_decisions
Counts `recommendations_generated` for today's date and the given organization. This table stores each decision ALICE emitted for a patient (journey recommendation, next-best-action, risk flag).

### alice_outcome_records
Counts and aggregates `feedback_signal` values for today. Signals include:
- `positive` / `accepted` → recommendation was correct
- `negative` / `rejected` → recommendation was incorrect or overridden
- `neutral` → no clinical action taken (not counted in accuracy)

The function is non-blocking (async IIFE) and will not throw if tables are empty.

---

## Accuracy Calculation

```typescript
const positiveSignals = outcomes.filter(
  (r) => r.feedback_signal === "positive" || r.feedback_signal === "accepted"
).length;
const acceptanceRate = totalOutcomes > 0 ? positiveSignals / totalOutcomes : 0;
const predictionAccuracy = totalOutcomes > 0 ? positiveSignals / totalOutcomes : null;
```

When `totalOutcomes = 0` (no feedback yet), `prediction_accuracy` is stored as `null` rather than 0 to avoid corrupting trend averages.

---

## Calibration Targets

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Overall accuracy | ≥ 70% | 60–69% | < 60% |
| Intent accuracy | ≥ 75% | 65–74% | < 65% |
| Treatment acceptance accuracy | ≥ 65% | 55–64% | < 55% |
| Acceptance rate | ≥ 50% | 40–49% | < 40% |
| Avg confidence | ≥ 0.65 | 0.50–0.64 | < 0.50 |

---

## Learning Loop

ALICE improves through a continuous feedback loop:

```
Patient Touchpoint
       ↓
alice_patient_decisions (recommendation logged)
       ↓
Clinical/Patient Action (appointment booked, treatment accepted, etc.)
       ↓
alice_outcome_records (feedback_signal recorded)
       ↓
snapshotAlicePerformance() ingests signals daily
       ↓
alice_performance_snapshots (accuracy tracked)
       ↓
ALICE model calibration (confidence thresholds adjusted)
```

The `feedback_signal` column in `alice_outcome_records` is the primary learning input. Every confirmed appointment, accepted treatment plan, and submitted review generates a feedback signal that tightens ALICE's calibration.

---

## Weekly Accuracy Trend

Query for weekly trend visualization:

```sql
SELECT
  DATE_TRUNC('week', snapshot_date) AS week_start,
  AVG(prediction_accuracy) AS avg_accuracy,
  AVG(acceptance_rate) AS avg_acceptance_rate,
  SUM(recommendations_generated) AS total_recommendations,
  SUM(learning_signals_processed) AS total_signals
FROM alice_performance_snapshots
WHERE organization_id = $1
  AND snapshot_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY week_start
ORDER BY week_start DESC;
```

A healthy ALICE shows `avg_accuracy` trending upward week-over-week as learning signals accumulate.

---

## Alert: Accuracy Drop Below 60%

If `prediction_accuracy` drops below 0.60 for 3 consecutive days:

1. Flag is set in `practice_memory_records` with type = `alice_accuracy_alert`
2. A `publishRuntimeFabricEvent` is emitted with `eventType = "governance"`, `priority = "critical"`
3. Super admin notification is triggered via Mission Control
4. Success team is alerted to review recent `alice_outcome_records` for systematic misfires

This alert is not auto-triggered by the current `snapshotAlicePerformance()` — it requires the daily reconciliation job to compare 3-day rolling average.

---

## Roadmap

- [ ] Add `intent_score_accuracy` computation from intent model output vs actual booking
- [ ] Add `treatment_acceptance_accuracy` from treatment plan acceptance records
- [ ] Add `revenue_forecast_accuracy` from revenue_attribution_records comparison
- [ ] Add `avg_confidence` aggregation from alice_patient_decisions
- [ ] Connect learning loop to model fine-tuning pipeline

---

*Last updated: 2026-06-03*
