# Event Fabric Governance

**Document Type:** Canonical Governance Reference
**Platform:** Zenith Patient OS
**Last Updated:** 2026-06-02
**Status:** ACTIVE — governs all platform events

---

## 1. Immutability Principle

> **All events are immutable once written. No updates or deletes are permitted.**

The Event Fabric is the platform's central nervous system. Every significant state change — patient actions, ALICE decisions, workflow executions, revenue attributions, growth events — produces an immutable event record. This immutability is the foundation of:

- Complete platform audit trail
- Reliable replay capability
- Tamper-evident compliance logging
- Deterministic workflow re-execution

Any code path that attempts to UPDATE or DELETE records from `runtime_event_fabric_events` or `mission_control_events` is a governance violation and must be blocked by RLS policy.

---

## 2. Required Event Fields

Every event written to the Event Fabric must include all of the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `uuid` | YES | Auto-generated unique event identifier |
| `eventKey` | `string` | YES | Dot-notation event identifier (see naming convention) |
| `eventType` | `RuntimeFabricEventType` | YES | Enum — classifies the event category |
| `sourceSystem` | `string` | YES | Which module/service emitted the event |
| `targetChannel` | `string` | NO | Intended delivery channel if applicable |
| `priority` | `RuntimeFabricPriority` | YES | Processing priority |
| `summary` | `string` | YES | Human-readable description (non-PHI) |
| `organizationId` | `uuid` | YES | Tenant identifier — mandatory on every event |
| `payload` | `jsonb` | YES | Structured event data (see PHI policy) |
| `created_at` | `timestamptz` | YES | Auto-set at insert time — never overridden |
| `correlationId` | `uuid` | NO | Trace ID for multi-step workflow correlation |

---

## 3. eventKey Naming Convention

All event keys follow the pattern: `<domain>.<entity>.<action>`

### Rules
- Lowercase only, dot-separated
- Domain: top-level platform module
- Entity: the object being acted upon
- Action: past-tense verb describing what happened

### Canonical Event Key Registry

| Domain | Entity | Action | Full Key |
|---|---|---|---|
| patient | profile | created | `patient.profile.created` |
| patient | profile | updated | `patient.profile.updated` |
| patient | influence | calculated | `patient.influence.calculated` |
| patient | influence | high_threshold_reached | `patient.influence.high_threshold_reached` |
| appointment | visit | completed | `appointment.visit.completed` |
| appointment | visit | noshow | `appointment.visit.noshow` |
| appointment | visit | cancelled | `appointment.visit.cancelled` |
| journey | step | started | `journey.step.started` |
| journey | step | completed | `journey.step.completed` |
| journey | step | failed | `journey.step.failed` |
| alice | recommendation | created | `alice.recommendation.created` |
| alice | decision | executed | `alice.decision.executed` |
| alice | fallback | activated | `alice.fallback.activated` |
| workflow | execution | started | `workflow.execution.started` |
| workflow | execution | completed | `workflow.execution.completed` |
| workflow | execution | failed | `workflow.execution.failed` |
| workflow | execution | dlq | `workflow.execution.dlq` |
| revenue | attribution | recorded | `revenue.attribution.recorded` |
| growth | score | calculated | `growth.score.calculated` |
| growth | engine | triggered | `growth.engine.triggered` |
| avatar | video | delivered | `avatar.video.delivered` |
| avatar | profile | created | `avatar.profile.created` |
| avatar | profile | suspended | `avatar.profile.suspended` |
| memory | record | created | `memory.record.created` |
| system | health | alert | `system.health.alert` |
| audit | access | logged | `audit.access.logged` |

---

## 4. eventType Enum Values

| Value | Description | Examples |
|---|---|---|
| `PATIENT_EVENT` | Events relating to patient actions or state changes | profile created, appointment completed, influence calculated |
| `WORKFLOW_TRIGGER` | Events that initiate or advance a workflow | recall trigger fired, journey step started |
| `INTELLIGENCE_UPDATE` | ALICE decisions, memory updates, score changes | recommendation created, influence score updated |
| `REVENUE_EVENT` | Revenue attribution records, financial triggers | attribution recorded, no-show prevented |
| `SYSTEM_EVENT` | Platform health, infrastructure events | health alert, deployment event |
| `AUDIT_EVENT` | Access logs, compliance events, governance actions | data accessed, policy override attempted |
| `GROWTH_EVENT` | Growth Score updates, growth engine activations | score calculated, engine triggered |

---

## 5. priority Enum Values

| Value | Description | SLA | Executive Dashboard |
|---|---|---|---|
| `CRITICAL` | Platform health, security events, data integrity | Process within 60s | Real-time alert |
| `HIGH` | Patient safety, urgent communications, DLQ entries | Process within 5 min | Real-time subscription |
| `NORMAL` | Standard workflows, routine communications | Process within 60 min | Batched display |
| `LOW` | Analytics, reporting, background enrichment | Process within 4 hours | Daily summary |

---

## 6. Dual-Write Pattern

All events must be written to **both** tables simultaneously:

```
runtime_event_fabric_events  ← operational events (active processing)
mission_control_events        ← mission control display and monitoring
```

The dual-write must be atomic — either both writes succeed or neither does. If only one table receives the event, the platform is in an inconsistent state.

**Implementation requirement:** Use a database transaction or a single function that writes to both tables. Do not write to one table and then the other in separate operations.

---

## 7. Tenant Isolation

- Every event **must** include `organizationId`
- Events may not be queried across organizations — all queries must include `organization_id` filter
- RLS policies on both event tables enforce row-level tenant isolation
- `platform_admin` and `super_admin` roles may query across organizations for monitoring purposes only
- Cross-tenant event correlation is prohibited

