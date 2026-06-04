# Dental Growth OS

## Overview

Dental Growth OS is the growth automation layer of the Zenith Patient OS platform. It automates growth across five pillars: Acquisition, Reputation, Referrals, Recall, and Membership. Each pillar has a dedicated engine that tracks leads, patients, and outcomes — feeding the Growth Score and surfacing in the Growth Command Center in Executive Dashboard.

---

## Architecture Overview

```
Dental Growth OS
├── Acquisition Engine     → tracks new_patient_leads (7 sources)
├── Reputation Engine      → tracks reputation_events (reviews, ratings)
├── Referral Engine        → tracks referral_tracking (2-layer architecture)
├── Recall Engine          → tracks recall_tracking (reactivation pipeline)
└── Membership Engine      → tracks membership_tracking (enrollment + retention)
                                      │
                                      ▼
                               Growth Score (0-100)
                                      │
                                      ▼
                          Growth Command Center (Executive Dashboard)
```

---

## Pillar 1 — Acquisition Engine

### Purpose
Track new patient leads from all sources through the full lifecycle from first contact to converted patient.

### Lead Sources (7)

| Source | Description |
|--------|-------------|
| `website` | Organic form submission from practice website |
| `google_business` | Contact via Google Business Profile |
| `ads` | Paid advertising (Google Ads, Meta) |
| `referral` | Referred by existing patient |
| `landing_page` | Practice-specific Zenith landing page |
| `roi_calculator` | Patient ROI calculator tool lead |
| `phone` | Inbound phone inquiry |

### Lead Lifecycle

```
new → contacted → scheduled → converted
                            → lost
```

| Status | Meaning |
|--------|---------|
| `new` | Lead received, not yet contacted |
| `contacted` | Outreach sent (automated or manual) |
| `scheduled` | Appointment booked |
| `converted` | Patient completed first visit |
| `lost` | Lead went cold or explicitly declined |

### new_patient_leads Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `lead_source` | text | One of 7 sources |
| `patient_external_id` | text | Set on conversion |
| `status` | text | Lifecycle status |
| `contacted_at` | timestamptz | |
| `scheduled_at` | timestamptz | |
| `converted_at` | timestamptz | |
| `lost_at` | timestamptz | |
| `lost_reason` | text | |
| `created_at` | timestamptz | |

### Contribution to Growth Score
`new_patient_score = (converted_count / total_leads) * 100`  
Weight: 10% of overall Growth Score

---

## Pillar 2 — Reputation Engine

### Purpose
Automate review generation, track review receipt across platforms, and manage reputation analytics.

### reputation_events Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `event_type` | text | One of 4 types |
| `platform` | text | `google` / `yelp` / `healthgrades` / `zocdoc` |
| `patient_external_id` | text | |
| `rating` | integer | 1–5 (on `review_received`) |
| `sentiment` | text | `positive` / `neutral` / `negative` |
| `response_sent` | boolean | |
| `response_text` | text | |
| `created_at` | timestamptz | |

### Event Types (4)

| Event Type | Trigger |
|------------|---------|
| `review_requested` | Automation Platform sends review request after positive visit |
| `review_received` | Review posted on platform (manual or webhook) |
| `review_responded` | Staff or ALICE-generated response sent |
| `review_recovered` | Negative review converted to neutral/positive via response |

### Platform Support

| Platform | Priority | Notes |
|----------|----------|-------|
| Google Business Profile | Primary | Highest SEO impact |
| Yelp | Secondary | Important in select markets |
| Healthgrades | Secondary | Healthcare-specific |
| ZocDoc | Tertiary | Appointment booking platform |

### Contribution to Growth Score
`review_score = (avg_rating / 5) * 100`  
Weight: 20% of overall Growth Score

---

## Pillar 3 — Referral Engine

See `REFERRAL_ENGINE.md` for full specification.

