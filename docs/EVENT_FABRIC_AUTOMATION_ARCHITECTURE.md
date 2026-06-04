# Event Fabric Automation Architecture

## Overview

Event Fabric is the nervous system of Zenith Patient OS. Every automation starts from an event. No workflow executes, no ALICE decision fires, no communication delivers, and no revenue is attributed without a corresponding Event Fabric event. The Event Fabric provides the immutable audit backbone and the real-time trigger layer for the entire Zenith automation platform.

Events are dual-written to both `runtime_event_fabric_events` and `mission_control_events`, ensuring operational observability and immutable audit history are maintained simultaneously.

---

## Event Flow Diagram

```
Patient Action / PMS Trigger / Webhook
              ↓
  Event Fabric (publishRuntimeFabricEvent)
              ↓
  ┌─────────────────────────────────────┐
  │  runtime_event_fabric_events        │  ← immutable audit log
  │  mission_control_events             │  ← operational observability
  └─────────────────────────────────────┘
              ↓
  Automation Platform (executeWorkflow)
  triggered by event subscription
              ↓
  ALICE Decision Engine
  reads event context → generates recommendation
              ↓
  Communication Hub (deliverMessage → correct adapter)
              ↓
  ┌──────────────────────────────────────────────────┐
  │  SMS      Email    WhatsApp   Video   Voice   Portal │
  │ Adapter   Adapter   Adapter  Adapter Adapter  Adapter │
  └──────────────────────────────────────────────────┘
              ↓
  Engagement Event
  (video.watched, sms.replied, link.clicked, etc.)
              ↓
  Practice Memory Graph (recordMemory)
              ↓
  Revenue Attribution (if conversion event)
```

---

## Canonical Event Catalogue

### Patient OS Events

| Event Key | Description | Trigger Source |
|-----------|-------------|---------------|
| `appointment.created` | New appointment booked | PMS sync / booking widget |
| `appointment.completed` | Appointment marked complete | PMS sync |
| `treatment.proposed` | Treatment plan created or presented | PMS sync / ALICE |
| `treatment.accepted` | Patient accepted treatment plan | PMS sync / portal |
| `treatment.declined` | Patient declined treatment plan | PMS sync / portal |

### Video Events

| Event Key | Description |
|-----------|-------------|
| `video.delivered` | Video message sent to patient |
| `video.started` | Patient opened and started video |
| `video.completed` | Patient watched full video |
| `video.cta_clicked` | Patient clicked CTA inside video |

### Journey Events

| Event Key | Description |
|-----------|-------------|
| `journey.started` | Patient journey instance initiated |
| `journey.step_completed` | Individual journey step completed |
| `journey.completed` | Full journey sequence finished |

### Influence & Intelligence Events

| Event Key | Description |
|-----------|-------------|
| `influence.score.calculated` | Patient influence score computed |
| `intent.score.updated` | Patient intent score updated |

### ALICE Events

| Event Key | Description |
|-----------|-------------|
| `alice.recommendation.created` | ALICE generated a decision recommendation |
| `alice.recommendation.actioned` | Recommendation was acted on (or dismissed) |

### Growth Events

| Event Key | Description |
|-----------|-------------|
| `reputation.review.received` | New patient review received |
| `referral.converted` | Referred patient completed appointment |
| `membership.enrolled` | Patient enrolled in membership plan |
| `recall.patient.recovered` | Lapsed patient returned via recall sequence |
| `lead.converted` | New patient lead converted to booked appointment |

### Revenue Events

| Event Key | Description |
|-----------|-------------|
| `revenue.attributed` | Revenue linked to a specific workflow or touchpoint |
| `workflow.revenue.captured` | Workflow-level revenue capture confirmed |

### System Events

| Event Key | Description |
|-----------|-------------|
| `workflow.started` | Automation Platform execution begun |
| `workflow.completed` | Automation Platform execution completed successfully |
| `workflow.failed` | Automation Platform execution failed |
| `workflow.dead_lettered` | Workflow exceeded max retries → DLQ |

---

## Event Envelope Structure

Every Event Fabric event conforms to the following envelope:

```typescript
{
  id: string;                    // UUID — unique per event
  eventKey: string;              // e.g. "appointment.created"
  eventType: EventType;          // enum (see below)
  sourceSystem: string;          // e.g. "pms_sync", "workflow_os", "alice"
  targetChannel?: string;        // e.g. "sms", "email", "whatsapp"
  priority: "low" | "normal" | "high" | "critical";
  summary: string;               // human-readable event description
  organizationId: string;        // tenant isolation key
  payload: Record<string, any>;  // event-specific data
  created_at: string;            // ISO 8601 timestamp
}
```

### eventType Enum Values

| Value | Usage |
|-------|-------|
| `PATIENT_EVENT` | Patient actions and clinical events |
| `WORKFLOW_TRIGGER` | Workflow lifecycle events |
| `INTELLIGENCE_UPDATE` | ALICE and influence score changes |
| `REVENUE_EVENT` | Revenue attribution and capture |
| `SYSTEM_EVENT` | Infrastructure and platform events |
| `AUDIT_EVENT` | Compliance and audit trail events |
| `GROWTH_EVENT` | Reputation, referral, recall, membership |

---

## Immutability Guarantee

Events in `runtime_event_fabric_events` are **never updated or deleted**. The audit trail is permanent. This guarantees:

- Full HIPAA-compliant audit history for all patient automation touchpoints
- Complete revenue attribution chain from trigger event to converted revenue
- Replay capability for any workflow that consumed an event
- Forensic debugging for any automation failure

---

## Replay Support

Events are queryable by `eventKey + organizationId + date range`, enabling targeted replay of any event stream. Use cases:

- Replay failed workflows after a bug fix
- Re-process a batch of patient events after a PMS sync failure
- Audit a specific patient's complete event history

Replay is implemented in `lib/workflow-os/workflow-replay.ts`.

---

## n8n Integration Point

The `n8nAdapter` in `lib/adapters/n8n-adapter.ts` can subscribe to Event Fabric events and forward them to configured n8n webhook endpoints. This is the bridge for external integrations:

```
Event Fabric event (e.g. appointment.completed)
        ↓
  n8nAdapter.forward(event)
        ↓
  n8n webhook → External CRM / Google Business Profile / Legacy API
```

This pattern keeps all internal logic inside Zenith while allowing external systems to react to Zenith events via n8n as a connector layer.

---

*Report generated: 2026-06-02 | Branch: release/platform-convergence*
