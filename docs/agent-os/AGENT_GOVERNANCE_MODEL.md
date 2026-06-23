# Agent Governance Model (Batch 8)

## Purpose

Allow safe autonomy: most agent actions execute immediately; risky categories require human sign-off before `ExecutionEngine.run()` proceeds.

## Tables

- `agent_approval_rules` — id uuid, agent_id uuid, action_type text, auto_approve boolean, risk_level text, created_at
- `agent_approval_requests` — id uuid, execution_id uuid, agent_id uuid, action_type text, payload jsonb, status text ('pending'|'approved'|'rejected'), requested_at, resolved_at
- `agent_approval_decisions` — id uuid, request_id uuid, decided_by text, decision text, rationale text, decided_at

## Default Rule Set

**Auto-approved:** appointment reminders, review requests, patient education, recall notifications, status updates.

**Approval required:** mass campaigns, financial adjustments, custom AI messages, bulk patient outreach, high-risk operations.

## Flow

```
Agent → Action → ApprovalRuleEngine.check(agentId, actionType)
  → if auto_approve rule matches: proceed straight to ExecutionEngine.run()
  → else: ApprovalRequestStore.create(status='pending') → blocks execution
       → human decision via ApprovalDecisionStore.record()
       → status='approved' → ExecutionEngine.run() proceeds
       → status='rejected' → execution short-circuited, agent_results.success=false, outcome={reason:'rejected'}
```

## Relationship to Existing Governance

This is a NEW, narrower layer than `lib/runtime/governance.ts`. That file's `GovernanceRule`/`GovernanceState` continues to govern Workflow OS-level replay/recovery/SLA-defense decisions (organization-wide policy, trust scoring). `agent_approval_rules` governs individual agent ACTIONS before they are dispatched — a finer grain, sitting one layer up the stack, in front of `ExecutionEngine.run()` rather than inside `executeWorkflow()`. The two systems are not merged; an agent action can pass agent-level approval and still be subject to Workflow OS governance when its underlying workflow executes.
