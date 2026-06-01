# Workflow Governance Playbook
## Zenith AI Dental Platform — Workflow OS Management v1.0

**Owner:** AI Operations Manager / Platform Admin  
**Review Cadence:** Monthly for active changes; quarterly for standing governance  
**Last Updated:** 2026-05-30

---

## Overview

This playbook governs how workflows are added, modified, deprecated, and recovered in the Zenith Workflow OS. The Workflow OS (`lib/workflow-os/`) is the operational execution layer — every patient interaction, revenue recovery action, and AI recommendation runs through it. Changes to workflows affect live tenant operations and must follow the process defined here.

---

## Workflow OS Architecture Reference

Key modules (for context in this playbook):

| Module | File | Purpose |
|---|---|---|
| Registry | `workflow-registry.ts` | Canonical list of all workflow definitions |
| Engine | `workflow-engine.ts` | Executes workflows, publishes events |
| State Machine | `workflow-state-machine.ts` | Enforces legal state transitions |
| Replay | `workflow-replay.ts` | Replays failed or stalled workflows |
| Versioning | `workflow-versioning.ts` | Manages SLA overrides per tenant |
| Scheduler | `workflow-scheduler.ts` | Dispatches scheduled runs |
| Analytics | `workflow-analytics.ts` | KPI and performance reporting |

All workflows begin life as an `AutomationBlueprint` in `lib/automation/registry.ts` and are wrapped into a `WorkflowDefinition` by `blueprintToWorkflow()` in the registry.

---

## Adding a New Workflow

Adding a workflow requires four steps: registry entry, blueprint definition, SLA configuration, and verification testing. Do not skip steps.

### Step 1: Define the Automation Blueprint

Add to `lib/automation/registry.ts`. Every blueprint must include:

```typescript
{
  id: "workflow_id",                    // snake_case, globally unique
  domain: "recall",                    // recall | scheduling | billing | front_office | marketing | lead_operations
  name: "Human Readable Name",
  description: "What this workflow does and why it matters.",
  triggers: ["event that starts this workflow"],
  emittedEvents: ["operational_events", "notification_events"],
  queueHandlers: ["ingestion.workflow_id"],
  actions: ["list of actions taken"],
  intelligenceOutputs: ["metrics ALICE uses for grounding"],
  aliceGroundingSurfaces: ["data ALICE references for this domain"],
  replayRequired: true,                // true for all patient-facing workflows
  retryEnabled: true,
  deadLetterRequired: true,            // true for all P0/P1 workflows
  slaMinutes: 30,                      // define based on patient impact
  requiredEnv: ["SUPABASE_SECRET_KEY"],
  observability: { tracing: true, metrics: true, logging: true, alerting: true }
}
```

**Mandatory for all new workflows:**
- `replayRequired: true` for any workflow that touches patient data
- `deadLetterRequired: true` for any workflow with SLA < 60 minutes
- `slaMinutes` must be reviewed and approved by the AI Operations Manager before release

### Step 2: Verify Registry Inclusion

The `getActiveWorkflows()` function in `workflow-registry.ts` reads from `automationRegistry`. After adding the blueprint, verify:

```typescript
import { getAllWorkflows, getWorkflow } from "@/lib/workflow-os";

const wf = getWorkflow("your_new_workflow_id");
console.assert(wf !== undefined, "Workflow must appear in registry");
console.assert(wf.replayable === true, "Workflow must be replayable");
console.assert(wf.slaMinutes > 0, "SLA must be defined");
```

### Step 3: Configure SLA

Default SLA comes from `blueprint.slaMinutes`. For enterprise tenants that require custom SLAs, use:

```typescript
import { setTenantOverride } from "@/lib/workflow-os/workflow-versioning";

await setTenantOverride({
  organizationId: ORG_ID,
  workflowId: "your_new_workflow_id",
  slaMinutes: 15,               // enterprise SLA
  version: "1.0.0",
});
```

Verify with:
```typescript
const sla = await resolveEffectiveSla("your_new_workflow_id", ORG_ID);
// Returns tenant override if set, else default
```

### Step 4: Verification Tests

Before releasing a new workflow to production, run the following tests:

**Test 1: Execution Test**
```typescript
const result = await executeWorkflow({
  workflowId: "your_new_workflow_id",
  organizationId: TEST_ORG_ID,
  triggerSource: "governance_test",
  payload: { /* representative test data */ },
  correlationId: crypto.randomUUID(),
});
assert(result.status !== "failed", result.error);
```

**Test 2: State Machine Test**
```typescript
import { isLegalTransition } from "@/lib/workflow-os/workflow-state-machine";

assert(isLegalTransition("pending", "executing") === true);
assert(isLegalTransition("completed", "executing") === false);
```

**Test 3: SLA Compliance Test**
Execute the workflow and verify it completes within `slaMinutes`. Log the execution duration.

**Test 4: Replay Test**
```typescript
import { replayWorkflow } from "@/lib/workflow-os/workflow-replay";

const replay = await replayWorkflow({
  workflowId: "your_new_workflow_id",
  organizationId: TEST_ORG_ID,
  originalCorrelationId: TEST_CORRELATION_ID,
  reason: "governance_verification_test",
  requestedBy: "ai_ops_manager",
});
assert(replay.status === "replayed" || replay.status === "queued");
```

**Test 5: Tenant Isolation Test**
Execute the workflow for Tenant A and confirm no events appear in Tenant B's audit timeline.

**Go/No-Go for New Workflow:** All 5 tests must pass. AI Operations Manager signs off before the workflow is made `status: "active"` in the registry.

---

## Deprecating a Workflow

