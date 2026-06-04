# No-Show Prevention Engine — Full Specification

> **Platform Maturity Sprint — June 2026**
> Source: `lib/revenue-engine/no-show-prevention.ts`

---

## Overview

The No-Show Prevention Engine fires on every appointment scheduling event and orchestrates a multi-step reminder sequence (T-48h, T-24h, T-2h) to maximize confirmed attendance. Industry data shows 15–25% no-show rates cost an average practice $150–$300K/year. A 50% reduction in no-shows at $250/appointment yields meaningful protected revenue.

---

## Trigger

| Property | Value |
|----------|-------|
| Workflow ID | `appointment_no_show` |
| Trigger Name | `appointment_scheduled` |
| Action Name | `send_reminders` |
| Event Emission | `emitAutomationEvent()` → `lib/automation/runtime.ts` |

---

## Payload Interface

```typescript
// lib/revenue-engine/no-show-prevention.ts

export interface NoShowPreventionPayload {
  organizationId: string;
  patientId: string;
  appointmentId: string;
  scheduledAt: string;        // ISO date-time of appointment
  patientName: string;
  patientPhone?: string;      // Required for SMS reminders
  patientEmail?: string;      // Required for email reminders
  providerName?: string;
  appointmentType?: string;   // e.g., "cleaning", "crown"
}
```

---

## Reminder Sequence

```
Appointment Scheduled
        ↓
T-48h: First Reminder (SMS + Email)
        ↓
T-24h: Second Reminder (SMS) + Confirmation Request
        ↓
T-2h:  Final Reminder (SMS) — "We'll see you today!"
        ↓
[Confirmed] ─────→ No further action
        ↓
[No Response] ──→ Escalation (phone call attempt)
        ↓
[No-Show] ──────→ Reactivation workflow trigger
```

---

## Data Flow

```
PMS: New Appointment Created
    ↓
triggerNoShowPrevention(NoShowPreventionPayload)
    ↓
emitAutomationEvent() → automation_events table
    ↓
n8n Workflow: reminder schedule set (T-48h, T-24h, T-2h)
    ↓
SMS/Email sent via configured channel provider
    ↓
Delivery receipt → workflow_execution_evidence (pending)
    ↓
Patient Confirms → appointment_confirmed = true
    ↓
Revenue Protection tracked: preventedNoShows × $250
```

---

## Metrics Interface

```typescript
export interface NoShowMetrics {
  totalAppointments: number;
  noShows: number;
  noShowRate: number;            // noShows / totalAppointments
  preventedNoShows: number;      // completed automation events
  estimatedRevenueProtected: number; // preventedNoShows × 250
}
```

Revenue protection formula:
```
estimatedRevenueProtected = preventedNoShows × avgAppointmentValue
avgAppointmentValue = $250 (configurable)
```

---

## Database Tables

### `automation_events`

Queried for no-show metrics:

```typescript
.from("automation_events")
.eq("organization_id", organizationId)
.eq("workflow", "appointment_no_show")
```

| Column | Description |
|--------|-------------|
| `id` | UUID primary key |
| `organization_id` | Tenant FK (RLS) |
| `workflow` | `appointment_no_show` |
| `status` | `completed` (confirmed), `failed` (no-show) |
| `event_metadata` | Appointment context, patient info |
| `created_at` | Event timestamp |

### `workflow_executions`

Written non-blocking on each trigger:

```typescript
.from("workflow_executions").insert({
  organization_id: payload.organizationId,
  workflow_id: "revenue_engine",
  trigger_name: "revenue_engine_trigger",
  status: "completed",
  execution_context: { source: "revenue_engine", correlationId }
})
```

---

## Evidence Layer

| Evidence Key | Written When | Status |
|---|---|---|
| `sms_delivered` | n8n SMS delivery receipt | ⚠️ Pending n8n config |
| `email_delivered` | Email open/click confirmation | ⚠️ Pending n8n config |
| `appointment_confirmed` | Patient confirms via reply / link | ⚠️ Pending |
| `reminder_sequence_completed` | All three reminders sent | ⚠️ Pending |

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/dental/revenue-summary` | POST | Aggregates all engine metrics including no-show prevention |

No-show metrics also available via the `getNoShowMetrics(organizationId)` server function.

---

## Revenue Attribution

No-Show Prevention uses protection (avoided loss) accounting rather than recovery accounting:

```
Revenue Protected = prevented_no_shows × avg_appointment_value
Measurement: automation_events.status = 'completed' = "prevented"
```

This is a conservative estimate. True attribution would require:
1. Comparing no-show rate pre-automation vs post-automation
2. Controlling for patient mix changes

---

## PMS Integration Dependency

| Requirement | Status |
|-------------|--------|
| Real-time appointment feed | ⚠️ Open Dental pilot only |
| Appointment cancellation webhook | ⚠️ Not yet implemented |
| Patient phone/email from PMS | ⚠️ Manual payload today |

---

## Escalation Path (Planned)

When a patient has not confirmed within 4 hours of T-24h reminder:
1. Mark `escalation_needed = true` in event metadata
2. Trigger outbound call attempt via configured VOIP integration
3. If still no response at T-2h: notify front desk via Executive Dashboard alert

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
