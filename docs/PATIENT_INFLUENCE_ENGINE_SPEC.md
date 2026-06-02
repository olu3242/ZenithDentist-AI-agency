# Patient Influence Engine — Specification

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

The Patient Influence Engine computes a behavioral influence profile for every patient in a practice. This profile tells ALICE and the Growth Engines how engaged, responsive, and influential each patient is — enabling hyper-personalized outreach that maximizes conversion while minimizing message fatigue.

---

## 2. Influence Score Overview

| Property | Definition |
|----------|-----------|
| **Score Range** | 0-100 |
| **Dimensions** | 5 behavioral signals |
| **Tiers** | Champion, Engaged, Passive, At-Risk |
| **Update Frequency** | After each patient interaction + nightly batch |
| **Storage** | `patient_influence_scores` |
| **Consumer** | ALICE, all Growth Engines |

---

## 3. Influence Tiers

| Tier | Score Range | Characteristics |
|------|-------------|----------------|
| **Champion** | 80-100 | Highly responsive, refers others, attends regularly, accepts treatment |
| **Engaged** | 60-79 | Responds to outreach, attends with reminders, occasional referrals |
| **Passive** | 35-59 | Low response rate, appointment no-shows, needs multiple touches |
| **At-Risk** | 0-34 | Non-responsive, lapsing, high churn probability |

---

## 4. Influence Score Dimensions

| Dimension | Weight | Signal Source |
|-----------|--------|--------------|
| Appointment Adherence | 30% | PMS appointment history |
| Outreach Responsiveness | 25% | Message open/click/response rate |
| Treatment Acceptance | 20% | `treatment_acceptance_predictions` + PMS |
| Referral Activity | 15% | `referral_tracking` |
| Membership Loyalty | 10% | `membership_tracking` |

### Dimension Scoring

Each dimension is normalized to 0-100 before weighting.

**Appointment Adherence:**
```
score = (completed_appointments / scheduled_appointments) × 100
decay: 50% weight on last 12 months, 50% on all-time
```

**Outreach Responsiveness:**
```
score = (opens × 0.3 + clicks × 0.4 + replies × 0.3) / total_sent × 100
window: last 90 days
```

**Treatment Acceptance:**
```
score = (accepted_treatments / presented_treatments) × 100
window: last 24 months
```

---

## 5. Database Schema

```sql
CREATE TABLE patient_influence_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  patient_external_id   TEXT NOT NULL,
  composite_score       NUMERIC(5,2) NOT NULL,
  influence_tier        TEXT NOT NULL,  -- 'champion' | 'engaged' | 'passive' | 'at_risk'
  dimension_scores      JSONB NOT NULL,
  behavioral_signals    JSONB DEFAULT '{}',
  score_version         INTEGER DEFAULT 1,
  computed_at           TIMESTAMPTZ DEFAULT NOW(),
  expires_at            TIMESTAMPTZ,
  UNIQUE(organization_id, patient_external_id)
);
```

### Dimension Scores Schema

```json
{
  "appointment_adherence": 82,
  "outreach_responsiveness": 71,
  "treatment_acceptance": 65,
  "referral_activity": 40,
  "membership_loyalty": 100
}
```

### Behavioral Signals Schema

```json
{
  "last_appointment_date": "2025-08-15",
  "months_since_last_visit": 9,
  "total_referrals_generated": 3,
  "preferred_channel": "sms",
  "preferred_contact_time": "morning",
  "active_membership": true,
  "pending_treatments_count": 2,
  "average_response_time_hours": 4.2
}
```

---

## 6. Scoring Pipeline

```
Patient Signal Received (appointment, message event, referral, etc.)
  → Signal processor (lib/patient-influence/)
  → Load current score from patient_influence_scores
  → Recompute affected dimension
  → Recompute composite score
  → Determine new tier
  → Update behavioral_signals
  → Write updated score to patient_influence_scores
  → Emit patient.influence.score.updated event
  → Notify ALICE if tier changed
```

### Nightly Batch Refresh

Every night at 2 AM (practice timezone):
1. Load all patients with scores older than 24 hours.
2. Fetch updated signals from all sources.
3. Recompute all dimension scores.
4. Update composite scores and tiers.
5. Emit batch completion event.

---

## 7. Score Decay

Patient influence scores decay over time without new signals:

| Inactivity Period | Decay Rate |
|-------------------|-----------|
| 0-30 days | No decay |
| 31-90 days | -1 point/week |
| 91-180 days | -2 points/week |
| 180+ days | -5 points/week, floor at 15 |

Decay is applied during nightly batch refresh.

---

## 8. ALICE Integration

ALICE reads `patient_influence_scores` as a primary input for all patient-level decisions:

| ALICE Decision Type | Influence Input Used |
|-------------------|---------------------|
| `recall_priority` | tier + appointment_adherence |
| `message_personalization` | tier + preferred_channel + preferred_contact_time |
| `channel_selection` | preferred_channel + outreach_responsiveness |
| `treatment_nudge` | treatment_acceptance score |
| `referral_activation` | referral_activity + Champion tier |
| `membership_recommendation` | membership_loyalty + composite score |

---

## 9. Engine Integration

All Growth Engines consume influence scores for targeting and personalization:

| Engine | Usage |
|--------|-------|
| Recall Engine | Priority queue ordering, script tone selection |
| Membership Engine | Upgrade offer eligibility |
| Referral Engine | Champion identification for referral activation |
| New Patient Acquisition | Lookalike modeling from Champion profiles |
| Digital Dentist Twin | Script tone and length calibration |

---

## 10. Privacy Controls

- Influence scores are computed from anonymized behavioral signals only.
- No PHI enters the influence scoring model.
- Patients may request their influence profile be reset (zero all dimensions).
- Score reset logged as a data rights event.

---

## 11. Performance Requirements

| Metric | Target |
|--------|--------|
| Score update latency (event-triggered) | < 5 seconds |
| Nightly batch completion | < 2 hours for 10,000 patients |
| Score read latency (ALICE query) | < 100ms (index on org_id + ext_id) |
| Score freshness (max age) | 24 hours |