Deprecation removes a workflow from active execution without deleting historical data.

### Step 1: Assessment

Before deprecating, confirm:
- Is any tenant actively using this workflow in their go-live checklist?
- Are there pending executions or replays in the queue for this workflow?
- Does any tenant have a tenant-level SLA override for this workflow?

Query active tenants with this workflow:
```sql
SELECT organization_id, setup_payload
FROM tenant_onboarding_runs
WHERE setup_payload::text LIKE '%workflow_id_here%';
```

### Step 2: Notify Affected Tenants

If any tenant uses the workflow, notify their CSM at least 30 days before deprecation. The CSM must confirm with the tenant and document the acknowledgment in CRM.

### Step 3: Set Status to Deprecated

In `lib/automation/registry.ts`, update the blueprint. Then in `workflow-registry.ts`, modify `blueprintToWorkflow()` to map this workflow to `status: "deprecated"`:

```typescript
// In workflow-registry.ts, add to blueprintToWorkflow():
if (DEPRECATED_WORKFLOW_IDS.includes(bp.id)) {
  return { ...base, status: "deprecated" };
}
```

### Step 4: Block New Executions

Modify `executeWorkflow()` in `workflow-engine.ts` to reject executions for deprecated workflows:
```typescript
if (wf.status === "deprecated") {
  throw new Error(`Workflow ${workflowId} is deprecated and cannot be executed.`);
}
```

### Step 5: Archive Historical Data

Deprecated workflows remain in the registry for audit trail purposes. Do not delete `automation_traces` or `operational_events` records for deprecated workflows. These records may be required for HIPAA compliance audits.

---

## Handling SLA Breaches

An SLA breach occurs when a workflow execution exceeds its defined `slaMinutes` without completing.

### Detection

Mission Control exposes `slaBreachCount` in the runtime health state. A non-zero value requires investigation.

```bash
GET /api/mission-control/runtime-health
# Returns: { slaBreachCount: N, ... }
```

Also query directly:
```sql
SELECT
  workflow_id,
  organization_id,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS elapsed_minutes
FROM automation_traces
WHERE status = 'executing'
AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;
```

### Triage

For each breach:
1. Identify the workflow ID and tenant
2. Check if the dependency (e.g., OpenDental sync) is healthy
3. Check if ALICE has flagged a recommendation via `/api/alice/insights`
4. Determine if a replay is warranted

### SLA Breach Response by Severity

| Breach Count | Elapsed | Action |
|---|---|---|
| 1 workflow, < 2x SLA | Any | Monitor; check dependency health |
| 1 workflow, > 2x SLA | > 2 hours | Trigger replay; notify CSM |
| Multiple workflows | Any | P1 incident — activate Incident Response Playbook |
| All workflows paused | Any | P0 incident — escalate to Founder immediately |

---

## Replay Procedures

Replay is the mechanism for re-executing a failed or stalled workflow. All replays are governed — ALICE may recommend a replay, but the operator must approve high-risk replays.

### When to Replay

- Workflow in `dead_letter` state after exhausting retries
- SLA breach where root cause is now resolved (e.g., OpenDental sync restored)
- ALICE recommends replay with confidence ≥ 0.7
- Operator-initiated recovery after a platform incident

### Replay Governance

From `lib/ai-os/agent-governance.ts`:
- `replay` is in `APPROVAL_REQUIRED` set — it **always** requires operator approval unless the governance trust score is ≥ 80 AND ALICE confidence is ≥ 0.8.
- `canAutoApprove("replay", confidence)` returns `false` unconditionally for `replay` type.

This means every replay requires manual operator action via the governance approval queue.

### How to Trigger a Replay

**Via API:**
```bash
POST /api/mission-control/replay
{
  "workflowId": "recall_due",
  "organizationId": "<ORG_ID>",
  "correlationId": "<ORIGINAL_CORRELATION_ID>",
  "reason": "OpenDental sync restored after outage",
  "requestedBy": "ai_ops_manager"
}
```

**Via code:**
```typescript
import { replayWorkflow } from "@/lib/workflow-os/workflow-replay";

const result = await replayWorkflow({
  workflowId: "recall_due",
  organizationId: ORG_ID,
  originalCorrelationId: ORIGINAL_ID,
  reason: "Dependency restored after P1 incident",
  requestedBy: "ai_ops_manager",
});
```

### Replay Queue Management

Check the replay queue depth via `getReplayQueue()`. A deep queue (> 50 items) indicates a systemic issue — do not replay blindly. Investigate root cause first.

```typescript
import { getReplayQueue } from "@/lib/workflow-os/workflow-replay";
const queue = await getReplayQueue();
// Inspect queue before mass-replaying
```

---

## Escalation Criteria

| Scenario | Escalate To | Escalation Method |
|---|---|---|
| Single workflow SLA breach > 4 hours | AI Operations Manager | Slack direct message |
| Multiple workflows breaching SLA | Platform Admin | Call immediately |
| Dead letter queue > 20 items | Platform Admin | P1 incident |
| Replay approval queue > 10 pending | AI Operations Manager | Review within 2 hours |
| New workflow fails verification tests | AI Operations Manager | Do not release; fix and retest |
| Trust score < 60 | Platform Admin + Founder | Investigate governance state immediately |

---

## Workflow Governance Audit Log

Every governance action must be traceable. Use `runtime_audit_timeline` in Supabase for all governance events:

```sql
SELECT event_type, workflow_id, actor_id, action, created_at
FROM runtime_audit_timeline
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

Audit records are immutable — never delete from `runtime_audit_timeline`. Retention is indefinite pending formal data retention policy definition.
