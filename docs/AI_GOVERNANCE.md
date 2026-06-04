# AI Governance Framework

**Document Type:** Canonical Governance Reference  
**Platform:** Zenith Patient OS  
**Component:** ALICE — Chief Intelligence Officer  
**Status:** Ratified  
**Last Updated:** 2026-06-02  

---

## Table of Contents

1. [ALICE Mandate](#alice-mandate)
2. [AI Provider Configuration](#ai-provider-configuration)
3. [Prompt Design Principles](#prompt-design-principles)
4. [Fallback Protocol](#fallback-protocol)
5. [Decision Types and Authorization Levels](#decision-types-and-authorization-levels)
6. [Confidence Score Governance](#confidence-score-governance)
7. [AI Audit Trail](#ai-audit-trail)
8. [AI Learning Loop](#ai-learning-loop)
9. [Model Version Governance](#model-version-governance)
10. [Data Minimization](#data-minimization)
11. [Bias Prevention](#bias-prevention)
12. [Explainability Requirement](#explainability-requirement)

---

## 1. ALICE Mandate

ALICE (Autonomous Learning and Intelligence for Clinical Engagement) is the Chief Intelligence Officer of Zenith Patient OS. ALICE operates as a hybrid AI + rule-based system, coordinating intelligence across all platform engines.

### 1.1 Authorized Actions

ALICE is explicitly authorized to perform the following:

| Authority | Description |
|-----------|-------------|
| **Observe** | Read patient influence scores, journey states, practice memory records, and event fabric events |
| **Predict** | Generate probability scores for treatment acceptance, recall recovery, referral likelihood, review conversion, and membership conversion |
| **Recommend** | Output structured decision recommendations with decision type, reasoning, confidence score, and suggested action |
| **Optimize** | Select highest-impact patient for a given action type based on influence scoring and practice context |
| **Learn** | Receive outcome signals from practice_memory_records and incorporate them into future decision context |

### 1.2 Prohibited Actions (Without Workflow Authorization)

ALICE is explicitly **prohibited** from the following without explicit workflow-level authorization:

| Prohibition | Rationale |
|-------------|-----------|
| Modify production data directly | All data changes must flow through Automation Platform audit trail |
| Override practice policies | Practice policy is set by organization_owner; ALICE may recommend policy changes but not enact them |
| Create patient records | Patient records originate in the PMS; ALICE does not create new patient identities |
| Delete patient records | Destructive operations on patient data require human authorization at organization_owner level or above |
| Modify revenue records | Revenue records are authoritative financial documents; ALICE may attribute revenue only through the attribution engine |
| Execute patient-facing communications autonomously (confidence < 0.9) | Below autonomous execution threshold, human review is required |
| Access data outside the requesting organization | ALICE is tenant-scoped; cross-organization data access is prohibited |
| Store PHI in any prompt, log, or intermediate buffer | Patient names, DOB, SSN, insurance IDs are never passed to AI models |

### 1.3 ALICE Role Summary

> ALICE advises. Automation Platform executes. Practice staff authorize.

---

## 2. AI Provider Configuration

### 2.1 Provider

- **Provider:** AnthropicProvider
- **SDK:** `@anthropic/sdk` (TypeScript)
- **Environment variable:** `ANTHROPIC_API_KEY`
- **Model selection:** context-dependent (see below)

### 2.2 Model Selection Policy

| Use Case | Model | Rationale |
|----------|-------|-----------|
| Patient-level decisions (treatment_push, recall_outreach, review_request, membership_offer, referral_ask, general_engagement) | `claude-haiku-4-5-20251001` | High-throughput, cost-effective, sufficient for structured decision output |
| Strategic analysis (practice intelligence summary, Growth Score interpretation, cohort analysis) | Higher-tier model (claude-sonnet or above) | Complex reasoning, synthesis of multi-dimensional data |
| Fallback (any call on rule-based path) | No model invoked | Rule-based engine processes locally |

### 2.3 API Call Standards

- All calls use structured output format (JSON mode where supported)
- Temperature: 0.2 for patient decisions (low variance), 0.5 for strategic analysis
- Max tokens: 512 for patient decisions, 2048 for strategic analysis
- System prompt versioned and stored in codebase — never assembled at runtime from user input

---

## 3. Prompt Design Principles

### 3.1 PHI Prohibition

> **Rule:** No Protected Health Information (PHI) may appear in any prompt sent to any AI model.

| Prohibited in Prompts | Allowed in Prompts |
|-----------------------|--------------------|
| Patient name | patient_external_id (opaque PMS reference) |
| Date of birth | organizationId |
| Social Security Number | influence score dimensions (numeric values) |
| Insurance ID or payer name | last_visit_days (numeric) |
| Address or contact information | decision_type (enum value) |
| Diagnosis codes (ICP-10) | confidence_threshold (numeric) |
| Clinical notes or treatment plans | practice_intelligence_summary (aggregate, non-PHI text) |

### 3.2 Tenant Context Requirement

Every prompt must include `organizationId` to ensure:
- ALICE cannot be confused about which practice's policies apply
- Response context is tenant-specific
- Audit trail links correctly to the organization

### 3.3 Confidence Threshold Injection

Every patient decision prompt must include the configured `confidence_threshold` for the organization (default: 0.5). This prevents ALICE from returning decisions that do not meet the minimum bar for the practice.

### 3.4 Structured Prompt Template

All ALICE prompts follow a canonical structure:

```
SYSTEM: You are ALICE, the patient intelligence engine for a dental practice. 
Return a structured JSON decision. Never include patient names or PHI.

CONTEXT:
- Organization: {organizationId}
- Decision Type: {decisionType}
- Confidence Threshold: {confidenceThreshold}
- Patient External ID: {patientExternalId}
- Influence Scores: {influenceScoresSummary}
- Top Memory Records: {top10MemoryRecords}
- Practice Intelligence: {practiceIntelligenceSummary}

OUTPUT SCHEMA:
{ decisionType, confidence, reasoning, recommended_action, fallback_if_rejected }
```

---

## 4. Fallback Protocol

### 4.1 Trigger Conditions

The rule-based fallback activates when any of the following conditions occur:

| Condition | Action |
|-----------|--------|
| AI provider API call fails (network error, timeout, rate limit) | Immediate fallback, no retry at AI layer |
| Response confidence < 0.5 | Fallback activates |
| AI response fails schema validation | Fallback activates |
| AI response contains unexpected decision_type | Fallback activates |
| ANTHROPIC_API_KEY not configured | Fallback activates |

### 4.2 Fallback Logic

The rule-based fallback uses deterministic scoring against influence dimensions:

1. Read patient_influence_scores for the patient
2. Apply decision-type-specific threshold rules (e.g., treatment_intent > 65 → generate treatment_push recommendation)
3. Set confidence = normalized influence score / 100
4. Set `fallback_used = true` on the alice_patient_decisions record

### 4.3 Fallback Audit Flag

Every ALICE decision stored in `alice_patient_decisions` includes:
- `fallback_used: boolean` — true if rule-based path was used
- `fallback_reason: string` — reason for fallback activation

### 4.4 Fallback Does Not Bypass Authorization

Fallback-generated decisions are subject to the same authorization and confidence governance rules as AI-generated decisions.

---

## 5. Decision Types and Authorization Levels

### 5.1 Supported Decision Types

| Decision Type | Description | Autonomous Execution (confidence ≥ 0.9) | Staff Notification (0.7–0.9) | Staff Review Required (0.5–0.7) |
|---------------|-------------|------------------------------------------|-------------------------------|----------------------------------|
| `treatment_push` | Recommend follow-up on unaccepted treatment plan | practice_manager approval required regardless | Yes | Yes |
| `recall_outreach` | Initiate recall sequence for overdue patient | Allowed if recall workflow pre-authorized | Yes | Yes |
| `review_request` | Request Google/platform review post-visit | Allowed | Yes | Yes |
| `membership_offer` | Offer in-house membership plan | practice_manager approval required | Yes | Yes |
| `referral_ask` | Request patient referral | Allowed if referral workflow pre-authorized | Yes | Yes |
| `general_engagement` | General re-engagement communication | Allowed | Yes | Yes |

### 5.2 Authorization Hierarchy for Manual Triggering

- `treatment_push` and `membership_offer`: require **practice_manager** or above to authorize non-automated execution
- All other types: **staff** or above may trigger with workflow authorization
- Bulk automation (affecting > 10 patients at once): requires **organization_owner** or above

---

## 6. Confidence Score Governance

### 6.1 Confidence Tiers

| Tier | Range | Action |
|------|-------|--------|
| **Autonomous Execution** | 0.9 – 1.0 | ALICE decision may execute via pre-authorized workflow without additional human review |
| **Staff Notification** | 0.7 – 0.89 | Decision executes but staff member is notified via Executive Dashboard |
| **Staff Review Required** | 0.5 – 0.69 | Decision queued for staff review before execution |
| **Fallback Only** | < 0.5 | AI decision discarded; rule-based fallback recommendation produced; human must authorize |

### 6.2 Confidence Score Composition

- ALICE returns a raw confidence value in [0.0, 1.0]
- Confidence reflects model certainty in the recommended action given the input context
- Low confidence may indicate: insufficient memory records, conflicting influence signals, ambiguous practice context

### 6.3 Organization-Level Confidence Configuration

Organizations may raise (but not lower below 0.5) their autonomous execution threshold via practice settings:
- Default autonomous threshold: 0.9
- Default review threshold: 0.5
- Minimum allowed review threshold: 0.5

---

## 7. AI Audit Trail

### 7.1 Storage Table

Every ALICE decision (AI-generated or fallback) is persisted to `alice_patient_decisions`.

### 7.2 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Tenant isolation |
| `patient_external_id` | text | Opaque PMS reference — no PHI |
| `decision_type` | enum | One of the 6 supported types |
| `confidence` | float | 0.0–1.0 |
| `reasoning` | text | ALICE's stated reasoning (no PHI) |
| `input_context_hash` | text | SHA-256 of input context (for verification without storing raw context) |
| `fallback_used` | boolean | True if rule-based path was activated |
| `fallback_reason` | text | Reason fallback was activated (nullable) |
| `actioned` | boolean | Whether a downstream action was taken |
| `actioned_at` | timestamp | When the action was taken |
| `actioned_by` | uuid | User or workflow that actioned |
| `created_at` | timestamp | Decision creation time |

### 7.3 Retention

All `alice_patient_decisions` records are retained for minimum 365 days per HIPAA audit requirements.

---

## 8. AI Learning Loop

### 8.1 Feedback Mechanism

ALICE improves through outcome signals recorded in `practice_memory_records`. The learning loop operates as follows:

1. ALICE generates decision with reasoning and recommendation
2. Staff actions (or does not action) the decision
3. Outcome is observed (patient responded, appointment booked, review posted, referral made)
4. Outcome is written to `practice_memory_records` with `record_type = 'patient_outcome'`
5. On next ALICE call for this patient, top 10 memory records (including outcome records) are injected into context
6. ALICE incorporates prior outcome signals into new reasoning

### 8.2 Memory Record Types Used by ALICE

| Record Type | Learning Signal |
|-------------|----------------|
| `patient_outcome` | Direct outcome of prior ALICE recommendation |
| `communication_response` | Patient responded to outreach (positive signal) |
| `appointment_completed` | Patient kept appointment (treatment intent signal) |
| `review_posted` | Patient posted review (loyalty signal) |
| `referral_made` | Patient made referral (advocacy signal) |

### 8.3 Learning Loop Limitations

- ALICE does not update model weights — learning is context injection, not fine-tuning
- Memory records are practice-scoped — ALICE does not learn across organizations
- Outcome reconciliation between `alice_patient_decisions` and revenue outcomes is a future sprint deliverable

---

## 9. Model Version Governance

### 9.1 Version Pinning Policy

> Models must be pinned to a specific version string. Use of "latest" or unpinned aliases is prohibited in production.

- Patient decisions: `claude-haiku-4-5-20251001` (pinned)
- Strategic analysis: specify pinned version in environment configuration

### 9.2 Model Upgrade Process

1. New model version identified by engineering team
2. Shadow testing: run new model in parallel with existing model for 7 days on anonymized data
3. Confidence calibration comparison: new model confidence scores must correlate ≥ 0.85 with existing
4. Governance review: super_admin approves version change
5. Staged rollout: 10% → 50% → 100% traffic over 3 days
6. Old version retained in configuration for 30-day rollback window
7. Audit log entry created for version change with: old_version, new_version, approved_by, effective_at

### 9.3 Emergency Rollback

If new model version degrades confidence calibration or produces unexpected outputs:
- Revert `ANTHROPIC_MODEL` environment variable to previous pinned version
- Log rollback event in Event Fabric (`eventType: SYSTEM_EVENT`, `eventKey: alice.model.rolled_back`)

---

## 10. Data Minimization

### 10.1 Principle

ALICE receives only the minimum context necessary to generate a quality decision. Over-provisioning context increases PHI risk and prompt cost.

### 10.2 ALICE Context Bundle (Maximum)

| Context Item | Max Size | Source Table |
|-------------|----------|--------------|
| `patient_external_id` | 1 field | patient_influence_scores |
| `organizationId` | 1 field | (request context) |
| Influence score dimensions | 7 numeric values | patient_influence_scores |
| Top 10 memory records | 10 records (summary only) | practice_memory_records |
| Practice intelligence summary | 1 text block (≤ 500 chars) | practice_intelligence_records |
| Decision type | 1 enum value | (request parameter) |
| Confidence threshold | 1 float | (org configuration) |

### 10.3 What Is Never Sent to ALICE

- Patient name, date of birth, address, phone, email
- Insurance carrier, payer ID, policy number
- Clinical notes, diagnosis codes, prescription data
- Financial records, outstanding balance amounts
- Other patients' data
- Raw communication logs with identifiable information

---

## 11. Bias Prevention

### 11.1 Prohibited Input Dimensions

The following attributes may **never** be used as inputs to influence scoring or ALICE decision context:

| Prohibited Attribute | Rationale |
|----------------------|-----------|
| Age | Protected class; correlation with treatment decisions must be clinically motivated, not algorithmic |
| Race or ethnicity | Protected class |
| Gender or gender identity | Protected class |
| Insurance type or carrier | May proxy for socioeconomic status |
| Zip code (when used as demographic proxy) | May proxy for race or income |
| Language preference | May proxy for ethnicity |

### 11.2 Explicit Weighted Formula

Influence scores use a transparent, auditable weighted formula with published dimension weights (see Patient Influence Governance). No black-box scoring is permitted.

### 11.3 Bias Audit

Quarterly review: engineering team samples 100 decisions per organization, verifies no prohibited attributes appear in reasoning text or input context.

---

## 12. Explainability Requirement

### 12.1 Principle

Every ALICE recommendation must be explainable to practice staff in plain language.

### 12.2 Required Explainability Artifacts

| Artifact | Location | Required For |
|----------|----------|-------------|
| `reasoning` field | alice_patient_decisions | Every decision |
| Influence score breakdown | patient_influence_scores (all dimensions) | Every decision |
| Top memory records contributing to context | practice_memory_records | Available on demand |
| `fallback_used` + `fallback_reason` | alice_patient_decisions | Fallback decisions |

### 12.3 Staff Transparency Interface

Practice Intelligence OS exposes:
- Influence score breakdown for any patient (7 dimensions with values)
- ALICE decision history for any patient
- Reason why a specific recommendation was generated

### 12.4 Non-Negotiable

If ALICE cannot produce a reasoning string traceable to specific input signals, the decision must be rejected and fallback activated.

---

*This document governs all AI operations within Zenith Patient OS. Any deviation requires super_admin authorization and audit log entry.*
