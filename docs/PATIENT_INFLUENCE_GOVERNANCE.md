# Patient Influence Engine Governance

**Document Type:** Canonical Governance Reference
**Platform:** Zenith Patient OS
**Last Updated:** 2026-06-02
**Status:** ACTIVE — governs all influence scoring

---

## 1. Transparency Principle

> **All influence scores must be explainable. No black-box scoring.**

The Patient Influence Engine assigns a composite score (0-100) to each patient across 7 dimensions. These scores drive AI Revenue Intelligence recommendations, workflow triggers, and communication prioritization. Because scores directly affect patient communications, they must be:

- **Traceable:** Every score must be computable from specific, retrievable input records
- **Explainable:** Practice staff must be able to view the reason code for any score
- **Auditable:** Score inputs and outputs are logged — no score without documented inputs
- **Non-discriminatory:** Demographic data may not be used as scoring inputs

---

## 2. The 7 Influence Dimensions — Canonical Weights

The following dimension weights are **canonical** and **may not be changed without a governance review** involving `organization_owner` or above plus documented justification:

| Dimension | Weight | Description |
|---|---|---|
| `engagement` | **20%** | Patient's overall engagement level with platform communications |
| `treatment_intent` | **25%** | Likelihood patient will accept a treatment plan |
| `review_probability` | **10%** | Likelihood patient will leave a public review if asked |
| `referral_probability` | **10%** | Likelihood patient will refer new patients |
| `recall_recovery` | **15%** | Likelihood an overdue patient will rebook |
| `membership_conversion` | **10%** | Likelihood uninsured patient will purchase membership plan |
| `loyalty` | **10%** | Long-term patient relationship strength |

**Total weight: 100%**

The overall composite score is a GENERATED column:
```
overall = (engagement × 0.20) + (treatment_intent × 0.25) + (review_probability × 0.10)
        + (referral_probability × 0.10) + (recall_recovery × 0.15)
        + (membership_conversion × 0.10) + (loyalty × 0.10)
```

---

## 3. Input Sources by Dimension

Each dimension reads from specific, documented input sources:

### 3.1 engagement (20%)
| Input Signal | Source | Weight |
|---|---|---|
| Email open rate (last 90 days) | communication_logs | High |
| SMS response rate | communication_logs | High |
| Portal login frequency | portal_sessions | Medium |
| Video watch events | patient_video_events | High |
| CTA click events | communication_logs | Medium |

### 3.2 treatment_intent (25%)
| Input Signal | Source | Weight |
|---|---|---|
| Treatment plan presented but not accepted | treatment_records | High |
| Video watch events for treatment-related content | patient_video_events | High |
| Portal engagement with treatment pages | portal_sessions | Medium |
| Appointment history (routine vs. treatment) | appointment_records | Medium |
| ALICE-flagged treatment signals | alice_patient_decisions | Low |

### 3.3 review_probability (10%)
| Input Signal | Source | Weight |
|---|---|---|
| Past NPS score (if collected) | patient_feedback | High |
| Appointment satisfaction signals | appointment_records | Medium |
| Engagement with post-visit communications | communication_logs | Medium |
| Visit frequency (loyal patients more likely to review) | appointment_records | Low |

### 3.4 referral_probability (10%)
| Input Signal | Source | Weight |
|---|---|---|
| NPS score ≥ 8 | patient_feedback | High |
| Referred patients previously (if tracked) | referral_records | High |
| Long-term patient relationship (loyalty score) | Derived | Medium |
| Engagement with practice communications | communication_logs | Low |

### 3.5 recall_recovery (15%)
| Input Signal | Source | Weight |
|---|---|---|
| Days since last appointment | appointment_records | High |
| Response rate to previous recall attempts | communication_logs | High |
| Appointment booking history | appointment_records | Medium |
| No-show history | appointment_records | Medium (negative signal) |

### 3.6 membership_conversion (10%)
| Input Signal | Source | Weight |
|---|---|---|
| Patient has no active insurance on file | patient_profile | High |
| Frequency of cash/out-of-pocket payments | payment_records | High |
| Treatment plan cost sensitivity signals | portal_sessions | Medium |
| Engagement with membership-related content | patient_video_events | Medium |

### 3.7 loyalty (10%)
| Input Signal | Source | Weight |
|---|---|---|
| Years as patient at practice | patient_profile | High |
| Total visits (lifetime) | appointment_records | High |
| Membership status (current member = high loyalty) | membership_records | Medium |
| Family members also at practice | patient_profile | Medium |

---

## 4. Scoring Scale

- **Each dimension:** 0 to 100 (integer)
- **Overall composite:** 0 to 100 (computed from weighted sum)
- **High-influence threshold:** 70 (patients at or above this threshold are prioritized for AI Revenue Intelligence recommendations and automated workflows)
- **Future:** High-influence threshold will be configurable per organization in a future release; 70 is the platform default

### Score Interpretation

| Overall Score | Interpretation | Platform Action |
|---|---|---|
| 85-100 | Highly engaged, strong relationship | Priority for referral ask, review request, premium offers |
| 70-84 | Above average engagement | Eligible for most automated workflows |
| 50-69 | Moderate engagement | Standard recall and communication cadence |
| 30-49 | Low engagement | Simplified re-engagement outreach |
| 0-29 | Disengaged | Conservative approach — minimal automation |

