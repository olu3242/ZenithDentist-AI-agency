# Treatment Acceptance Intelligence

## Overview

Treatment Acceptance Intelligence predicts the probability that a specific patient will accept a specific procedure, along with their risk of delay, risk of loss, and likelihood of needing financing. Predictions are stored for audit and analytics and feed ALICE's recommended actions.

## Library File

`lib/treatment-intelligence/index.ts`

## Exports

| Function | Description |
|----------|-------------|
| `predictTreatmentAcceptance(opts)` | Computes all 4 scores for a patient + procedure; inserts to `treatment_acceptance_predictions`; emits `intent.score.updated` |

## 8 Procedure Types and Industry Baselines

| Procedure Type | Base Acceptance Rate | Notes |
|---------------|---------------------|-------|
| `implant` | 42% | High cost, low baseline |
| `invisalign` | 55% | Cosmetic, moderate awareness |
| `crown` | 68% | Common, clinically necessary |
| `veneer` | 60% | Cosmetic, patient-initiated |
| `root_canal` | 72% | Urgent/necessary, high acceptance |
| `high_value` | 50% | Any procedure > $3,000 |
| `standard` | 78% | Routine, low friction |
| `other` | 65% | Fallback |

Source: Industry benchmarks. Actual rates adjusted upward by patient-specific modifiers.

## Score Modifiers

The base rate is adjusted by three influence layer signals:

| Signal | Source Table | Modifier Formula |
|--------|-------------|-----------------|
| `treatment_intent_score` | `patient_influence_scores` | `+intentScore / 100 * 20` (up to +20 points) |
| `engagement_score` | `patient_influence_scores` | `+engagementScore / 200 * 10` (up to +10 points) |
| Profile readiness | `conversion_profiles` (treatment_acceptance) | `+readiness / 200 * 10` (up to +10 points) |

Maximum acceptance probability: 95 (capped to avoid overconfidence).

## Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `acceptanceProbability` | 0–95 | Likelihood patient accepts if presented |
| `delayRisk` | 0–100 | Likelihood patient defers decision (decreases with intent score) |
| `lossRisk` | 0–100 | Likelihood patient declines permanently (decreases with loyalty) |
| `financingProbability` | 0–100 | If `estimatedRevenue > $3,000`, probability patient needs payment plan |
| `estimatedRevenue` | number | Passed through from caller |
| `recommendedAction` | string | See action matrix below |
| `recommendedChannel` | string | From `conversion_profiles.preferred_channel` or default video |
| `confidenceScore` | 0–1 | 0.85 if conversion profile exists, 0.6 otherwise |

## Recommended Action Matrix

| Condition | Recommended Action |
|-----------|------------------|
| `acceptanceProbability > 70` | `schedule_consult` |
| `delayRisk > 60` | `educational_video` |
| Otherwise | `coordinator_followup` |

## Database Table: treatment_acceptance_predictions

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `patient_external_id` | text | |
| `procedure_type` | text | One of 8 types |
| `acceptance_probability` | numeric | |
| `delay_risk` | numeric | |
| `loss_risk` | numeric | |
| `financing_probability` | numeric | |
| `estimated_revenue` | numeric | |
| `recommended_action` | text | |
| `recommended_channel` | text | |
| `confidence_score` | numeric | |
| `created_at` | timestamptz | |

Each call inserts a new row — predictions are append-only for historical analysis.

## Event

| Event | Payload |
|-------|---------|
| `intent.score.updated.<patientExternalId>` | `{ patientExternalId, procedureType, acceptanceProbability }` |

## Integration with Influence Layer

`predictTreatmentAcceptance()` reads from `patient_influence_scores` first. If no influence scores exist for the patient, modifiers default to neutral (50) and confidence is 0.6. For highest accuracy, call `calculateInfluenceScores()` before `predictTreatmentAcceptance()`.

## Integration with ALICE

ALICE reads `treatment_acceptance_predictions` when generating intervention decisions. The `recommendedAction` field seeds ALICE's `what` field, and `recommendedChannel` seeds the `how` field, which ALICE may override based on additional context.

## Financing Threshold

`financingProbability` is elevated only when `estimatedRevenue > 3000`. For lower-value procedures, it defaults to 15 regardless of engagement. This threshold is hardcoded in `lib/treatment-intelligence/index.ts` and should be made configurable per org in a future sprint.
