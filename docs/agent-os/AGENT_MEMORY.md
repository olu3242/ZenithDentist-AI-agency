# Agent Memory

Per-agent, per-tenant durable memory, separate from workflow-scoped runtime traces.

## Schema (`supabase/migrations/202606220002_agent_memory.sql`)

- `agent_memory` — `agent_id uuid` FK, `tenant_id uuid`, `memory_type text`, `memory_key text`, `memory_value jsonb`, `confidence_score numeric`, `created_at`
- `agent_observations` — `agent_id uuid` FK, `event_type text`, `observation jsonb`, `created_at`
- `agent_feedback` — `agent_id uuid` FK, `feedback_type text`, `score numeric`, `feedback jsonb`, `created_at`

## Files (`packages/agent-os/memory/`)

- `AgentMemoryStore.ts` — get/set/list facts by `agentId` + `tenantId` + `memoryKey`.
- `AgentObservationStore.ts` — record/list raw observations by `agentId`.
- `AgentFeedbackStore.ts` — record/list scored feedback by `agentId`, the input to future learning-loop batches.

## Relationship to Existing Runtime

`lib/runtime/trace-engine.ts` traces are workflow-scoped (one trace per execution). Agent memory is agent-scoped and persists across executions — it is what lets an agent "remember" facts between runs, which the existing Runtime OS does not provide.
