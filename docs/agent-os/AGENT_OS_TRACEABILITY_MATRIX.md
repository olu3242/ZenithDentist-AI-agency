# Agent OS — Traceability Matrix

| Requirement (Batch) | Implementation | Extends (not duplicates) |
|---|---|---|
| Batch 1 — Agent Registry | `supabase/migrations/202606220001_agent_registry.sql`; tables `agent_registry`, `agent_capabilities`, `agent_tools`, `agent_metrics` | New tables; no existing agent table to conflict with |
| Batch 2 — Agent Router | `packages/agent-os/router/{AgentRouter,AgentRegistry,AgentDispatcher,AgentResolver}.ts` | Sits above `lib/workflow-os/workflow-router.ts`; reuses `executeRegisteredAutomation` |
| Batch 3 — Agent Memory | `supabase/migrations/202606220002_agent_memory.sql`; `packages/agent-os/memory/{AgentMemoryStore,AgentObservationStore,AgentFeedbackStore}.ts` | Parallel to but distinct from `lib/runtime/trace-engine.ts` (workflow-scoped); no overlap |
| Batch 4 — Execution Engine | `supabase/migrations/202606220003_agent_execution_engine.sql`; `packages/agent-os/execution/{ExecutionEngine,ExecutionTracker,ExecutionResult}.ts` | Wraps `lib/automation-os/registry.ts:executeRegisteredAutomation`; does not reimplement Workflow OS |
| Batch 5 — LIZ Delegation | `packages/agent-os/delegation/{LizIntentEngine,LizDelegationEngine,LizResponseComposer}.ts` | Extends `lib/liz/advisor.ts` intent model; calls Batch 2 router instead of calling `executeRegisteredAutomation` directly |
| Tests | `tests/agent-os/{registry,router,memory,execution,liz-delegation}.test.ts` | New test surface, ≥90% coverage target |
| Docs | `docs/agent-os/{AGENT_REGISTRY,AGENT_ROUTER,AGENT_MEMORY,EXECUTION_ENGINE,LIZ_DELEGATION}.md` | New docs |

## Success Criteria Cross-Check

| Criterion | Status |
|---|---|
| All 9 Zenith agents registered | Pending Batch 1 implementation |
| Router operational | Pending Batch 2 |
| Memory persistence operational | Pending Batch 3 |
| Execution tracking operational | Pending Batch 4 |
| LIZ delegates correctly | Pending Batch 5 |
| Runtime OS integrated | By design (ExecutionEngine wraps existing chain) |
| Workflow OS integrated | By design (no new orchestration layer) |
| Mission Control ready for Agent Center (Batch 6) | Tables/metrics designed to be panel-readable |
| No duplicate orchestration framework introduced | Verified — see `AGENT_OS_GAP_ANALYSIS.md` non-duplication commitments |
| Passes lint/typecheck/build/tests | To be verified after implementation |
