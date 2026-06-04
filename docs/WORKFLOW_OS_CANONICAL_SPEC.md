# Workflow OS — Canonical Specification

**Version:** 2.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

The Workflow OS is the execution backbone of the ZenithDentist platform. Every automated action — recall outreach, membership renewal, referral follow-up, ALICE intervention — is expressed as a Workflow OS workflow. This document defines the canonical structure, lifecycle, and operational requirements for all workflows.

---

## 2. Canonical Workflow Structure

Every workflow in the platform MUST implement all eight components:

| Component | Description |
|-----------|-------------|
| **Trigger** | The event or condition that initiates the workflow |
| **Condition** | Guard clauses that must pass before execution |
| **Action** | The steps executed when conditions are met |
| **Audit Trail** | Immutable log of all execution events |
| **Retry** | Configurable retry policy with backoff |
| **Failure Policy** | Behavior on exhausted retries |
| **DLQ** | Dead Letter Queue for unrecoverable failures |
| **Replay** | Ability to re-execute from a specific checkpoint |
| **Observability** | Metrics, traces, and alerts |

---

## 3. Workflow Lifecycle

```
PENDING → TRIGGERED → CONDITION_CHECK → EXECUTING → COMPLETED
                                      ↓
                               CONDITION_FAILED → SKIPPED
                                      ↓
                               ACTION_FAILED → RETRY
                                             → DLQ (if retries exhausted)
```

### State Definitions

| State | Description |
|-------|-------------|
| `PENDING` | Workflow created, not yet triggered |
| `TRIGGERED` | Trigger event received |
| `CONDITION_CHECK` | Evaluating guard conditions |
| `CONDITION_FAILED` | One or more conditions not met; workflow skipped |
| `EXECUTING` | Action steps in progress |
| `COMPLETED` | All steps completed successfully |
| `RETRY` | Action failed, waiting for retry |
| `DLQ` | Moved to dead letter queue after retry exhaustion |
| `REPLAYING` | Being re-executed from checkpoint |

---

## 4. Trigger Types

| Trigger Type | Description | Example |
|-------------|-------------|---------|
| `event` | Platform event from Event Fabric | `patient.appointment.completed` |
| `schedule` | Cron-based time trigger | Daily 9 AM recall sweep |
| `signal` | External signal from PMS integration | New appointment booked |
| `manual` | Staff-initiated from Mission Control | Manual recall trigger |
| `threshold` | Metric crosses a threshold | Growth Score drops below 40 |
| `chain` | Output of another workflow | Post-recall follow-up |

---

## 5. Condition Evaluation

Conditions are evaluated as a logical AND of all guards. Any failing guard short-circuits execution.

### Standard Condition Types

| Condition Type | Example |
|---------------|---------|
| `patient_eligible` | Patient not already in active recall journey |
| `practice_active` | Practice subscription active |
| `channel_available` | SMS/email channel enabled for patient |
| `cooldown_elapsed` | Minimum time since last outreach |
| `score_threshold` | Influence score meets minimum |
| `business_hours` | Current time within configured send window |

### Condition Schema

```json
{
  "conditions": [
    {
      "type": "cooldown_elapsed",
      "params": { "min_hours": 72 },
      "on_failure": "skip"
    },
    {
      "type": "patient_eligible",
      "params": { "check": "no_active_recall_journey" },
      "on_failure": "skip"
    }
  ],
  "logic": "AND"
}
```

---

## 6. Action Steps

Actions are executed sequentially. Each step can be configured with its own retry and failure policy.

### Step Types

| Step Type | Description |
|-----------|-------------|
| `send_message` | Send SMS, email, or in-app message |
| `create_journey` | Assign patient to a journey |
| `update_record` | Write to a platform table |
| `call_intelligence` | Invoke ALICE or a scoring engine |
| `emit_event` | Publish an event to Event Fabric |
| `notify_staff` | Send Mission Control notification |
| `wait` | Pause execution for a duration |
| `branch` | Conditional branch based on runtime data |

### Action Schema

