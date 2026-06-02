# Treatment Acceptance Engine — Full Specification

> **Platform Maturity Sprint — June 2026**
> Source: `lib/revenue-engine/treatment-acceptance.ts`

---

## Overview

The Treatment Acceptance Engine follows up on unaccepted treatment plans to convert pending pipeline into scheduled appointments. The average dental practice has $40,000–$120,000 in unaccepted treatment plan value at any given time. Even a 15% improvement in acceptance rate generates significant incremental revenue.

---

## Trigger

| Property | Value |
|----------|-------|
| Workflow ID | `ai_followup_required` |
| Trigger Name | `treatment_plan_proposed` |
| Action Name | `schedule_followup` |
| Event Emission | `emitAutomationEvent()` → `lib/automation/runtime.ts` |
| Default Follow-Up Window | 7 days after treatment plan proposed |

---

## Payload Interface

```typescript
// lib/revenue-engine/treatment-acceptance.ts

export interface TreatmentAcceptancePayload {
  organizationId: string;
  patientId: string;
  treatmentPlanId?: string;
  estimatedValue: number;      // Dollar value of treatment plan
  treatmentType: string;       // e.g., "crown", "implant", "Invisalign"
  proposedAt: string;          // ISO date treatment plan was presented
  followUpDays?: number;       // Days until first follow-up (default: 7)
}
```

---

## Data Flow

```
Treatment Plan Proposed in PMS / Clinical Workflow
        ↓
triggerTreatmentFollowUp(TreatmentAcceptancePayload)
        ↓
emitAutomationEvent(workflowId: "ai_followup_required")
        ↓
Event stored in automation_events
        ↓
n8n: Schedule Follow-Up at T+7 days
        ↓
Step 1: Personalized Follow-Up Message (SMS/Email)
   "Your treatment plan for [type] is ready — any questions?"
        ↓
Step 2: Financing Reminder (T+14 if no response)
   "Did you know we offer 0% financing through CareCredit?"
        ↓
Step 3: Scheduling Prompt (T+21)
   "We have openings next week — ready to get started?"
        ↓
[Accepted] ──→ Appointment Scheduled
        ↓
revenue_recovery_events.outcome = 'accepted'
revenue_recovery_events.amount_recovered = estimatedValue
        ↓
Revenue Attribution
```

---

## Metrics Interface

```typescript
export interface TreatmentAcceptanceMetrics {
  totalProposed: number;         // All treatment plan proposals
  totalAccepted: number;         // outcome = 'accepted' OR status = 'completed'
  acceptanceRate: number;        // totalAccepted / totalProposed
  estimatedPipelineValue: number; // Sum of metadata.estimated_value
  recoveredValue: number;        // Sum of amount_recovered on accepted plans
}
```

---

## Database Tables

### `revenue_recovery_events`

Primary table for treatment acceptance tracking:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK (RLS enforced) |
| `recovery_type` | `text` | `'treatment_acceptance'` |
| `amount_recovered` | `numeric` | Dollar value on conversion |
| `status` | `text` | `pending`, `in_progress`, `completed`, `failed` |
| `outcome` | `text` | `accepted`, `declined`, `pending` |
| `metadata` | `jsonb` | `{ estimated_value, treatment_type, treatment_plan_id, follow_up_days }` |
| `workflow_execution_id` | `uuid` | FK → `workflow_executions.id` |
| `deleted_at` | `timestamptz` | Soft delete for RLS |

### `workflow_executions`

Written non-blocking on each trigger for attribution tracking.

---

## Evidence Layer

| Evidence Key | Written When | Status |
|---|---|---|
| `followup_sent` | Initial follow-up message delivered | ⚠️ Pending n8n |
| `financing_info_sent` | Financing reminder delivered | ⚠️ Planned |
| `scheduling_prompt_sent` | Final scheduling prompt delivered | ⚠️ Planned |
| `treatment_accepted` | Patient confirms acceptance | ⚠️ Pending |

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/dental/revenue-summary` | POST | Aggregates all revenue engine metrics including treatment acceptance |

Treatment acceptance metrics also available via:
```typescript
import { getAcceptanceMetrics } from "@/lib/revenue-engine/treatment-acceptance";
const metrics = await getAcceptanceMetrics(organizationId);
```

---

## Revenue Attribution

```sql
-- Treatment acceptance revenue attribution
SELECT
  id,
  recovery_type,
  amount_recovered,
  outcome,
  metadata->>'estimated_value' AS estimated_pipeline_value
FROM revenue_recovery_events
WHERE organization_id = :org_id
  AND recovery_type = 'treatment_acceptance'
  AND deleted_at IS NULL;
```

Pipeline value vs recovered value:
- `estimatedPipelineValue` = total value of all proposed plans (from `metadata.estimated_value`)
- `recoveredValue` = total of `amount_recovered` on accepted plans only
- Attribution gap = unaccepted plan value (active opportunity)

---

## ALICE Integration (Planned)

ALICE `revenue_analyst` agent will:
1. Score each unaccepted treatment plan by patient lifetime value × plan complexity × days elapsed
2. Rank outreach priority queue
3. Recommend follow-up messaging tone (informational vs urgency)
4. Write confidence score to event metadata

---

## Benchmarks

| Metric | Industry Average | Zenith Target |
|--------|-----------------|---------------|
| Treatment acceptance rate | 60–65% | 75%+ |
| Average days to follow up | 14–21 days | 7 days |
| Financing offer conversion | 8–12% | 15% |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
