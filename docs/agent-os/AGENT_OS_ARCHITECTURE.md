# Agent OS — Architecture (Batches 1-5)

## Layering

```
Patient / Operator
       │
       ▼
  LIZ Delegation Layer (Batch 5)
  LizIntentEngine → LizDelegationEngine → LizResponseComposer
       │
       ▼
  Agent Router (Batch 2)
  AgentResolver (capability match) → AgentDispatcher
       │
       ▼
  Agent Registry (Batch 1)            Agent Memory (Batch 3)
  agent_registry / agent_capabilities  agent_memory / agent_observations
  agent_tools / agent_metrics          agent_feedback
       │
       ▼
  Execution Engine (Batch 4)
  ExecutionEngine.run(agentId, request)
       │
       ▼
  executeRegisteredAutomation(workflowId)   ← EXISTING, unmodified
  Workflow OS → Runtime OS → Event Fabric   ← EXISTING, unmodified
```

## Agent Registry (Batch 1)

9 agents seeded: LIZ, ALICE, MAX, IVY, FINN, NOVA, QUINN, REX, TESS.

`agent_registry` is the single source of truth for `agent_id` (uuid) ↔ `agent_id` (text slug, e.g. `"max"`). All downstream tables (memory, executions) reference the uuid FK.

## Agent Router (Batch 2)

`AgentRequest { tenantId, agentId?, eventType, payload }` enters `AgentRouter.route()`:
1. If `agentId` explicit, skip resolution.
2. Else `AgentResolver` maps `eventType` → agent via static routing table (patient_recall→IVY, treatment_followup→IVY, appointment_reschedule→MAX, insurance_claim→FINN, review_request→NOVA, executive_report→TESS, revenue_analysis→ALICE, compliance_check→QUINN, runtime_issue→REX).
3. `AgentDispatcher` validates the agent is `status='active'` in `agent_registry` and has the required capability, then hands off to `ExecutionEngine`.

This sits ABOVE `executeRegisteredAutomation` — it decides *which agent* owns the action; the existing Workflow OS still decides *how* the action executes.

## Agent Memory (Batch 3)

- `agent_memory` — durable key/value facts an agent has learned per tenant (e.g. "patient X prefers SMS").
- `agent_observations` — raw event log per agent (what it saw).
- `agent_feedback` — scored outcomes fed back for later learning-loop batches (9+).

## Execution Engine (Batch 4)

`ExecutionEngine.run({ agentId, tenantId, eventType, payload })`:
1. Create `agent_executions` row (status=running).
2. For each logical action the agent takes, insert `agent_actions` (input/output payload, status).
3. Call into existing Workflow OS via `executeRegisteredAutomation(workflowId)` where applicable — this is the ONLY execution path, no parallel runtime.
4. On completion, write `agent_results` (success, revenue_impact placeholder for Batch 7) and close `agent_executions`.

## LIZ Delegation (Batch 5)

`LizIntentEngine.detect(message)` → intent string → `LizDelegationEngine.delegate(intent, context)` maps to an agent via the same routing table as Batch 2 (schedule/cancel appointment→MAX, treatment questions→IVY, payment/insurance→FINN, review request→NOVA, practice report→TESS, revenue performance→ALICE) → calls `AgentRouter` → `ExecutionEngine` → result returned to `LizResponseComposer` which produces the patient-facing message. LIZ remains the only persona the patient ever sees.

## Mission Control / Runtime OS / Workflow OS Integration

- No new dashboard framework. Batch 6 (future) will add an "Agent Center" section to the existing `app/mission-control/page.tsx` panel set, reading from `agent_registry`/`agent_executions`/`agent_metrics` the same way existing panels read runtime state.
- No new orchestration layer — `ExecutionEngine` is a recorder/dispatcher around the existing `executeRegisteredAutomation`.