---

## 8. PHI Policy for Event Payloads

Event payloads must **never** contain:

| Prohibited | Use Instead |
|---|---|
| Patient name (first, last) | `patient_external_id` |
| Date of birth | Age bucket if needed: "35-44" |
| Social Security Number | N/A — never stored in platform |
| Insurance ID / member ID | N/A — never stored in platform |
| Full address | Practice region identifier |
| Phone number | `patient_external_id` |
| Email address | `patient_external_id` |
| Clinical notes / diagnoses | Coded reference: `treatment_code` |

**Validation requirement:** Event payload schemas must be validated at write time against a PHI-exclusion allowlist. Any field name matching: `name`, `email`, `phone`, `dob`, `ssn`, `address`, `insurance_id` should be rejected.

---

## 9. Correlation IDs

For complex multi-step workflows, a `correlationId` must be set in the event payload:

- The first event in a workflow chain generates a new `correlationId` (uuid v4)
- All subsequent events in the same workflow chain include the same `correlationId`
- Enables full trace reconstruction: query all events with `payload->>'correlationId' = '<id>'`
- Required for: journey execution events, ALICE decision chains, DLQ replay sequences
- Optional for: standalone single-action events

---

## 10. Replay Support

Events are queryable for replay purposes with the following filters:

- `eventKey` — retrieve all events of a specific type
- `organizationId` — scoped to a specific practice
- `created_at` range — time-bounded replay window
- `correlationId` — retrieve all events in a workflow chain

**Replay authorization:** Requires `practice_manager` or above.

**Replay integrity:** Replayed events create new event records — the original events are never modified.

---

## 11. Retention Policy

| Retention Period | Scope | Reason |
|---|---|---|
| 90 days minimum | All events | Audit trail and workflow replay |
| 365 days | AUDIT_EVENT, REVENUE_EVENT | Compliance and financial records |
| 365 days | CRITICAL priority events | Incident investigation |
| 90 days | NORMAL and LOW priority | Operational requirement |

Automated archival jobs must run on a schedule to move events beyond retention windows to cold storage. Events must not be deleted from cold storage for 7 years (HIPAA).

---

## 12. Standard Events Catalogue

### Patient Domain

| Event Key | Type | Source | Description |
|---|---|---|---|
| `patient.profile.created` | PATIENT_EVENT | PatientOS | New patient profile created in platform |
| `patient.influence.calculated` | INTELLIGENCE_UPDATE | InfluenceEngine | Influence score recalculated after significant event |
| `appointment.visit.completed` | PATIENT_EVENT | AppointmentSync | Patient completed a dental visit |
| `appointment.visit.noshow` | PATIENT_EVENT | AppointmentSync | Patient did not show for scheduled appointment |

### ALICE Domain

| Event Key | Type | Source | Description |
|---|---|---|---|
| `alice.recommendation.created` | INTELLIGENCE_UPDATE | ALICE | ALICE generated a patient recommendation |
| `alice.decision.executed` | INTELLIGENCE_UPDATE | ALICE | An ALICE recommendation was actioned |
| `alice.fallback.activated` | INTELLIGENCE_UPDATE | ALICE | AI path failed; rule-based fallback used |

### Workflow Domain

| Event Key | Type | Source | Description |
|---|---|---|---|
| `workflow.execution.started` | WORKFLOW_TRIGGER | WorkflowOS | Workflow execution initiated |
| `workflow.execution.completed` | WORKFLOW_TRIGGER | WorkflowOS | Workflow execution completed successfully |
| `workflow.execution.dlq` | SYSTEM_EVENT | WorkflowOS | Workflow exhausted retries and entered DLQ |

### Revenue Domain

| Event Key | Type | Source | Description |
|---|---|---|---|
| `revenue.attribution.recorded` | REVENUE_EVENT | RevenueEngine | Revenue attributed to a platform touchpoint |
| `revenue.noshow.prevented` | REVENUE_EVENT | NoShowEngine | No-show prevention resulted in kept appointment |

### Growth Domain

| Event Key | Type | Source | Description |
|---|---|---|---|
| `growth.score.calculated` | GROWTH_EVENT | GrowthOS | Practice Growth Score recalculated |
| `growth.engine.triggered` | GROWTH_EVENT | GrowthOS | A growth automation engine fired |

### Avatar Domain

| Event Key | Type | Source | Description |
|---|---|---|---|
| `avatar.video.delivered` | PATIENT_EVENT | DigitalDentistTwin | AI-generated video delivered to patient |
| `avatar.profile.suspended` | AUDIT_EVENT | DigitalDentistTwin | Provider avatar suspended |

---

## 13. Observability — Executive Dashboard

Executive Dashboard subscribes to the following event priority tiers in real-time:

- **CRITICAL:** Immediate push notification to all active `platform_admin` sessions
- **HIGH:** Real-time display in Executive Dashboard event feed (auto-refreshing)
- **NORMAL:** Surfaced in batched event stream, 60-second refresh
- **LOW:** Included in daily summary reports only

Executive Dashboard displays:
- Live event count by type (last 24h)
- DLQ entry count (requires immediate attention indicator)
- ALICE decision volume and fallback rate
- Revenue events per hour
- Workflow execution success rate

---

## 14. Governance Checklist

Before any new event type is introduced to the platform:

- [ ] Event key follows `<domain>.<entity>.<action>` naming convention
- [ ] eventType assigned from canonical enum
- [ ] Priority tier assigned and justified
- [ ] Payload schema defined with PHI exclusion validation
- [ ] Dual-write to both tables confirmed
- [ ] `organizationId` included on every write
- [ ] Added to this document's Standard Events Catalogue
- [ ] Retention period documented
- [ ] Replay tested
