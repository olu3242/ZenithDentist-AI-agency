# ALICE — Canonical Role and Responsibilities

**Version:** 2.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. What Is ALICE?

ALICE (Automated Learning and Intelligent Clinical Engagement) is the Chief Intelligence Officer of the ZenithDentist platform. ALICE is the AI agent responsible for reading practice and patient context, generating personalized engagement decisions, and orchestrating growth actions on behalf of dental practices.

ALICE is not a chatbot. ALICE is an autonomous decision engine that operates continuously in the background, reading signals and writing structured decisions that downstream workflows execute.

---

## 2. Core Role

| Dimension | Definition |
|-----------|-----------|
| **Title** | Chief Intelligence Officer (AI Layer) |
| **Layer** | Intelligence Layer (L3) |
| **Primary Read** | Practice Memory Graph, Patient Influence Scores |
| **Primary Write** | `alice_patient_decisions` |
| **AI Path** | claude-haiku-4-5-20251001 |
| **Fallback Path** | Rule-based decision engine |
| **Invocation** | Synchronous (real-time) + Asynchronous (batch nightly) |

---

## 3. Responsibilities

### 3.1 Patient-Level Decisions

For each active patient in a practice, ALICE is responsible for:

| Decision Type | Description |
|-------------|-------------|
| `recall_priority` | Should this patient be contacted for recall, and with what urgency? |
| `message_personalization` | What tone, content, and framing will maximize engagement? |
| `channel_selection` | Which channel (SMS, email, portal, video) is optimal for this patient? |
| `treatment_nudge` | Is this patient ready to accept a pending treatment? |
| `membership_recommendation` | Should this patient be offered or upgraded on a membership plan? |
| `referral_activation` | Is this patient likely to refer? Should referral be activated now? |
| `journey_assignment` | Which patient journey blueprint is the best fit right now? |
| `outreach_timing` | What is the optimal time to send outreach for this patient? |

### 3.2 Practice-Level Intelligence

| Intelligence Type | Description |
|-----------------|-------------|
| `growth_score_insight` | Narrative explanation of the practice's Growth Score trend |
| `dimension_alert` | Alert when a Growth Score dimension drops significantly |
| `cohort_analysis` | Identify patient segments requiring intervention |
| `benchmark_comparison` | Compare practice metrics against peer benchmarks |
| `opportunity_identification` | Surface untapped growth opportunities |

---

## 4. Decision Data Inputs

ALICE reads the following before generating any decision:

| Input | Table / Source |
|-------|---------------|
| Practice identity | `organizations` |
| Practice memory | `practice_memory_records` |
| Patient influence tier | `patient_influence_scores` |
| Recall status | `recall_tracking` |
| Treatment predictions | `treatment_acceptance_predictions` |
| Membership status | `membership_tracking` |
| Referral history | `referral_tracking` |
| Journey state | `journey_assignments` |
| Growth Score | `growth_scores` |
| Recent events | `runtime_event_fabric_events` (last 30 days) |

---

## 5. Decision Output Schema

Every ALICE decision is written to `alice_patient_decisions`:

```sql
CREATE TABLE alice_patient_decisions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  patient_external_id   TEXT NOT NULL,
  decision_type         TEXT NOT NULL,
  decision              JSONB NOT NULL,
  rationale             TEXT NOT NULL,
  confidence_score      NUMERIC(3,2) NOT NULL,
  input_snapshot        JSONB NOT NULL,
  model_used            TEXT,           -- 'claude-haiku-4-5-20251001' | 'rule_based'
  path_used             TEXT NOT NULL,  -- 'ai' | 'fallback'
  expires_at            TIMESTAMPTZ,
  acted_upon            BOOLEAN DEFAULT false,
  acted_upon_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

### Decision Payload Example

```json
{
  "decision_type": "recall_priority",
  "decision": {
    "should_contact": true,
    "urgency": "high",
    "recommended_channel": "sms",
    "recommended_timing": "morning",
    "journey_template": "lapsed_patient_recall_v2"
  },
  "rationale": "Patient has been lapsed 14 months, influence tier Engaged, SMS open rate historically high. Treatment pending: crown on #14.",
  "confidence_score": 0.87,
  "path_used": "ai"
}
```

---

## 6. AI Path

### Model: claude-haiku-4-5-20251001

ALICE uses `claude-haiku-4-5-20251001` for real-time, per-patient decisions due to its optimal balance of:

- Speed (< 1s p50 latency)
- Cost (high volume decisions)
- Quality (sufficient for structured decision JSON)

### Prompt Architecture

```
System Prompt: ALICE role definition + decision schema + practice context
User Prompt:   Patient context snapshot + decision request type
Output:        Structured JSON decision + plain English rationale
```

### Prompt Components

| Component | Purpose |
|-----------|---------|
| Role definition | ALICE identity, decision authority |
| Decision schema | JSON schema for structured output |
| Practice memory | Practice voice, goals, constraints |
| Patient snapshot | Influence score, history, pending items |
| Decision request | Specific decision type requested |

---

## 7. Rule-Based Fallback

When AI is unavailable or confidence is below threshold (< 0.60), ALICE falls back to the rule-based engine:

| Decision Type | Fallback Rule |
|-------------|--------------|
| `recall_priority` | Lapsed > 6 months + no active journey → high priority |
| `channel_selection` | SMS if mobile on file, else email |
| `message_personalization` | Use default template for influence tier |
| `treatment_nudge` | Flag if treatment pending > 90 days |
| `membership_recommendation` | Offer if 3+ visits in 12 months, no membership |
| `journey_assignment` | Default journey for patient lifecycle stage |

---

## 8. Confidence and Trust

| Confidence Range | Interpretation | Action |
|----------------|---------------|--------|
| 0.85 - 1.00 | High confidence | Execute immediately |
| 0.70 - 0.84 | Good confidence | Execute with standard monitoring |
| 0.60 - 0.69 | Moderate confidence | Execute; flag for review |
| 0.40 - 0.59 | Low confidence | Use fallback rule instead |
| 0.00 - 0.39 | Very low | Skip decision; log for investigation |

---

## 9. Auditability Standards

Every ALICE decision must satisfy:

- [ ] Written to `alice_patient_decisions` before any action is taken
- [ ] `input_snapshot` captures all data read at decision time (point-in-time)
- [ ] `rationale` is human-readable and references the inputs
- [ ] `model_used` and `path_used` recorded
- [ ] Confidence score included
- [ ] Expires_at set (decisions expire after 48 hours unless acted upon)

---

## 10. ALICE Invocation Points

| Trigger | Decision Type | Invocation Mode |
|---------|-------------|----------------|
| Recall workflow step | `recall_priority` + `message_personalization` | Synchronous |
| Journey checkpoint | `channel_selection` + `outreach_timing` | Synchronous |
| Nightly batch | All decision types for all active patients | Async batch |
| Growth Score drop | `cohort_analysis` + `opportunity_identification` | Async |
| New patient joined | `journey_assignment` + `membership_recommendation` | Synchronous |
| Treatment flagged by PMS | `treatment_nudge` | Synchronous |

---

## 11. What ALICE Does Not Do

- ALICE does not communicate directly with patients. It writes decisions; workflows execute them.
- ALICE does not access PHI.
- ALICE does not make clinical diagnoses or treatment recommendations.
- ALICE does not override staff decisions (staff may dismiss any ALICE recommendation).
- ALICE does not operate outside the `alice_patient_decisions` write boundary.
