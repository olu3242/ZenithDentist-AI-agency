# Patient Influence Engine — Product Requirements Document

## Overview

The Patient Influence Engine calculates a multi-dimensional influence score for each patient, quantifying their likelihood to accept treatment, generate reviews, refer others, and remain loyal. Scores are used by ALICE and the Channel Optimizer to prioritize outreach and personalize intervention timing.

## Library File

`lib/patient-influence/index.ts`

### Exports

| Function | Description |
|----------|-------------|
| `calculateInfluenceScores(orgId, patientExternalId)` | Computes all 7 dimensions + overall score; upserts to `patient_influence_scores` |
| `getInfluenceScores(orgId, patientExternalId)` | Retrieves stored scores |
| `getHighInfluencePatients(orgId, minScore?)` | Returns patients with `overall_influence_score >= minScore` (default 70), ordered descending |

## 7 Influence Dimensions

| Dimension | Column | Weight | Description |
|-----------|--------|--------|-------------|
| Engagement | `engagement_score` | 20% | Current interaction frequency; sourced from `patient_scores.engagement_score` |
| Treatment Intent | `treatment_intent_score` | 25% | Propensity to accept presented treatment; from `conversion_profiles` treatment_acceptance readiness |
| Review Probability | `review_probability_score` | 10% | Likelihood to submit a public review; from `conversion_profiles` review readiness |
| Referral Probability | `referral_probability_score` | 10% | Likelihood to refer new patients; from `conversion_profiles` referral readiness |
| Recall Recovery | `recall_recovery_score` | 15% | Likelihood to book overdue hygiene; inverted from `behavioral_signals.retention_risk` |
| Membership Conversion | `membership_conversion_score` | 10% | Likelihood to join membership plan; from `behavioral_signals.membership_eligibility` |
| Loyalty | `loyalty_score` | 10% | Long-term retention signal; from `patient_scores.retention_score` |

**Overall Score Formula:**
```
overall = engagement * 0.20
        + treatment_intent * 0.25
        + review_probability * 0.10
        + referral_probability * 0.10
        + recall_recovery * 0.15
        + membership_conversion * 0.10
        + loyalty * 0.10
```

The `overall_influence_score` column is a GENERATED column in PostgreSQL using the formula above — values are always consistent with component scores.

## Scoring Inputs

All inputs are read from existing tables — no new data collection required.

| Source Table | Columns Used | Lookback |
|-------------|-------------|---------|
| `behavioral_signals` | `attention_score`, `relationship_score`, `retention_risk`, `membership_eligibility`, `signal_strength` | Last 10 records |
| `conversion_profiles` | `profile_type`, `readiness_score`, `confidence_score` | All active profiles |
| `patient_scores` | `engagement_score`, `attention_score`, `retention_score` | Latest record |

If no data exists for a patient, scores default to 50 (neutral), which reflects uncertainty rather than high or low influence.

## Output Table: patient_influence_scores

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `patient_external_id` | text | PMS reference |
| `engagement_score` | numeric | 0–100 |
| `treatment_intent_score` | numeric | 0–100 |
| `review_probability_score` | numeric | 0–100 |
| `referral_probability_score` | numeric | 0–100 |
| `recall_recovery_score` | numeric | 0–100 |
| `membership_conversion_score` | numeric | 0–100 |
| `loyalty_score` | numeric | 0–100 |
| `overall_influence_score` | numeric GENERATED | Weighted formula |
| `factors_used` | jsonb | `{ signals: N, profiles: N }` |
| `computed_at` | timestamptz | |

Upsert conflict key: `(organization_id, patient_external_id)` — scores are overwritten on recalculation.

## Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `influence.score.calculated.<patientExternalId>` | `calculateInfluenceScores()` completes | `{ patientExternalId, overallScore }` |

## API

| Route | Method | Action |
|-------|--------|--------|
| `/api/patient-influence` | POST | Compute and store scores for a patient |
| `/api/patient-influence` | GET | Retrieve stored scores; optionally filter by `min_score` |

POST body: `{ organizationId, patientExternalId }`
GET params: `?organizationId=&patientExternalId=` or `?organizationId=&minScore=70`

## High-Influence Patient Prioritization

`getHighInfluencePatients(orgId, 70)` returns up to 50 patients with scores above the threshold, ordered highest-to-lowest. Use cases:

- ALICE intervention queue: target high-influence patients for proactive outreach
- Campaign targeting: seed treatment acceptance or referral campaigns with high-influence cohort
- Channel investment: allocate video delivery resources to patients most likely to convert

## Accuracy Note

Scores are as accurate as the behavioral data in `behavioral_signals`, `conversion_profiles`, and `patient_scores`. For new patients with no history, all scores default to 50. Scores converge to meaningful values after 3–5 patient interactions are recorded.
