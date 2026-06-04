# ALICE Memory Architecture

## Overview

ALICE™ (AI Chief Intelligence Officer) maintains a multi-layer memory architecture that enables patient-specific decision-making informed by historical practice patterns. Memory is not transient — every recommendation ALICE makes is written back to the Practice Memory Graph, creating a self-improving learning loop.

This document describes how ALICE reads, uses, and writes memory across its three memory layers.

---

## The Three Memory Layers

### Layer 1 — Immediate Memory (Current Session Context)

Immediate memory is the context assembled at the moment a decision is generated. It includes:

- The specific patient's current influence scores (all 7 dimensions)
- The patient's active journey assignment status
- Any context string passed by the calling system (e.g., "Patient declined treatment 60 days ago")
- The current practice intelligence snapshot (top growth opportunity, channel preference distribution)

Immediate memory is **not persisted** — it exists only for the duration of the `generatePatientDecision()` call.

### Layer 2 — Working Memory (Active Patient Decisions)

Working memory is the set of `alice_patient_decisions` records with `status = 'pending'` for the organization. These represent decisions ALICE has made that have not yet been acted upon or dismissed by practice staff.

- Queried via `getPendingPatientDecisions(orgId)`
- Displayed in the ALICE Command Center in Mission Control
- A patient may only have one pending decision at a time (subsequent decisions for the same patient update the existing pending record)
- Working memory is cleared when a decision is `acted` or `dismissed`

### Layer 3 — Long-Term Memory (Practice Memory Graph)

Long-term memory is the `practice_memory_records` table — the persistent, immutable record of every meaningful patient and practice event. ALICE reads this to understand:

- How individual patients have responded to past communications
- Which channels and scripts have driven conversions historically
- What treatments a patient has accepted or declined
- Whether a patient is a known referral source or membership holder

Long-term memory is never deleted — only appended. This makes ALICE's learning cumulative.

---

## How ALICE Reads the Practice Memory Graph

When building the AI prompt for a patient decision, ALICE calls:

```
getEntityEffectiveness(orgId, 'patient', patientExternalId)
```

This returns the top 10 most recent `practice_memory_records` for the patient, ordered by `record_date DESC`. The records are grouped by `record_type` and summarized:

```
Patient P-123 context from Practice Memory Graph:
- Watched 3 implant education videos (avg engagement: 0.8)
- Responded to 2 SMS outreach attempts (channel_score: 0.9)
- Ignored 5 email campaigns (channel_score: 0.2)
- Books appointments on Friday evenings (pattern from appointment_booked records)
- Accepted financing for crown placement in March (conversion history)
- Made 2 referrals in the past 12 months (referral_made records)
```

This context is injected directly into the Claude prompt as a structured summary.

### Context Window Management

To prevent prompt bloat, ALICE limits memory context to:
- **Top 10** most recent memory records per patient
- Records from the **last 24 months** only
- No duplicate `record_type` aggregated more than once per summary

---

## How ALICE Reads Practice Intelligence Snapshots

Before generating a patient decision, ALICE reads the latest `daily` snapshot from `practice_intelligence_snapshots` for the organization. It extracts:

- `practiceIntelligence.topGrowthOpportunity` — the practice's highest-priority growth action
- `patientIntelligence.channelPreferenceBreakdown` — population-level channel preferences
- `practiceIntelligence.recallRecoveryRate` — whether recall is currently a priority

This practice-level context allows ALICE to align individual patient recommendations with practice-level needs. If the practice's top opportunity is `recall_recovery`, ALICE will weight recall outreach recommendations more heavily for eligible patients.

---

## How ALICE Reads Patient Influence Scores

`patient_influence_scores` contains 7 scored dimensions per patient:

| Dimension | What ALICE uses it for |
|-----------|------------------------|
| `treatment_intent` | Prioritize treatment push decisions |
| `referral_probability` | Flag for referral ask sequence |
| `membership_conversion` | Flag for membership offer sequence |
| `recall_responsiveness` | Prioritize recall outreach targeting |
| `review_likelihood` | Trigger review request after positive visit |
| `communication_engagement` | Select channel and timing |
| `lifetime_value_potential` | Weight urgency of intervention |

ALICE reads `patient_influence_scores` where `organization_id = $orgId AND patient_external_id = $patientExternalId` and uses the scores to seed the AI prompt with quantified patient propensity.

