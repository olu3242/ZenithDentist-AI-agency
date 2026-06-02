# ALICE Memory Architecture

## Overview

ALICE™ (AI Chief Intelligence Officer) maintains a multi-layer memory architecture that enables patient-specific decision-making informed by historical practice patterns. Memory is not transient — every recommendation ALICE makes is written back to the Practice Memory Graph, creating a self-improving learning loop.

This document describes how ALICE reads, uses, and writes memory across its three memory layers.

---

## Three Memory Layers

### Layer 1 — Immediate Memory (Current Session Context)

Immediate memory holds the in-flight context for a single `generatePatientDecision()` call. It is constructed fresh on each invocation and discarded after the decision is written.

Contents:
- Incoming `opts` payload (organizationId, patientExternalId, procedureType, context)
- Retrieved influence scores for the patient
- Top 10 most recent memory records for the patient
- Latest `practice_intelligence_snapshots` row

This layer is held in working memory (TypeScript objects) and never persisted as-is.

### Layer 2 — Working Memory (Active Patient Decisions)

Working memory is the `alice_patient_decisions` table — the set of decisions that have been generated but not yet acted upon or dismissed.

ALICE reads working memory to avoid redundant recommendations:
- If a `pending` decision already exists for a patient with the same `decision_type`, ALICE will update rather than duplicate
- `getPendingPatientDecisions(orgId)` surfaces this layer for human review in Mission Control

Working memory records remain active until staff marks them `acted` or `dismissed`.

### Layer 3 — Long-Term Memory (Practice Memory Graph)

Long-term memory is the `practice_memory_records` table — the complete behavioral history of every patient, provider, campaign, and channel in the practice. This is the permanent store that accumulates over the full patient lifetime.

Long-term memory is the source of truth for:
- What has been communicated to this patient
- What treatments have been accepted or declined
- Which channels have yielded responses
- Which scripts have driven engagement
- What outcomes followed past recommendations

---

## How ALICE Reads the Practice Memory Graph

ALICE reads `practice_memory_records` filtered to the relevant entity before building the AI prompt.

```
getEntityEffectiveness(orgId, 'patient', patientExternalId)
→ Returns all records WHERE entity_type = 'patient' AND entity_external_id = patientExternalId
→ Ordered by record_date DESC, limited to top 10 most recent relevant records
```

Memory record types ALICE prioritizes (in order of relevance to decision generation):

| Priority | Record Type | Why ALICE Reads It |
|----------|-------------|-------------------|
| 1 | `communication_sent` | What channels have been tried; recency of last contact |
| 2 | `treatment_outcome` | Which treatments were accepted or declined |
| 3 | `alice_recommendation` | What ALICE previously recommended; was it acted on |
| 4 | `appointment_booked` | Booking patterns (day of week, time, channel that triggered booking) |
| 5 | `review_generated` | Patient satisfaction signal |
| 6 | `referral_made` | High-relationship indicator |
| 7 | `video_watched` | Engagement signal by content type |
| 8 | `membership_enrolled` | Financial relationship indicator |
| 9 | `recall_recovered` | Reactivation history |
| 10 | `no_show_prevented` | Reliability risk signal |

**Context window management:** ALICE retrieves a maximum of 10 records per patient per decision call to avoid exceeding the AI model's context window and to keep latency low. Records are selected by recency and record_type priority.

---

## How ALICE Reads Practice Intelligence Snapshots

Before generating a patient decision, ALICE reads the latest daily `practice_intelligence_snapshots` for the organization. This provides practice-level context:

- What is the top growth opportunity for this practice today?
- What channels are performing best for this practice population?
- What is the practice's current treatment acceptance trend?

This prevents ALICE from making patient recommendations that are misaligned with the practice's current priorities. For example, if the practice's recall recovery rate is critically low, ALICE will weight recall outreach more heavily in its recommendations even for patients who also have treatment opportunities.

---

## How ALICE Reads Patient Influence Scores

Patient influence scores from `patient_influence_scores` provide the quantitative foundation for every ALICE decision. ALICE reads all 7 dimensions:

| Dimension | How ALICE Uses It |
|-----------|------------------|
| `overall_influence_score` | Gates whether to intervene at all |
| `treatment_intent` | Determines decision_type (treatment_push vs. general_engagement) |
| `communication_responsiveness` | Informs channel recommendation confidence |
| `financial_readiness` | Adjusts expected_revenue and CTA recommendation |
| `loyalty_index` | Influences referral_ask and review_request suitability |
| `referral_probability` | Triggers referral_ask decision type |
| `membership_conversion` | Triggers membership_offer decision type |

Score thresholds used by ALICE rule-based fallback:

| Score | Action |
|-------|--------|
| overall > 70 | `intervention` — proactive immediate outreach |
| overall 50–70 | `journey_update` — adjust current journey step |
| overall < 50 | `hold` — monitor, no action |

---

## Decision Enrichment Flow

The full enrichment pipeline for `generatePatientDecision()`:

