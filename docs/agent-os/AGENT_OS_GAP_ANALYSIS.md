# Agent OS — Gap Analysis

Derived from `AGENT_OS_AUDIT.md`. Each gap below maps to a Batch 1-5 deliverable.

| # | Gap | Evidence | Resolved By |
|---|-----|----------|-------------|
| G1 | No agent lifecycle model — agents are static metadata (e.g. mission-control panel labels), not registered entities with status/version/capabilities | `OperationalAgentGrid` reads derived runtime state, not a table | Batch 1 — `agent_registry`, `agent_capabilities`, `agent_tools`, `agent_metrics` |
| G2 | No agent router — workflows are reached by direct `workflowId`, not by event-type → agent → workflow resolution | `lib/workflow-os/workflow-router.ts` maps trigger→workflow, not trigger→agent | Batch 2 — `AgentRouter`/`AgentDispatcher`/`AgentResolver` sitting in front of `executeRegisteredAutomation` |
| G3 | No agent-scoped memory — `automation_traces`/`runtime_audit_timeline` are workflow-scoped, not agent-scoped; no observation/feedback storage | `lib/runtime/trace-engine.ts`, `lib/runtime/governance.ts` | Batch 3 — `agent_memory`, `agent_observations`, `agent_feedback` |
> Action: keep these new tables additive; do not modify `automation_traces` schema.
| G4 | No per-agent execution tracking — `workflow_execution_evidence` is keyed by `workflowId`/`organizationId`, no `agent_id` column anywhere | `lib/automation-os/registry.ts:246-274` | Batch 4 — `agent_executions`, `agent_actions`, `agent_results`, all referencing `agent_id` from Batch 1 registry |
| G5 | No LIZ delegation model — `lib/liz/advisor.ts` routes directly to a `workflowId` via `executeRegisteredAutomation`; there is no concept of delegating to a named peer agent (MAX/IVY/FINN/NOVA/QUINN/REX/TESS/ALICE) | `app/api/liz/action/route.ts:51` | Batch 5 — `LizIntentEngine`/`LizDelegationEngine`/`LizResponseComposer` wrapping the Batch 2 router |

## Explicit Non-Duplication Commitments

- Agent OS execution MUST terminate in `executeRegisteredAutomation()` (`lib/automation-os/registry.ts`) — Batch 4's `ExecutionEngine` is a thin wrapper that calls this function and records the *agent-level* outcome around it, not a new execution runtime.
- Agent OS events MUST publish via `publishEvent`/`publishFunnelEvent` (`lib/event-fabric.ts`) — no second event bus.
- Agent OS audit/approval MUST extend `lib/runtime/governance.ts` patterns (policy + audit timeline), not replace them.
- ALICE and LIZ remain themselves; MAX/IVY/FINN/NOVA/QUINN/REX/TESS are **new** named agents registered in `agent_registry`, distinct in responsibility from ALICE (intelligence) and LIZ (patient-facing concierge).