---

## Decision Enrichment Flow

```
generatePatientDecision(orgId, patientExternalId, procedureType, context)
  │
  ├── 1. Read patient_influence_scores  (influence dimensions)
  ├── 2. Read practice_memory_records   (top 10 historical records for patient)
  ├── 3. Read practice_intelligence_snapshots (latest daily snapshot)
  ├── 4. Read conversion_profiles       (treatment acceptance probability)
  │
  ├── 5. Build AI prompt with all context
  │
  ├── 6a. [AI path] → AnthropicProvider (claude-haiku-4-5-20251001)
  │         → returns: decisionType, who, what, when, why, how, confidenceScore, expectedRevenue
  │
  └── 6b. [Fallback path] → rule-based thresholds (if AI unavailable or confidence < 0.5)
  
  └── 7. Insert to alice_patient_decisions
  └── 8. Emit event: alice.recommendation.created.<patientExternalId>
  └── 9. recordMemory(orgId, 'patient', patientExternalId, 'alice_recommendation', decisionData)
```

---

## Memory Write-Back

After every ALICE recommendation, regardless of path (AI or fallback), `recordMemory()` is called:

```typescript
recordMemory({
  organizationId: orgId,
  entityType: 'patient',
  entityExternalId: patientExternalId,
  recordType: 'alice_recommendation',
  recordDate: new Date(),
  data: {
    decisionType,
    confidenceScore,
    recommendedChannel,
    recommendedAction,
    procedureType
  }
})
```

This write-back ensures that future decisions for the same patient are informed by what ALICE previously recommended — preventing repeated identical recommendations and enabling ALICE to observe whether its recommendations resulted in action.

---

## Memory Types ALICE Uses

| Record Type | What It Captures | How ALICE Uses It |
|-------------|------------------|-------------------|
| `treatment_outcome` | Whether patient accepted/declined treatment | Seed treatment acceptance probability |
| `communication_sent` | Channel, message, effectiveness | Channel selection for next outreach |
| `review_generated` | Patient submitted a review | Avoid re-requesting review; flag as advocate |
| `referral_made` | Patient referred someone | Reinforce referral ask; identify ambassadors |
| `appointment_booked` | Booking patterns and timing | Timing optimization for outreach |
| `alice_recommendation` | Previous ALICE decisions | Avoid repeated recommendations; observe outcomes |

---

## ALICE Learning Cycle

```
Decision made
    │
    ↓
Outcome observed (appointment booked / treatment accepted / review submitted)
    │
    ↓
Memory updated (practice_memory_records via recordMemory())
    │
    ↓
Next decision for same patient reads updated memory
    │
    ↓
Improved decision (informed by actual patient response history)
```

This cycle compounds over time. A practice with 12 months of ALICE decisions will have significantly richer memory context than one with 30 days, resulting in measurably higher recommendation accuracy.

---

## alice_patient_decisions Table

Patient-scoped ALICE decisions. See `ALICE_DECISION_ENGINE.md` for full schema.

Key fields relevant to memory architecture:

| Column | Type | Notes |
|--------|------|-------|
| `confidence_score` | numeric 0–1 | AI-generated confidence; fallback = 0.5 |
| `status` | text | `pending` / `acted` / `dismissed` |
| `acted_at` | timestamptz | Set when staff acts; triggers memory write-back |

When `acted_at` is set, the system should record a `communication_sent` or appropriate memory event to close the feedback loop.

---

## Tenant Isolation

All memory reads are scoped to `organization_id`. ALICE never reads memory across tenants. Every call to `getEntityEffectiveness()`, `getPracticeMemorySummary()`, and `getLatestPracticeIntelligenceSnapshot()` requires `organizationId` as the first parameter and enforces it as the first `WHERE` predicate.

---

## Related Documents

- `PRACTICE_MEMORY_GRAPH.md` — Full schema and query patterns for `practice_memory_records`
- `ALICE_DECISION_ENGINE.md` — Decision generation, AI prompt structure, fallback logic
- `PRACTICE_INTELLIGENCE_OS.md` — Snapshot generation and practice-level intelligence aggregation
- `PATIENT_INFLUENCE_ENGINE_PRD.md` — Influence score dimensions and computation
