# Practice Knowledge Graph Schema

## Overview

The Practice Knowledge Graph is the connected structure of `practice_memory_records`. It is not a graph database — it is a relational representation of a knowledge graph, where nodes are entities (patients, providers, campaigns, etc.) and edges are memory records that connect them through meaningful events.

The graph enables ALICE™ and the Practice Intelligence OS™ to traverse patient and provider history, compute effectiveness scores per entity, and identify high-value opportunities without requiring real-time PMS queries.

---

## Node Types

| Node Type | Entity | Identified By |
|-----------|--------|---------------|
| Patient | Individual patient | `entity_type = 'patient'`, `entity_external_id` = patient PMS reference |
| Provider | Dentist / hygienist | `entity_type = 'provider'`, `entity_external_id` = provider PMS reference |
| Practice | The dental practice | `entity_type = 'practice'`, `entity_external_id` = org identifier |
| Appointment | A scheduled visit | `entity_type = 'appointment'`, `entity_external_id` = appointment PMS ID |
| Treatment | A specific procedure | `entity_type = 'treatment'`, `entity_external_id` = treatment plan ID |
| Campaign | A communication campaign | `entity_type = 'campaign'`, `entity_external_id` = campaign identifier |
| Channel | A communication channel | `entity_type = 'channel'`, `entity_external_id` = `sms` / `email` / `video` / `phone` |
| Location | A practice location | `entity_type = 'location'`, `entity_external_id` = location identifier |

---

## Edge Types (Relationships)

Edges are implicit in `practice_memory_records` via `record_type` and the `data` jsonb field.

| Edge | From → To | Record Type | Key Data Fields |
|------|-----------|-------------|-----------------|
| received treatment | Patient → Treatment | `treatment_outcome` | `accepted`, `procedureType`, `revenue` |
| treated by | Treatment → Provider | `treatment_outcome` | `providerExternalId` |
| received communication | Provider → Communication | `communication_sent` | `channel`, `message_type`, `outcome` |
| communication resulted in | Communication → Outcome | `appointment_booked` | `appointmentDate`, `procedureType` |
| outcome generated | Outcome → Revenue | `treatment_outcome` | `revenue_influenced` |
| referred patient | Patient → Patient | `referral_made` | `referred_patient_external_id` |
| enrolled in | Patient → Membership | `membership_enrolled` | `plan_type`, `monthly_value` |
| submitted review | Patient → Practice | `review_generated` | `platform`, `sentiment`, `rating` |

---

## practice_memory_records Schema

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | Tenant isolation — all queries must include this |
| `entity_type` | text | See Node Types above |
| `entity_external_id` | text | Opaque external reference (no PHI stored) |
| `record_type` | text | See Record Types below |
| `record_date` | date | The date the event occurred |
| `data` | jsonb | Event-specific payload |
| `revenue_influenced` | numeric | Revenue attributed to this record (if applicable) |
| `effectiveness_score` | numeric 0–1 | Computed score for this record |
| `period_date` | date | Period start for recurring/aggregate records |
| `metadata` | jsonb | Extensible metadata (source system, job ID, etc.) |
| `created_at` | timestamptz | |

Index strategy: `(organization_id, entity_type, entity_external_id, record_date DESC)` — primary query pattern for ALICE context retrieval.

---

## Record Types (10 Canonical Types)

### 1. treatment_outcome
Captures whether a patient accepted or declined a proposed treatment.

```json
{
  "accepted": true,
  "procedureType": "implant",
  "proposedRevenue": 4500,
  "providerExternalId": "DR-001",
  "financingOffered": true,
  "financingAccepted": true,
  "declineReason": null
}
```

`revenue_influenced`: set to actual treatment revenue when accepted, 0 when declined
`effectiveness_score`: 1.0 if accepted, 0.0 if declined

### 2. communication_sent
Captures a communication delivered to a patient.

```json
{
  "channel": "sms",
  "messageType": "recall_reminder",
  "campaignId": "CAMP-001",
  "opened": true,
  "clicked": true,
  "responded": false,
  "scriptTemplateId": "TMPL-implant-edu-001"
}
```

`effectiveness_score`: computed from `opened * 0.3 + clicked * 0.4 + responded * 0.3`

### 3. review_generated
Captures a patient-submitted review.

```json
{
  "platform": "google",
  "rating": 5,
  "sentiment": "positive",
  "reviewText": null,
  "requestedVia": "sms",
  "daysAfterVisit": 3
}
```

`effectiveness_score`: `rating / 5`

### 4. referral_made
Captures a patient referring another patient.

```json
{
  "referredPatientExternalId": "P-456",
  "referralSource": "patient-initiated",
  "campaignId": null,
  "converted": true,
  "conversionRevenue": 1200
}
```

`revenue_influenced`: set when the referred patient converts

### 5. appointment_booked
Captures an appointment booking event and patterns.

