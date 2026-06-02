# ALICE Patient Decision Engine

## Overview

The ALICE Patient Decision Engine generates specific, actionable recommendations for individual patients. Each decision answers: who the patient is, what action to take, when to take it, why it was chosen, how to deliver it, and what outcome is expected. It uses AI (Claude) with a rule-based fallback.

## Library File

`lib/alice/patient-decision-engine.ts`

### Exports

| Function | Description |
|----------|-------------|
| `generatePatientDecision(opts)` | Generates a decision for a patient; inserts to `alice_patient_decisions`; emits `alice.recommendation.created` |
| `getPendingPatientDecisions(orgId)` | Returns decisions with `status = 'pending'` ordered by `confidence_score DESC` |

## Decision Types

| Type | When Used |
|------|-----------|
| `intervention` | Proactive outreach — patient needs immediate action |
| `journey_update` | Adjust the patient's current journey (change step, change channel) |
| `channel_change` | Switch delivery channel for the patient |
| `escalation` | Flag for human coordinator review |
| `hold` | No action — monitor and re-evaluate |
| `no_action` | Patient is on track; no intervention needed |

## AI Path

When the Anthropic provider is available, `generatePatientDecision()` calls:
- **Model:** `claude-haiku-4-5-20251001`
- **Provider:** `AnthropicProvider` (from `lib/ai/provider.ts`)

The prompt includes:
1. Patient influence scores (all 7 dimensions)
2. Treatment acceptance prediction (if procedure type provided)
3. Active journey assignment status
4. Practice memory context (top-performing channels and scripts for this org)

Expected JSON response structure:
```json
{
  "decisionType": "intervention",
  "who": "Patient OD-12345 — high treatment intent, low engagement",
  "what": "Send treatment education video for implant",
  "when": "within_24h",
  "why": "Treatment intent 78/100, last contact 14 days ago",
  "how": "video channel via Digital Dentist Twin",
  "confidenceScore": 0.87,
  "expectedRevenue": 4500,
  "expectedConversionRate": 0.68,
  "expectedFollowup": "Schedule consult call in 3 days if no response"
}
```

## Rule-Based Fallback

When the AI call fails or Anthropic is unavailable, the fallback applies score thresholds:

| Condition | Decision Type |
|-----------|--------------|
| `overallInfluenceScore > 70` | `intervention` |
| `overallInfluenceScore > 50` | `journey_update` |
| Otherwise | `hold` |

The fallback still inserts to `alice_patient_decisions` with `confidence_score = 0.5` and notes the fallback in the `why` field.

## Output Fields

| Field | Type | Notes |
|-------|------|-------|
| `who` | text | Patient context summary |
| `what` | text | Specific recommended action |
| `when` | text | Timing: within_24h / within_48h / within_7d |
| `why` | text | Evidence-based rationale |
| `how` | text | Channel and delivery method |
| `confidence_score` | numeric 0–1 | AI: model confidence; Fallback: 0.5 |
| `expected_revenue` | numeric | Projected revenue if action succeeds |
| `expected_conversion_rate` | numeric 0–1 | Probability action leads to conversion |
| `expected_followup` | text | Recommended next step if no response |

## Database Table: alice_patient_decisions

Extends the existing `alice_decisions` system with patient-specific decision records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `patient_external_id` | text | PMS reference |
| `decision_type` | text | One of 6 types |
| `who` | text | |
| `what` | text | |
| `when_to_act` | text | |
| `why` | text | |
| `how` | text | |
| `confidence_score` | numeric | |
| `expected_revenue` | numeric | |
| `expected_conversion_rate` | numeric | |
| `expected_followup` | text | |
| `status` | text | `pending` / `acted` / `dismissed` |
| `acted_at` | timestamptz | Set when staff acts on decision |
| `created_at` | timestamptz | |

## Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `alice.recommendation.created.<patientExternalId>` | `generatePatientDecision()` completes | `{ patientExternalId, decisionType, confidenceScore }` |

## API

| Route | Method | Action |
|-------|--------|--------|
| `/api/alice/patient-decisions` | POST | Generate a new decision for a patient |
| `/api/alice/patient-decisions` | GET | Retrieve pending decisions for org |

POST body:
```json
{
  "organizationId": "uuid",
  "patientExternalId": "OD-12345",
  "procedureType": "implant",
  "context": "Patient declined treatment 60 days ago"
}
```

GET params: `?organizationId=<uuid>&status=pending`

## Relationship to alice_decisions

`alice_decisions` is the existing ALICE system that handles practice-level operational recommendations (no-show recovery, workflow triggers, etc.). `alice_patient_decisions` is a parallel table focused on individual patient interventions. Both are queryable from the ALICE dashboard; `alice_patient_decisions` surfaces in the patient-level intervention queue.

## Decision Lifecycle

```
generated → pending → acted (staff executes) → outcome tracked in journey_outcomes
                 ↓
              dismissed (staff marks not applicable)
```

Acted decisions should trigger a practice memory record (`recordMemory`) to feed effectiveness tracking.
