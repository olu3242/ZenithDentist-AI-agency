# Recall Recovery Engine — Full Specification

> **Platform Maturity Sprint — June 2026**
> Source: `lib/dental-revenue-os/recall-recovery.ts`

---

## Overview

The Recall Recovery Engine identifies patients who are overdue for a hygiene or restorative recall visit and automatically initiates personalized outreach to bring them back. It is the highest-revenue automation in the platform, targeting the ~30–40% of active patients who lapse on recall in the average dental practice.

---

## Trigger

| Property | Value |
|----------|-------|
| Workflow ID | `recall_due` |
| Trigger Name | `recall_due` |
| Action Name | `prioritize_outreach` |
| Initiated By | `system` |
| Schedule | Nightly batch via `workflow-scheduler.ts` or on-demand via API |

---

## Data Flow

```
PMS Sync (Open Dental Adapter)
    ↓
Overdue Patient Detection (recall_due date < today)
    ↓
triggerRecallRecovery(organizationId, RecallData)
    ↓
executeWorkflow() → lib/workflow-os/workflow-engine.ts
    ↓
Workflow OS State Machine (registered → scheduled → executing)
    ↓
ALICE Prioritization (revenue_analyst agent scores patient value)
    ↓
Outreach Channel Selection (SMS / Email via outreach_channel field)
    ↓
n8n Delivery (webhook → configured n8n flow)
    ↓
Patient Booking (self-schedule link or call)
    ↓
Revenue Attribution
```

---

## Interface

```typescript
// lib/dental-revenue-os/recall-recovery.ts

export interface RecallData {
  patientId: string;
  recallType?: string;          // e.g., "hygiene", "restorative"
  outreachChannel?: string;     // "sms" | "email" | "phone"
  dueDate?: string;             // ISO date when recall was due
  metadata?: Record<string, unknown>;
}

export async function triggerRecallRecovery(
  organizationId: string,
  recallData: RecallData
): Promise<WorkflowExecutionResult>

export async function getRecallRecoveryMetrics(
  organizationId: string
): Promise<{ events: RecallEvent[]; total: number; booked: number }>
```

---

## Database Tables

### `recall_recovery_events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant scoping (RLS enforced) |
| `patient_id` | `uuid` | FK → `patients.id` (added in 202606010002) |
| `recall_type` | `text` | `hygiene`, `restorative`, etc. |
| `outreach_channel` | `text` | `sms`, `email`, `phone` |
| `appointment_booked` | `boolean` | Conversion flag |
| `revenue_attributed` | `numeric` | Dollar amount when booked |
| `status` | `text` | `pending`, `contacted`, `booked`, `lapsed` |
| `workflow_execution_id` | `uuid` | FK → `workflow_executions.id` |
| `created_at` | `timestamptz` | Event creation time |
| `deleted_at` | `timestamptz` | Soft delete |

### `workflow_executions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK |
| `workflow_id` | `text` | `recall_due` |
| `trigger_name` | `text` | `recall_due` |
| `patient_id` | `uuid` | FK → `patients.id` |
| `status` | `text` | State machine state |
| `started_at` | `timestamptz` | Execution start |
| `completed_at` | `timestamptz` | Completion time |

---

## Evidence Layer

Evidence rows to be written to `workflow_execution_evidence` per execution:

| Evidence Key | Written When | Status |
|---|---|---|
| `sms_delivered` | n8n confirms SMS delivery receipt | ⚠️ Pending n8n configuration |
| `email_delivered` | n8n confirms email open/click | ⚠️ Pending n8n configuration |
| `booking_confirmed` | Patient self-schedules via link | ⚠️ Pending booking webhook |
| `recall_overdue_days` | At trigger time from PMS data | ✅ In event metadata |

---

## Revenue Attribution

```sql
-- Via workflow_revenue_attribution VIEW (202606010002_revenue_attribution.sql)
SELECT
  we.id                                         AS execution_id,
  CASE WHEN rcre.appointment_booked THEN 1
       ELSE 0 END                               AS recall_booked,
  COALESCE(rre.amount_recovered, 0)             AS revenue_recovered
FROM workflow_executions we
LEFT JOIN recall_recovery_events rcre
  ON rcre.workflow_execution_id = we.id
WHERE we.workflow_id = 'recall_due'
  AND we.organization_id = :org_id;
```

Attribution chain:
1. `recall_recovery_events.appointment_booked = true`
2. `recall_recovery_events.revenue_attributed` set to appointment value
3. Record written to `revenue_attribution_records` (canonical immutable log)
4. Attribution appears in `workflow_revenue_attribution` VIEW under `recall_booked = 1`

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/dental/recall` | GET | Returns recall recovery metrics for authenticated org |

**Response shape:**
```json
{
  "events": [...],
  "total": 142,
  "booked": 38,
  "bookingRate": 0.267
}
```

---

## PMS Integration

| PMS | Status |
|-----|--------|
| Open Dental | ✅ Live adapter (`lib/integrations/pms/open-dental-adapter.ts`) |
| Dentrix | ⚠️ Framework stub (`lib/integrations/pms/dentrix-adapter.ts`) |
| Eaglesoft | ⚠️ Framework stub (`lib/integrations/pms/eaglesoft-adapter.ts`) |
| Denticon | ⚠️ Framework stub (`lib/integrations/pms/denticon-adapter.ts`) |

Real recall list population requires PMS sync via `lib/integrations/pms/adapter.ts` interface.

---

## Metrics Baseline (Industry)

| Metric | Industry Average | Target |
|--------|-----------------|--------|
| Recall reactivation rate | 15–25% | 35%+ |
| Avg revenue per reactivated patient | $250–$450 | $350 |
| Time from overdue to contact | 30–60 days | 7 days |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