```json
{
  "appointmentType": "hygiene",
  "dayOfWeek": "friday",
  "timeOfDay": "evening",
  "bookingChannel": "sms",
  "daysFromOutreach": 2,
  "providerExternalId": "DR-002"
}
```

`effectiveness_score`: computed from `1 - (daysFromOutreach / 30)`, capped at 1.0

### 6. membership_enrolled
Captures membership plan enrollment.

```json
{
  "planType": "standard",
  "monthlyValue": 49,
  "annualValue": 499,
  "enrollmentChannel": "in-office",
  "offeredBy": "DR-001"
}
```

`revenue_influenced`: `annualValue` for ARR calculation

### 7. recall_recovered
Captures successful recall reactivation of an overdue patient.

```json
{
  "monthsOverdue": 8,
  "outreachCount": 2,
  "recallChannel": "sms",
  "campaignId": "RECALL-Q1-2025",
  "appointmentBooked": true,
  "revenue": 280
}
```

`revenue_influenced`: production from the recovered appointment
`effectiveness_score`: `1 / outreachCount` (fewer touches = more effective)

### 8. no_show_prevented
Captures a no-show prevention success.

```json
{
  "appointmentDate": "2025-01-15",
  "outreachChannel": "sms",
  "confirmedVia": "sms_reply",
  "hoursBeforeAppointment": 24,
  "chairValue": 350
}
```

`revenue_influenced`: `chairValue`

### 9. video_watched
Captures a patient watching a Digital Dentist Twin video.

```json
{
  "videoId": "VID-001",
  "avatarProfileId": "AVP-001",
  "watchDuration": 87,
  "totalDuration": 120,
  "completionRate": 0.725,
  "ctaClicked": true,
  "procedureType": "implant"
}
```

`effectiveness_score`: `completionRate * (ctaClicked ? 1.2 : 1.0)`, capped at 1.0

### 10. alice_recommendation
Captures an ALICE recommendation for write-back and learning.

```json
{
  "decisionType": "intervention",
  "confidenceScore": 0.87,
  "recommendedChannel": "sms",
  "recommendedAction": "Send implant education video",
  "procedureType": "implant",
  "fallbackUsed": false,
  "acted": false,
  "actedAt": null
}
```

`effectiveness_score`: updated to 1.0 when `acted = true`, remains 0.0 until then

---

## Graph Traversal Pattern

ALICE uses the following traversal to build patient context:

```
Start at Patient node (entity_type='patient', entity_external_id='P-123')
  │
  ├── Get all memory records (last 24 months, top 10 recent)
  ├── Group by record_type
  ├── Compute effectiveness per record_type
  └── Summarize:
        - treatment_outcome: accepted/proposed ratio + avg revenue
        - communication_sent: by channel → channel effectiveness score
        - video_watched: engagement rate + CTA click rate
        - appointment_booked: preferred day/time pattern
        - referral_made: referral count + conversion rate
        - alice_recommendation: previous decision types + act rate
```

---

## ALICE Query Pattern

### getEntityEffectiveness(orgId, entityType, entityExternalId)

Returns all historical records for an entity, ordered by `record_date DESC`, limited to 24 months.

Used by ALICE to build patient context before generating a decision.

### getPracticeMemorySummary(orgId)

Returns aggregate counts and top performers for the practice:

```json
{
  "totalRecords": 14820,
  "recordsByType": {
    "treatment_outcome": 3200,
    "communication_sent": 8100,
    "appointment_booked": 1920,
    "recall_recovered": 280,
    "referral_made": 142,
    "review_generated": 178
  },
  "topPatientsByRevenue": [...],
  "topProvidersByAcceptanceRate": [...],
  "topCampaignsByEffectiveness": [...]
}
```

---

## Example: Patient Knowledge Graph Query Result

> "Patient P-123 has: watched 3 implant videos (avg engagement: 0.80), responded to 2 SMS campaigns (channel score: 0.90), ignored 5 email campaigns (channel score: 0.20), consistently books Friday evenings (appointment pattern), accepted financing for a crown in March (conversion history), made 2 referrals in the past 12 months (referral record)."

This is the context ALICE uses to decide: SMS, implant video, Friday evening, financing offer.

---

## Retention Policy

| Record Type | Recommended Retention |
|-------------|----------------------|
| All record types | 24 months rolling |
| `alice_recommendation` | 24 months (feedback loop) |
| `treatment_outcome` | 36 months (long treatment cycles) |
| `membership_enrolled` | Duration of membership + 24 months |

Retention is enforced by a scheduled cleanup job that deletes records older than the retention window, preserving `treatment_outcome` and `membership_enrolled` records on extended schedules.

---

## Tenant Isolation

Every graph query is scoped to `organization_id`. The knowledge graph of one practice is completely isolated from all others. No cross-tenant traversal is possible.
