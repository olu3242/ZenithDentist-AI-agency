# Agent Router

Resolves which registered agent owns an incoming request and validates it before execution.

## Contract

```typescript
export interface AgentRequest {
  tenantId: string;
  agentId?: string;
  eventType: string;
  payload: unknown;
}
```

## Files (`packages/agent-os/router/`)

- `AgentRegistry.ts` — Supabase-backed lookups against `agent_registry`/`agent_capabilities`.
- `AgentResolver.ts` — static `eventType → agent slug` table (`resolveAgentForEvent`). Routing table:
  patient_recall→ivy, treatment_followup→ivy, appointment_reschedule→max, insurance_claim→finn,
  review_request→nova, executive_report→tess, revenue_analysis→alice, compliance_check→quinn, runtime_issue→rex.
- `AgentDispatcher.ts` — confirms the resolved/explicit agent exists and `status='active'`.
- `AgentRouter.ts` — `route(request)` → `{ agentId, agentSlug, resolved }`. Does not execute anything; Batch 4's `ExecutionEngine` does.

## Non-Duplication

This router decides *who* owns a request. It does not replace `lib/workflow-os/workflow-router.ts`, which still decides *how* a workflow executes once an agent has been assigned.
