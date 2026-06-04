# Workflow OS™ Governance

**Document Type:** Canonical Governance Reference
**Platform:** Zenith Patient OS™
**Last Updated:** 2026-06-02
**Status:** ACTIVE — governs all automation workflows

---

## 1. Governing Principle

> **No automation may execute outside Workflow OS™.**

Every automated action in the Zenith Patient OS™ platform — whether sending a message, triggering an ALICE decision, updating a score, or recording revenue — must be orchestrated through the Workflow OS™. Direct database mutations, side-effect API calls, or background jobs that bypass Workflow OS are prohibited in production.

This principle ensures:
- Every patient-facing action has a complete audit trail
- All automation is reversible via replay
- Failures are captured, queued, and recoverable
- Observability is universal across all workflows

---

## 2. Required Fields for Every Workflow Definition

Every workflow registered in the platform must declare all of the following fields before it may be activated:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Unique human-readable identifier |
| `trigger` | `WorkflowTrigger` | Event or schedule that initiates the workflow |
| `condition` | `WorkflowCondition` | Logical gate — workflow proceeds only if condition evaluates true |
| `action` | `WorkflowAction` | The operation(s) to execute |
| `retry_policy` | `RetryPolicy` | Backoff strategy and max attempt count |
| `failure_policy` | `FailurePolicy` | What happens after retry exhaustion |
| `dlq_config` | `DLQConfig` | Dead letter queue destination and alert thresholds |
| `observability_config` | `ObservabilityConfig` | Metrics, logging, and alerting configuration |

Workflows missing any of these fields must not be promoted to production.

---

## 3. Retry Policy Standard

All workflows follow exponential backoff with the following defaults:

```
Base delay:     2 seconds
Multiplier:     2x per attempt
Max retries:    3
Max delay:      30 seconds
Jitter:         enabled (±20% randomization to prevent thundering herd)
```

**Retry sequence:**
1. Attempt 1 — immediate
2. Attempt 2 — after 2s
3. Attempt 3 — after 4s
4. Attempt 4 — after 8s
5. → Dead Letter Queue

Retry policy may be tightened (fewer retries, shorter delays) for CRITICAL priority workflows. It must not be loosened beyond these defaults without documented justification.

---

## 4. Dead Letter Queue (DLQ)

Workflows that exhaust all retry attempts are moved to the Dead Letter Queue.

### DLQ Record Schema

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | DLQ record ID |
| `workflow_id` | `string` | Originating workflow name |
| `organization_id` | `uuid` | Tenant context |
| `original_payload` | `jsonb` | The full input payload at time of first attempt |
| `error` | `text` | Last error message |
| `retry_count` | `integer` | Number of attempts made |
| `failed_at` | `timestamptz` | Timestamp of final failure |
| `reviewed` | `boolean` | Whether a human has reviewed this record |
| `reviewed_by` | `uuid` | Staff member who reviewed |
| `reviewed_at` | `timestamptz` | Review timestamp |

### DLQ Review Process

1. DLQ entries surface in Workflow Command Center with CRITICAL alert
2. `practice_manager` or above must review within 24 hours
3. Reviewer may: (a) replay the workflow, (b) mark as resolved with note, (c) escalate to `platform_admin`
4. DLQ count is a monitored KPI — more than 5 unreviewed entries triggers platform alert

---

## 5. Replay Capability

Every workflow execution must be replayable. Replay requirements:

- **Full replay:** Re-execute the workflow from the beginning with the original payload
- **Step replay:** Re-execute from a specific step (for idempotent action steps)
- **Replay authorization:** Requires `practice_manager` role or above
- **Replay audit:** Every replay creates a new `workflow_executions` record with `replay_of` linking to the original execution ID
- **Idempotency:** All workflow actions must be idempotent — replaying must not double-send communications or double-record revenue

---

## 6. Audit Trail

Every workflow execution is recorded in `workflow_executions`. This table is append-only.

### workflow_executions Schema

| Field | Type | Description |
|---|---|---|
| `id` | `uuid` | Execution ID |
| `workflow_id` | `string` | Workflow name/identifier |
| `organization_id` | `uuid` | Tenant context |
| `status` | `enum` | pending, running, completed, failed, dlq |
| `trigger_payload` | `jsonb` | Input data that triggered this execution |
| `started_at` | `timestamptz` | Execution start time |
| `completed_at` | `timestamptz` | Execution completion time |
| `duration_ms` | `integer` | Total execution time in milliseconds |
| `error` | `text` | Error message if failed |
| `retry_count` | `integer` | Number of retries attempted |
| `replay_of` | `uuid` | Links to original execution if this is a replay |
| `step_log` | `jsonb[]` | Ordered log of each step's input, output, and status |

---

## 7. Workflow Authorization Levels

| Trigger Type | Minimum Authorization Required |
|---|---|
| Automated (event-driven, no human in loop) | `platform_admin` or `organization_owner` to configure the workflow definition |
| Manual trigger — patient-facing communication | `practice_manager` or above |
| Manual trigger — internal operations | `staff` or above |
| Workflow definition creation/edit | `organization_owner` or above |
| Workflow definition deletion | `super_admin` only |
| DLQ replay | `practice_manager` or above |
| Workflow pause/resume | `organization_owner` or above |

---

## 8. Patient OS Standard Workflows

The following workflows are canonical to the Patient OS™ and must be implemented, tested, and active before client go-live:

