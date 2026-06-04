# Dental Growth OS — Specification

**Version:** 2.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Overview

The Dental Growth OS is the collection of automated growth engines that drive measurable revenue outcomes for dental practices. Each engine targets a specific growth lever, operates autonomously via the Automation Platform, and contributes to the overall Growth Score.

---

## 2. Growth OS Architecture

```
Growth Score (0-100)
  ├── Reputation Engine       → reviews dimension (20%)
  ├── Treatment Intelligence  → treatment_acceptance dimension (20%)
  ├── Recall Engine           → recall dimension (15%)
  ├── Referral Engine         → referrals dimension (15%)
  ├── Membership Engine       → membership dimension (15%)
  ├── New Patient Acquisition → new_patients dimension (10%)
  └── Revenue Attribution     → revenue_growth dimension (5%)
```

All engines:
- Are orchestrated by Automation Platform
- Write results to their dedicated tracking tables
- Emit events to the Event Fabric
- Consume ALICE decisions for personalization
- Contribute signals to the Growth Score

---

## 3. Growth Score Model

| Dimension | Weight | Table | Key Metric |
|-----------|--------|-------|-----------|
| Reviews | 20% | `reputation_events` | Review velocity + average rating |
| Treatment Acceptance | 20% | `treatment_acceptance_predictions` | Acceptance rate |
| Referrals | 15% | `referral_tracking` | Referral conversion rate |
| Membership | 15% | `membership_tracking` | Active member count + renewal rate |
| Recall | 15% | `recall_tracking` | Recall conversion rate |
| New Patients | 10% | `new_patient_leads` | New patient acquisition rate |
| Revenue Growth | 5% | `revenue_attribution_records` | MoM revenue growth |

### Score Computation

```
growth_score = Σ (dimension_score × dimension_weight)

Each dimension_score = normalized 0-100 value:
  - Benchmarked against practice's historical performance
  - Adjusted for practice size and market
  - Updated after each relevant event
  - Floor: 0, Ceiling: 100
```

---

## 4. Reputation Engine

**Library:** `lib/reputation-engine/`  
**Table:** `reputation_events`  
**Growth Score Contribution:** 20%

### Capabilities

| Capability | Description |
|-----------|-------------|
| Review Monitoring | Track new reviews across Google, Yelp, Healthgrades |
| Sentiment Analysis | Classify review sentiment and themes |
| Response Generation | AI-generated review responses via ALICE |
| Review Request Campaigns | Post-appointment review request outreach |
| Reputation Alerts | Alert on negative review events |

### Review Request Workflow

```
appointment.completed event
  → 24-hour wait
  → Check: patient.is_eligible_for_review_request = true
  → ALICE: select optimal channel + message
  → Send personalized review request
  → Track: reputation_events (type = 'review_request_sent')
  → On review posted: reputation_events (type = 'review_received')
  → Update Growth Score reviews dimension
```

---

## 5. Treatment Intelligence Engine

**Library:** `lib/treatment-intelligence/`  
**Table:** `treatment_acceptance_predictions`  
**Growth Score Contribution:** 20%

### Capabilities

| Capability | Description |
|-----------|-------------|
| Acceptance Prediction | ML-scored probability patient accepts presented treatment |
| Barrier Identification | Identify likely objection (cost, fear, timing) |
| ALICE Nudge | Personalized follow-up for non-accepted treatments |
| Script Generation | DDT scripts for treatment re-engagement |
| Conversion Tracking | Attribute accepted treatments to platform actions |

### Schema

```sql
CREATE TABLE treatment_acceptance_predictions (
  id                    UUID PRIMARY KEY,
  organization_id       UUID NOT NULL,
  patient_external_id   TEXT NOT NULL,
  treatment_type        TEXT NOT NULL,
  predicted_acceptance  NUMERIC(3,2),  -- 0.00 to 1.00
  predicted_barrier     TEXT,
  recommendation        TEXT,
  model_used            TEXT,
  predicted_at          TIMESTAMPTZ DEFAULT NOW(),
  actual_outcome        TEXT,  -- 'accepted' | 'declined' | 'pending'
  resolved_at           TIMESTAMPTZ
);
```

---

## 6. Recall Engine

**Library:** `lib/recall-engine/`  
**Table:** `recall_tracking`  
**Growth Score Contribution:** 15%  
**Full Spec:** See `RECALL_ENGINE.md`

### Overview

Automated patient recall for hygiene and follow-up appointments. ALICE prioritizes and personalizes outreach for every lapsed patient.

---

## 7. Referral Engine

**Library:** `lib/new-patient-acquisition/`  
**Table:** `referral_tracking`  
**Growth Score Contribution:** 15%  
**Full Spec:** See `REFERRAL_ENGINE.md`

### Overview

Identifies Champion-tier patients and activates structured referral programs. Tracks referral conversions and attributes revenue.

---

## 8. Membership Engine

**Library:** `lib/membership-engine/`  
**Table:** `membership_tracking`  
**Growth Score Contribution:** 15%  
**Full Spec:** See `MEMBERSHIP_ENGINE.md`

### Overview

Manages in-house dental membership plan enrollment, renewals, and upgrades. Improves patient retention and creates predictable recurring revenue.

---

## 9. New Patient Acquisition Engine

**Library:** `lib/new-patient-acquisition/`  
**Table:** `new_patient_leads`  
**Growth Score Contribution:** 10%

### Capabilities

| Capability | Description |
|-----------|-------------|
| Lead Capture | Web form, referral code, and ad integration |
| Lead Scoring | Probability-to-convert scoring |
| Nurture Sequences | Automated multi-touch nurture journeys |
| Conversion Attribution | Track lead → appointment conversion |
| Champion Lookalike | Identify leads matching Champion patient profiles |

### Lead Schema

```sql
CREATE TABLE new_patient_leads (
  id                UUID PRIMARY KEY,
  organization_id   UUID NOT NULL,
  lead_source       TEXT NOT NULL,
  lead_score        NUMERIC(5,2),
  status            TEXT DEFAULT 'new',
  converted_at      TIMESTAMPTZ,
  attribution_source TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. Channel Optimization Engine

**Library:** `lib/channel-optimization/`  
**Table:** `channel_selections`

Cross-cutting capability used by all engines to select the optimal communication channel per patient per interaction.

### Channel Selection Logic

```
Input: patient_external_id + context_type
  → Load patient_influence_scores.behavioral_signals.preferred_channel
  → Load practice_memory_records.learned_patterns.channel_performance
  → Apply ALICE channel selection decision
  → Output: { channel: 'sms' | 'email' | 'portal' | 'video' | 'phone' }
  → Record to channel_selections
```

---

## 11. Growth Score Update Triggers

| Event | Dimensions Updated |
|-------|-------------------|
| Review posted | reviews |
| Treatment accepted/declined | treatment_acceptance |
| Recall appointment completed | recall |
| Referral converted | referrals |
| Membership enrolled/renewed | membership |
| New patient appointment | new_patients |
| Revenue event attributed | revenue_growth |

Growth Score is recomputed within 5 minutes of any dimension-affecting event.

---

## 12. Growth OS Dashboard

Available in Executive Dashboard → Growth Command Center:

| Panel | Content |
|-------|---------|
| Growth Score | Current score, trend, benchmark |
| Dimension Breakdown | 7-bar chart with scores and weights |
| Top Opportunities | ALICE-identified highest-impact actions |
| Engine Status | Active workflows per engine |
| 90-Day Trajectory | Projected score if current trends continue |