```
1. Receive opts (orgId, patientExternalId, procedureType, context)
        ↓
2. Read patient_influence_scores
   → All 7 dimension scores
        ↓
3. Read practice_memory_records (top 10, patient entity)
   → Communication history, outcomes, prior recommendations
        ↓
4. Read practice_intelligence_snapshots (latest daily)
   → Practice-level context and top opportunity
        ↓
5. Build AI prompt
   → System: ALICE role instructions
   → User: patient context block (influence scores + memory records + practice snapshot)
        ↓
6. Call AnthropicProvider (claude-haiku-4-5-20251001)
   → Receive JSON decision response
        ↓
7. Parse and validate response
   → Fall back to rule-based if AI fails or confidence < 0.5
        ↓
8. Insert to alice_patient_decisions
        ↓
9. Call recordMemory() → write alice_recommendation to practice_memory_records
        ↓
10. Emit alice.recommendation.created event via Event Fabric
```

---

## Memory Write-Back

After every ALICE decision, `recordMemory()` is called to write the recommendation into the Practice Memory Graph. This is a critical step in the learning loop — without write-back, ALICE cannot know what it has already recommended.

Write-back record structure:
```json
{
  "organization_id": "uuid",
  "entity_type": "patient",
  "entity_external_id": "OD-12345",
  "record_type": "alice_recommendation",
  "record_date": "2025-03-15",
  "data": {
    "decision_type": "treatment_push",
    "recommended_action": "Send implant education video",
    "recommended_channel": "video",
    "confidence_score": 0.87,
    "reasoning": "High treatment intent, 14 days since last contact"
  },
  "effectiveness_score": null
}
```

The `effectiveness_score` is initially `null`. It is updated when the recommended action produces an observable outcome (appointment booked, treatment accepted, etc.), creating the feedback loop for ALICE learning.

---

## ALICE Learning Cycle

```
Decision made
      ↓
alice_recommendation written to practice_memory_records (effectiveness_score = null)
      ↓
Workflow OS executes recommended action (send video, send SMS, etc.)
      ↓
Patient responds (or does not respond)
      ↓
Outcome observed (appointment_booked / treatment_outcome / no response)
      ↓
practice_memory_records updated: effectiveness_score = 0.0–1.0
      ↓
Next generatePatientDecision() reads updated memory → AI prompt includes outcome context
      ↓
ALICE improves channel, timing, and script recommendations for this patient
```

Over time, the Practice Memory Graph accumulates enough effectiveness signals that ALICE can identify patient-specific patterns: which channel this patient responds to, which script themes drive them to book, which timing is most effective.

---

## Memory Types ALICE Uses

| Record Type | Written By | ALICE Reads For |
|-------------|------------|-----------------|
| `treatment_outcome` | PMS sync / Workflow OS | Treatment history, acceptance/decline pattern |
| `communication_sent` | Notification Engine | Channel history, recency, frequency cap |
| `review_generated` | Reputation Engine | Satisfaction signal |
| `referral_made` | Referral Engine | Relationship strength |
| `appointment_booked` | PMS sync / Journey Engine | Booking pattern |
| `alice_recommendation` | ALICE write-back | Prior recommendations, effectiveness |
| `membership_enrolled` | Membership Engine | Financial relationship |
| `recall_recovered` | Recall Engine | Reactivation history |
| `no_show_prevented` | No-Show Prevention Engine | Reliability signal |
| `video_watched` | Video Intelligence Engine | Content engagement |

---

## alice_patient_decisions Table

Patient-scoped decisions distinct from the practice-level `alice_decisions` table.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | Tenant isolation |
| `patient_external_id` | text | Opaque PMS reference |
| `decision_type` | text | `treatment_push`, `recall_outreach`, `review_request`, `membership_offer`, `referral_ask`, `general_engagement` |
| `who` | text | Patient context summary |
| `what` | text | Specific recommended action |
| `when_to_act` | text | `within_24h` / `within_48h` / `within_7d` |
| `why` | text | Evidence-based rationale |
| `how` | text | Channel and delivery method |
| `confidence_score` | numeric | 0–1; < 0.5 indicates fallback was used |
| `expected_revenue` | numeric | Projected revenue if action succeeds |
| `expected_conversion_rate` | numeric | Probability action leads to conversion |
| `expected_followup` | text | Next step if no response |
| `status` | text | `pending` / `acted` / `dismissed` |
| `acted_at` | timestamptz | Timestamp when staff executes the decision |
| `is_fallback` | boolean | True if rule-based fallback was used |
| `created_at` | timestamptz | |

---

## Tenant Isolation

All memory reads and writes in ALICE are scoped to `organization_id`. There is no cross-tenant memory sharing. Every query to `practice_memory_records`, `patient_influence_scores`, `practice_intelligence_snapshots`, and `alice_patient_decisions` requires an explicit `organization_id` filter.

This ensures that ALICE's learning in Practice A has no influence on decisions for Practice B, even if patients have similar profiles.

---

## Context Window Budget

To maintain decision latency under 3 seconds, ALICE enforces a strict context budget:

| Context Component | Max Tokens (approx) |
|-------------------|-------------------|
| System prompt (ALICE role) | 500 |
| Patient influence scores | 300 |
| Memory records (top 10) | 1,500 |
| Practice intelligence snapshot | 400 |
| Incoming context string | 200 |
| **Total** | **~2,900** |

`claude-haiku-4-5-20251001` is selected specifically for its speed and cost profile at this context size. The 10-record memory limit is calibrated to keep the budget within these bounds while providing sufficient behavioral context for high-quality decisions.