---

## 5. Score Refresh Cadence

`calculateInfluenceScores()` is invoked after significant patient events:

| Triggering Event | Reason |
|---|---|
| `appointment.visit.completed` | Visit data changes recall_recovery and loyalty |
| `patient.video.watched` | Strong engagement signal for treatment_intent and engagement |
| `communication.responded` | Updates engagement dimension |
| `treatment_plan.accepted` | Changes treatment_intent significantly |
| `patient.profile.created` | Initial score calculation |
| `membership.activated` | Impacts membership_conversion and loyalty |
| `referral.submitted` | Updates referral_probability |

**Note:** Score recalculation is debounced — multiple events within a 5-minute window trigger a single recalculation, not one per event.

---

## 6. Reason Codes

Every influence score must be explainable via reason codes. The `calculateInfluenceScores()` function must return, for each dimension:

```typescript
{
  dimension: "treatment_intent",
  score: 78,
  reason_codes: [
    { code: "TREATMENT_VIDEO_WATCHED", weight: "high", value: "2 videos watched in last 30 days" },
    { code: "TREATMENT_PLAN_PENDING", weight: "high", value: "1 accepted plan, 1 pending plan" },
    { code: "PORTAL_TREATMENT_ENGAGEMENT", weight: "medium", value: "3 treatment page visits" }
  ],
  computed_at: "2026-06-02T10:00:00Z"
}
```

Reason codes are:
- Stored in `patient_influence_scores.score_metadata` (jsonb)
- Accessible via Practice Intelligence OS to authorized staff
- Required for any score > 70 that triggers automated action

---

## 7. Anti-Discrimination Policy

Influence scores **may not** use the following as inputs under any circumstances:

| Prohibited Input | Category |
|---|---|
| Patient age or date of birth | Age discrimination |
| Race, ethnicity, or national origin | Racial discrimination |
| Gender, sex, or gender identity | Gender discrimination |
| Insurance type (e.g., Medicaid vs. private) | Socioeconomic discrimination |
| Geographic region (zip code, neighborhood) | Proxy for race/income |
| Language preference | National origin proxy |
| Disability status | Disability discrimination |

**Enforcement:** The `calculateInfluenceScores()` function must not accept any of the above fields as parameters. The function signature is the enforcement boundary.

**Exception:** `membership_conversion` may use "no active insurance on file" as a signal — this is a financial/product signal, not a discriminatory one. This must not be confused with insurance type.

---

## 8. ALICE Use of Influence Scores

ALICE reads influence scores as **context** for generating patient decisions. Governance rules for this interaction:

- ALICE **reads** `patient_influence_scores` — it does not write to or modify them
- ALICE includes the top 3 influence dimensions and their scores in the decision context
- ALICE uses influence scores to determine **which** action type to recommend (e.g., high `review_probability` → recommend review_request)
- ALICE does not re-derive influence scores — it uses the stored, pre-calculated values
- If a patient's influence score is below 30 (overall), ALICE defaults to conservative recommendation only

---

## 9. Tenant Isolation

- `patient_influence_scores.organization_id` is on every row
- RLS policies enforce that a practice can only read scores for their own patients
- Score calculation is always scoped to a single `organization_id`
- Cross-organization influence analysis is prohibited
- `super_admin` may query across organizations for platform health monitoring only

---

## 10. Score History and Audit

**Upsert pattern:** `calculateInfluenceScores()` upserts the current score row — it does not insert new rows per calculation. This keeps the `patient_influence_scores` table lean.

**History via Practice Memory:** Each score calculation event triggers a `memory.record.created` event in the Event Fabric, and the input context (not the full score) is stored in `practice_memory_records`. This provides:
- A time-series view of how scores have changed
- The ability to reconstruct the reasoning for any past score
- Audit evidence for compliance reviews

**Audit access:** Practice staff with `practice_manager` or above role may view:
- Current score with reason codes
- Score history via Practice Memory Graph
- Trigger events that caused score recalculation

---

## 11. Practice Intelligence OS Integration

The Practice Intelligence OS surface for influence scores must display:

- Overall composite score (0-100 gauge)
- Per-dimension breakdown (7 bars showing each dimension score and weight)
- Reason codes for the top 3 dimensions
- Last calculated timestamp
- High-influence badge (if overall ≥ 70)
- Which workflows this patient is eligible for based on current scores

---

## 12. Influence Score Governance Checklist

Before any change to the influence scoring model:

- [ ] Dimension weights still sum to exactly 100%
- [ ] No demographic data added as input (anti-discrimination check)
- [ ] All new input signals have reason codes defined
- [ ] `calculateInfluenceScores()` function signature reviewed for prohibited fields
- [ ] Upsert behavior preserved (not insert)
- [ ] Practice Memory record created on recalculation
- [ ] Event Fabric event emitted: `patient.influence.calculated`
- [ ] Reason codes accessible in Practice Intelligence OS
- [ ] Weight change (if any) documented in governance review log
- [ ] Governance review signed off by `organization_owner` or above if weights changed
