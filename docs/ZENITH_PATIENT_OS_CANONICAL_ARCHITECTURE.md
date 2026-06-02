# ZenithDentist Patient OS — Canonical Architecture

**Version:** 2.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

This document defines the canonical architecture of the ZenithDentist Patient OS — the end-to-end system that ingests patient signals, orchestrates multi-channel engagement, and produces measurable revenue outcomes for dental practices.

---

## 2. Platform Layer Model

The platform is structured as five vertically integrated layers:

| Layer | Name | Responsibility |
|-------|------|----------------|
| L1 | Experience Layer | Patient portal, staff dashboards, Mission Control UI |
| L2 | Application Layer | Growth engines, journey orchestration, recall, membership, referral |
| L3 | Intelligence Layer | ALICE, Patient Influence Engine, Treatment Intelligence, Growth Score |
| L4 | Orchestration Layer | Workflow OS, Event Fabric, Audit Trail, DLQ, Replay |
| L5 | Data Layer | Supabase Postgres, RLS, multi-tenant schema, Practice Memory Graph |

### Layer Dependency Rules

- Each layer may only call downward (L1 → L5).
- Intelligence (L3) reads from Data (L5) and writes decisions back to L5.
- Orchestration (L4) coordinates Application (L2) workflows.
- No cross-layer writes except through defined service interfaces.

---

## 3. Core Data Entities

### 3.1 Patient Identity

All patient references use `patient_external_id` — no PHI (Personally Identifiable Health Information) is stored in the platform. PHI lives exclusively in the Practice Management System (PMS).

```
patient_external_id  →  PMS record (outside platform boundary)
                     →  growth_scores
                     →  patient_influence_scores
                     →  alice_patient_decisions
                     →  recall_tracking
                     →  journey_assignments
```

### 3.2 Organization Isolation

Every database table includes `organization_id` on every row. Row-Level Security (RLS) policies enforce `service_role` access. No cross-tenant data leakage is possible at the query layer.

---

## 4. Key Database Tables

| Table | Purpose |
|-------|---------|
| `growth_scores` | 0-100 composite practice score, 7 dimensions |
| `reputation_events` | Review signals, sentiment, source tracking |
| `referral_tracking` | Referral attribution, conversion state |
| `membership_tracking` | Membership plan enrollment, billing state |
| `new_patient_leads` | Acquisition funnel, lead scoring |
| `recall_tracking` | Recall outreach attempts, status |
| `practice_intelligence_snapshots` | Periodic practice health snapshots |
| `avatar_profiles` | Digital dentist twin avatar config |
| `voice_profiles` | Voice synthesis configuration |
| `script_templates` | AI-generated communication scripts |
| `journey_definitions` | Canonical patient journey blueprints |
| `journey_assignments` | Active patient journey state |
| `patient_portal_items` | Portal content per patient |
| `patient_influence_scores` | Influence tier and behavioral signals |
| `treatment_acceptance_predictions` | ML-predicted acceptance probability |
| `channel_selections` | Optimal channel per patient per interaction |
| `practice_memory_records` | Long-term practice behavioral memory |
| `alice_patient_decisions` | ALICE decision log with rationale |
| `revenue_attribution_records` | Revenue events attributed to platform actions |

---

## 5. Event Fabric Architecture

All platform actions produce immutable domain events. Events are dual-written to:

1. `runtime_event_fabric_events` — real-time processing stream
2. `mission_control_events` — Mission Control analytics and audit

### Event Schema (canonical)

```json
{
  "event_id": "uuid",
  "organization_id": "uuid",
  "event_type": "string",
  "aggregate_id": "string",
  "aggregate_type": "string",
  "payload": "jsonb",
  "metadata": {
    "source": "string",
    "correlation_id": "uuid",
    "causation_id": "uuid"
  },
  "occurred_at": "timestamptz",
  "sequence_number": "bigint"
}
```

### Immutability Contract

Events are never updated or deleted. Corrections are issued as compensating events.

---

## 6. Portal Access Gate

Patient portal access requires ALL four conditions:

| Gate | Condition |
|------|-----------|
| Contract | `contract_signed = true` |
| Setup Fee | `setup_fee_paid = true` |
| Approval | `approved_for_access = true` |
| Subscription | `subscription_active = true` |

Any gate failure results in portal access denial and routes to the appropriate remediation workflow.

---

## 7. Intelligence Pipeline

```
PMS Signal → patient_external_id mapping
           → Practice Memory Graph (practice_memory_records)
           → Patient Influence Engine (patient_influence_scores)
           → ALICE Decision Engine (alice_patient_decisions)
           → Journey Orchestration (journey_assignments)
           → Channel Selection (channel_selections)
           → Communication Execution
           → Revenue Attribution (revenue_attribution_records)
```

---

## 8. Library Module Inventory

| Module Path | Responsibility |
|-------------|---------------|
| `lib/practice-intelligence/` | Practice health analysis |
| `lib/growth-score/` | 7-dimension growth score computation |
| `lib/reputation-engine/` | Review monitoring and response |
| `lib/membership-engine/` | Membership plan management |
| `lib/recall-engine/` | Patient recall orchestration |
| `lib/new-patient-acquisition/` | Lead capture and nurture |
| `lib/digital-dentist-twin/` | Avatar + voice digital twin |
| `lib/avatar-studio/` | Avatar rendering and config |
| `lib/voice-studio/` | Voice synthesis and config |
| `lib/script-engine/` | AI script generation |
| `lib/journey-library/` | Journey blueprint management |
| `lib/patient-portal/` | Portal content and access |
| `lib/patient-influence/` | Influence scoring |
| `lib/treatment-intelligence/` | Treatment acceptance prediction |
| `lib/channel-optimization/` | Channel selection logic |
| `lib/practice-memory/` | Long-term memory records |
| `lib/alice/patient-decision-engine` | ALICE core decision logic |

---

## 9. Growth Score Model

The Growth Score is a 0-100 composite metric computed across 7 dimensions:

| Dimension | Weight | Source Signal |
|-----------|--------|--------------|
| Reviews | 20% | `reputation_events` |
| Treatment Acceptance | 20% | `treatment_acceptance_predictions` |
| Referrals | 15% | `referral_tracking` |
| Membership | 15% | `membership_tracking` |
| Recall | 15% | `recall_tracking` |
| New Patients | 10% | `new_patient_leads` |
| Revenue Growth | 5% | `revenue_attribution_records` |

---

## 10. Security Boundaries

- All API routes protected by Supabase Auth JWT
- RLS policies on all tables enforce `organization_id` isolation
- `service_role` used only in server-side contexts
- Patient PHI never stored in platform tables
- All audit events are immutable and append-only

---

## 11. Canonical Source of Truth

This document supersedes any conflicting architecture descriptions in:
- Component-level PRDs
- Sprint planning artifacts
- Individual service READMEs

Any architectural changes must be reflected here before implementation.