### 8.1 welcome_patient
| Field | Value |
|---|---|
| Trigger | `patient.profile.created` event |
| Condition | `patient.status == 'active'` |
| Action | Send welcome sequence via Digital Dentist Twin™; create journey record |
| Priority | NORMAL |

### 8.2 post_visit_checkin
| Field | Value |
|---|---|
| Trigger | `appointment.completed` event |
| Condition | `appointment.type != 'cancelled'` |
| Action | Trigger post-visit communication; log to practice memory |
| Priority | HIGH |

### 8.3 recall_30day
| Field | Value |
|---|---|
| Trigger | Scheduled — 30 days after last appointment |
| Condition | `patient.next_appointment == null AND influence.recall_recovery > 40` |
| Action | Send recall outreach via preferred channel |
| Priority | NORMAL |

### 8.4 recall_90day
| Field | Value |
|---|---|
| Trigger | Scheduled — 90 days after last appointment |
| Condition | `patient.next_appointment == null AND patient.status == 'active'` |
| Action | Escalate recall outreach; ALICE generates personalized message |
| Priority | HIGH |

### 8.5 review_request
| Field | Value |
|---|---|
| Trigger | `appointment.completed` event + 24h delay |
| Condition | `patient.influence.review_probability > 60` |
| Action | Send review request via Digital Dentist Twin™ |
| Priority | NORMAL |

### 8.6 referral_ask
| Field | Value |
|---|---|
| Trigger | `appointment.completed` event + 48h delay |
| Condition | `patient.influence.referral_probability > 65 AND patient.nps_score >= 8` |
| Action | Send referral ask with unique referral link |
| Priority | NORMAL |

### 8.7 membership_offer
| Field | Value |
|---|---|
| Trigger | `patient.influence.calculated` event |
| Condition | `patient.influence.membership_conversion > 70 AND patient.membership == null` |
| Action | ALICE generates membership offer; send via preferred channel |
| Priority | NORMAL |

### 8.8 treatment_followup
| Field | Value |
|---|---|
| Trigger | `treatment_plan.accepted` event |
| Condition | `treatment_plan.status == 'accepted' AND follow_up_sent == false` |
| Action | Schedule follow-up communication at day 3, day 7, day 14 |
| Priority | HIGH |

---

## 9. Workflow Performance SLAs

| Priority Tier | Maximum Execution Time | DLQ Alert Threshold |
|---|---|---|
| CRITICAL | 5 minutes | Immediate alert |
| HIGH (urgent) | 15 minutes | Alert after 30 min |
| NORMAL (standard) | 60 minutes | Alert after 2 hours |
| LOW | 4 hours | Alert after 8 hours |

Workflows that exceed their SLA trigger an observability alert in Workflow Command Center and are flagged in the daily platform health report.

---

## 10. Monitoring and Observability

The Workflow Command Center surfaces the following real-time metrics:

| Metric | Description | Alert Threshold |
|---|---|---|
| `success_rate` | % of executions completing without error | Alert if < 95% |
| `throughput` | Executions per minute | Alert if 0 for > 10 min |
| `dlq_count` | Unreviewed DLQ entries | Alert if > 5 |
| `avg_duration_ms` | Average execution time | Alert if > 2x SLA |
| `retry_rate` | % of executions requiring retry | Alert if > 10% |
| `p95_duration_ms` | 95th percentile execution time | Tracked for trending |

All metrics are segmented by `organization_id` and `workflow_id`.

---

## 11. Change Management

Changes to workflow definitions follow strict governance:

1. **Audit requirement:** Every workflow definition change must create an audit log entry with: `changed_by`, `changed_at`, `previous_definition` (snapshot), `new_definition` (snapshot), `reason`
2. **No live edits:** Running workflow executions must complete before the new definition takes effect — workflow versioning ensures in-flight executions use the version they started with
3. **Review requirement:** Changes to patient-facing workflows require review by `organization_owner` or above
4. **Testing requirement:** All workflow changes must be tested in staging before production promotion
5. **Rollback capability:** Previous workflow definition must be restorable within 1 hour of a change

---

## 12. Prohibited Patterns

The following patterns are explicitly prohibited and will fail validation:

| Prohibited Pattern | Reason |
|---|---|
| Workflows that modify clinical records | HIPAA — clinical data is owned by PMS |
| Workflows that bypass Event Fabric | Breaks audit trail and observability |
| Workflows without audit trail configuration | Violates core governance principle |
| Direct database mutations from workflow actions | Must go through service layer |
| Workflows that expose PHI in trigger payloads | PHI must never enter platform |
| Workflows that run without `organization_id` context | Violates tenant isolation |
| Infinite retry loops (retry_policy.max_retries > 10) | Platform stability risk |
| Workflows triggered by other workflows without Event Fabric | Creates invisible execution chains |

---

## 13. Workflow Governance Checklist

Before any new workflow is promoted to production, the following checklist must be completed:

- [ ] All required fields defined (Section 2)
- [ ] Retry policy configured to standard (Section 3)
- [ ] DLQ config defined with alert thresholds (Section 4)
- [ ] Replay tested — idempotency verified (Section 5)
- [ ] Audit trail confirmed writing to `workflow_executions` (Section 6)
- [ ] Authorization level documented (Section 7)
- [ ] SLA tier assigned (Section 9)
- [ ] Observability metrics verified in Workflow Command Center (Section 10)
- [ ] No prohibited patterns detected (Section 12)
- [ ] Staging test completed and signed off