### Summary
- Two-layer architecture: `lib/revenue-engine/referral-engine.ts` (revenue tracking) + `referral_tracking` table (campaign-level tracking)
- Tracks referring patient → referred patient → conversion → revenue attribution
- ALICE identifies high-referral-probability patients (referral_probability dimension in `patient_influence_scores`)

### Contribution to Growth Score
`referral_score = (converted_referrals / total_referrals) * 100`  
Weight: 15% of overall Growth Score

---

## Pillar 4 — Recall Engine

See `RECALL_ENGINE.md` for full specification.

### Summary
- Identifies patients overdue for hygiene recall (6-month interval)
- Status lifecycle: `overdue → contacted → scheduled → recovered / lost`
- `months_overdue` is a GENERATED column computed from `last_visit_date`
- Channel selection via `lib/channel-optimization/index.ts`
- Max 3 outreach attempts per patient (enforced via `outreach_count`)

### Contribution to Growth Score
`recall_score = (recovered_count / total_overdue) * 100`  
Weight: 15% of overall Growth Score

---

## Pillar 5 — Membership Engine

See `MEMBERSHIP_ENGINE.md` for full specification.

### Summary
- Tracks in-house dental membership plan enrollment, retention, and churn
- ALICE flags patients with `membership_conversion > 60` for enrollment outreach
- MRR and ARR tracked per active member
- Renewal tracking via `renewal_count` and `expires_at`

### Contribution to Growth Score
`membership_score = (active_count / total_ever_enrolled) * 100`  
Weight: 15% of overall Growth Score

---

## API Routes

| Route | Method | Engine | Description |
|-------|--------|--------|-------------|
| `/api/reputation` | GET / POST | Reputation | Get summary / record event |
| `/api/membership` | GET / POST | Membership | Get summary / record enrollment |
| `/api/recall` | GET / POST | Recall | Get summary / update patient status |
| `/api/practice-intelligence` | GET / POST | Intelligence | Get snapshot / trigger computation |
| `/api/growth-score` | GET / POST | Growth Score | Get current score / trigger recalculation |

---

## Integration with Automation Platform

Each engine action triggers a Automation Platform event via Event Fabric. This enables automated follow-up sequences:

| Engine Action | Event Emitted | Workflow Triggered |
|---------------|---------------|-------------------|
| Lead created | `lead.created` | New patient welcome sequence |
| Review requested | `reputation.review_requested` | Follow-up if no response in 3 days |
| Patient recalled | `recall.patient.recovered` | Post-visit check-in journey |
| Membership enrolled | `membership.enrolled` | Onboarding and renewal reminder setup |
| Referral converted | `referral.converted` | Thank-you message to referring patient |

---

## Integration with ALICE

High-opportunity patients are flagged for ALICE decision generation based on engine signals:

| Signal | ALICE Decision Type |
|--------|---------------------|
| Patient overdue for recall ≥ 6 months | `recall_outreach` |
| Patient influence score ≥ 70, no recent review request | `review_request` |
| Patient `membership_conversion` score ≥ 60, not enrolled | `membership_offer` |
| Patient `referral_probability` ≥ 70, no recent referral ask | `referral_ask` |
| New lead created, not contacted in 24h | `general_engagement` |

ALICE generates a personalized decision for each flagged patient, selecting the optimal channel, script, and timing based on Practice Memory Graph context.

---

## Growth Score Dashboard

The Dental Growth OS feeds the Growth Command Center in Executive Dashboard with real-time metrics across all five pillars. See `GROWTH_COMMAND_CENTER.md` for panel specifications and refresh cadences.

---

## Related Documents

- `GROWTH_SCORE_FRAMEWORK.md` — Dimension weights, grading scale, topOpportunity logic
- `REPUTATION_ENGINE.md` — Full reputation engine specification
- `REFERRAL_ENGINE.md` — Full referral engine specification
- `MEMBERSHIP_ENGINE.md` — Full membership engine specification
- `RECALL_ENGINE.md` — Full recall engine specification
- `GROWTH_COMMAND_CENTER.md` — Executive Dashboard panel specifications
