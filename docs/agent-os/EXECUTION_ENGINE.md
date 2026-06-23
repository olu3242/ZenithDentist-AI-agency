# Execution Engine

Records agent-level execution outcomes around the existing Workflow OS — does not replace it.

## Schema (`supabase/migrations/202606220003_agent_execution_engine.sql`)

- `agent_executions` — `execution_id text unique`, `agent_id uuid` FK, `tenant_id uuid`, `event_type text`, `status text` (running/completed/failed), `started_at`, `completed_at`, `duration_ms`
- `agent_actions` — `execution_id uuid` FK, `action_name text`, `action_type text`, `input_payload jsonb`, `output_payload jsonb`, `status text`
- `agent_results` — `execution_id uuid` FK, `success boolean`, `revenue_impact numeric`, `outcome jsonb`

## Files (`packages/agent-os/execution/`)

- `ExecutionEngine.ts` — `run({ agentId, tenantId, eventType, payload, workflowId? })`. Creates an `agent_executions` row, and if `workflowId` is provided, calls `executeRegisteredAutomation(workflowId)` from `lib/automation-os/registry.ts` — the existing, unmodified Workflow OS entrypoint. Records an `agent_actions` row for that call and an `agent_results` row for the outcome.
- `ExecutionTracker.ts` — fetch execution status/history by `agentId` or `executionId`.
- `ExecutionResult.ts` — shared result type.

## Critical Invariant

`ExecutionEngine` never reimplements workflow execution. All real work still happens inside `executeRegisteredAutomation → executeWorkflow → Runtime OS`. This layer only attributes that work to an `agent_id` and records it for Mission Control's future Agent Center (Batch 6) and revenue attribution (Batch 7).