```json
{
  "steps": [
    {
      "id": "step_1",
      "type": "call_intelligence",
      "config": { "engine": "alice", "decision_type": "recall_message_personalization" },
      "retry": { "max_attempts": 3, "backoff_ms": 1000 }
    },
    {
      "id": "step_2",
      "type": "send_message",
      "depends_on": ["step_1"],
      "config": { "channel": "auto", "template": "recall_v2" }
    },
    {
      "id": "step_3",
      "type": "emit_event",
      "depends_on": ["step_2"],
      "config": { "event_type": "recall.outreach.sent" }
    }
  ]
}
```

---

## 7. Retry Policy

| Parameter | Description | Default |
|-----------|-------------|---------|
| `max_attempts` | Maximum number of retry attempts | 3 |
| `backoff_strategy` | `linear`, `exponential`, `fixed` | `exponential` |
| `initial_delay_ms` | Initial retry delay | 1000 |
| `max_delay_ms` | Maximum retry delay cap | 60000 |
| `retryable_errors` | Error types eligible for retry | network, timeout |

```json
{
  "retry": {
    "max_attempts": 3,
    "backoff_strategy": "exponential",
    "initial_delay_ms": 1000,
    "max_delay_ms": 30000,
    "retryable_errors": ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMITED"]
  }
}
```

---

## 8. Failure Policy

Applied after retry exhaustion:

| Policy | Behavior |
|--------|---------|
| `dlq` | Move to Dead Letter Queue for manual review |
| `skip` | Silently discard and continue |
| `alert` | Move to DLQ and fire an alert |
| `compensate` | Execute a compensation workflow |

---

## 9. Dead Letter Queue (DLQ)

### DLQ Record Schema

```json
{
  "dlq_id": "uuid",
  "organization_id": "uuid",
  "workflow_id": "uuid",
  "workflow_type": "string",
  "failed_step": "string",
  "error_code": "string",
  "error_message": "string",
  "payload": "jsonb",
  "retry_count": "integer",
  "enqueued_at": "timestamptz",
  "resolved_at": "timestamptz",
  "resolution_action": "replayed | discarded | manually_resolved"
}
```

### DLQ Management

- DLQ items appear in Mission Control's Operations Center.
- Staff may replay, discard, or manually resolve DLQ items.
- DLQ items older than 7 days are escalated to Operations Lead.

---

## 10. Replay Capability

Any completed or DLQ workflow may be replayed:

- **Full Replay** — Re-execute from the first trigger.
- **Checkpoint Replay** — Resume from a specific step, preserving prior step outputs.

Replay events are tagged with `replay: true` and `original_workflow_id` in the event metadata to prevent double-counting in analytics.

---

## 11. Audit Trail

Every workflow execution produces an immutable audit trail written to both Event Fabric tables:

| Event | Captured |
|-------|---------|
| Workflow triggered | Trigger source, payload |
| Condition evaluated | Condition type, result, data |
| Step started | Step ID, inputs |
| Step completed | Step ID, outputs, duration |
| Step failed | Step ID, error, retry count |
| Retry scheduled | Delay, attempt number |
| DLQ enqueued | Error details |
| Workflow completed | Total duration, step count |

---

## 12. Observability

### Metrics (per workflow type)

| Metric | Description |
|--------|-------------|
| `workflow.started` | Count of started executions |
| `workflow.completed` | Count of successful completions |
| `workflow.failed` | Count of DLQ entries |
| `workflow.condition_failed` | Count of skipped (condition not met) |
| `workflow.duration_ms` | Execution time histogram |
| `workflow.retry_count` | Retry attempt distribution |

### Alerting Rules

| Condition | Alert |
|-----------|-------|
| DLQ rate > 5% in 5 min | P2 alert |
| p99 duration > 10s | P3 alert |
| Workflow backlog > 1000 | P2 alert |

---

## 13. Canonical Workflow Registry

All production workflows must be registered in the Workflow Registry with:
- Unique workflow type identifier
- Owner team
- Trigger definition
- SLA expectations
- Runbook link

Unregistered workflows may not be deployed to production.
