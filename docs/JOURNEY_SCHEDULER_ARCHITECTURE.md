# Journey Scheduler Architecture

> Wiring `journey_step_definitions.delay_days` to real-time execution via the Workflow OS.

---

## Problem Statement

The platform's journey step definitions include a `delay_days` column that specifies when each step should fire relative to journey assignment. Prior to Phase 5, this value existed in the schema but no scheduler was computing `scheduledFor` timestamps or executing due steps. Journey steps were defined but never delivered.

---

## Solution

**File**: `lib/journey-scheduler/index.ts`

Two primary functions handle the full scheduling lifecycle:

### `scheduleJourneySteps(orgId, assignmentId)`

Reads all `journey_step_definitions` for the assignment's journey type, computes a `scheduledFor` timestamp for each step, and upserts records into `journey_scheduled_steps`.

**Computation**:
```
scheduledFor = assignment.started_at + (delay_days × 86_400_000 ms)
```

- `assignment.started_at`: ISO timestamp from `journey_assignments.started_at`
- `delay_days`: integer from `journey_step_definitions.delay_days`
- `86_400_000`: milliseconds per day (1000 × 60 × 60 × 24)

**Behavior**:
- Uses upsert (conflict on `assignment_id + step_id`) so re-scheduling is safe
- Sets initial `status = 'pending'`
- Preserves existing `status` for already-delivered steps (no regression)

---

### `executeScheduledSteps(orgId)`

Queries all due steps and fires them via the Communication Hub.

**Query**:
```sql
SELECT * FROM journey_scheduled_steps
WHERE organization_id = $1
  AND status = 'pending'
  AND scheduled_for <= now()
ORDER BY scheduled_for ASC
```

**Execution flow**:
1. Fetch due steps
2. For each step: emit event `journey.step.executing`
3. Call Communication Hub adapter (SMS, Email, or Video based on `step_type`)
4. On success: update `status = 'delivered'`, set `delivered_at = now()`
5. Emit event `journey.step.delivered`
6. On failure: increment `retry_count`, update `status = 'failed'` if `retry_count >= 3`

---

## `journey_scheduled_steps` Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Tenant isolation |
| `assignment_id` | uuid | FK → journey_assignments.id |
| `step_id` | uuid | FK → journey_step_definitions.id |
| `scheduled_for` | timestamptz | Computed: started_at + delay_days |
| `status` | text | pending \| delivered \| failed \| skipped |
| `retry_count` | int | Number of execution attempts (max 3) |

---

## Integration with Workflow OS

The scheduler integrates with `lib/workflow-os/execution/execution-scheduler.ts` for delayed and recurring job management.

**Interface**:
```typescript
scheduleWorkflow(req: ScheduleRequest): Promise<WorkflowScheduleResult>
```

**Usage for delayed step execution**:
```typescript
await scheduleWorkflow({
  workflowType: 'journey_step_execution',
  organizationId: orgId,
  mode: 'delayed',
  delayMs: step.scheduledFor.getTime() - Date.now(),
  payload: { stepId: step.id, assignmentId: step.assignment_id }
})
```

The Workflow OS manages the queue, persistence, and DLQ — the journey scheduler does not need to maintain its own timer infrastructure.

---

## Events

| Event Name | Emitted When | Payload |
|------------|-------------|---------|
| `journey.step.executing` | Step execution begins | `{ stepId, assignmentId, orgId, scheduledFor }` |
| `journey.step.delivered` | Step delivered successfully | `{ stepId, assignmentId, orgId, deliveredAt, channel }` |
| `journey.step.failed` | Step failed after max retries | `{ stepId, assignmentId, orgId, retryCount, error }` |

Events are emitted via the Event Fabric (`lib/event-fabric/`) and consumed by:
- ALICE Learning Loop (detects patient engagement post-delivery)
- Pilot Health Monitor (updates pilot_health_events)
- Revenue Attribution Engine (links engagement to attribution)

---

## Retry Policy

Failed steps use the Workflow OS Dead Letter Queue (DLQ):

| Retry # | Delay | Action |
|---------|-------|--------|
| 1 | 5 minutes | Retry via Workflow OS |
| 2 | 30 minutes | Retry via Workflow OS |
| 3 | 2 hours | Final attempt |
| > 3 | — | Mark `status = 'failed'`, alert CSM via agent_recommendations |

Steps that fail due to missing communication credentials (Twilio/Resend not configured) are held in `pending` state and do not consume retry budget — they execute once credentials are added.

---

## Monitoring

### API Endpoint

```
GET /api/pilot?organizationId={orgId}
```

Response includes:
```json
{
  "journey_health": {
    "scheduled_steps_due": 0,
    "steps_delivered_mtd": 14,
    "steps_failed": 1,
    "active_assignments": 3
  }
}
```

`scheduled_steps_due > 0` indicates steps that should have fired but have not — requires immediate investigation.

### Manual Trigger (for CSMs)

```
POST /api/pilot
{
  "action": "schedule_journey_steps",
  "organizationId": "...",
  "assignmentId": "..."
}
```

### Execute Due Steps (for engineers)

```
POST /api/pilot
{
  "action": "execute_due_steps",
  "organizationId": "..."
}
```

---

## Journey Types and Typical Step Delays

| Journey Type | Step | delay_days | Channel |
|-------------|------|-----------|---------|
| new_patient | Welcome message | 0 | SMS + Email |
| new_patient | Post-visit follow-up | 1 | SMS |
| new_patient | Review request | 3 | Email |
| recall | Recall reminder 1 | 0 | Email |
| recall | Recall reminder 2 | 7 | SMS |
| recall | Final recall | 14 | SMS + Email |
| no_show_recovery | Rebooking prompt | 0 | SMS |
| no_show_recovery | Second attempt | 2 | Email |

---

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `scheduled_steps_due > 0` at Day 7+ | executeScheduledSteps not running | Trigger manually or check Workflow OS cron |
| All steps status = 'pending' | Communications not configured | Add Twilio/Resend credentials |
| Steps delivered but no engagement | Patient phone/email incorrect | Verify PMS sync data quality |
| Steps stuck in 'failed' | Provider API key invalid | Rotate key, clear DLQ |

---

## Related Documents

- `docs/PILOT_OPERATIONS_OS.md` — Mission Control overview
- `docs/GO_LIVE_RUNBOOK.md` — Day 3 and Day 7 journey activation steps
- `docs/30_DAY_ACTIVATION_PLAN.md` — Day 6–10 journey activation timeline
