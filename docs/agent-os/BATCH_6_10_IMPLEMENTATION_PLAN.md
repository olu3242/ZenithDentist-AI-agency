# Batch 6-10 Implementation Plan — Mission Control, Revenue Attribution, Approvals, Learning & Analytics

**Branch:** feature/agent-os-governance-intelligence
**Prerequisite check (verified):** Batch 1 Agent Registry (`agent_registry`, `agent_capabilities`, `agent_tools`, `agent_metrics` — `supabase/migrations/202606220001_agent_registry.sql`), Batch 2 Router (`packages/agent-os/router/*`), Batch 3 Memory (`packages/agent-os/memory/*`, migration `...0002_agent_memory.sql`), Batch 4 Execution Engine (`packages/agent-os/execution/*`, migration `...0003_agent_execution_engine.sql`), Batch 5 LIZ Delegation (`packages/agent-os/delegation/*`) all exist on `feature/agent-os-foundation` and are merge-ready. None of these are rebuilt — Batches 6-10 are additive layers on top.

## Scope Map

| Batch | Deliverable | New Migration | New Code | Mission Control Surface |
|---|---|---|---|---|
| 6 | Mission Control Agent Center | none (reads existing tables) | `app/mission-control/agents/page.tsx` + panel components | `/mission-control/agents` — Overview/Registry/Executions/Revenue/Approvals/Learning/Health/Settings tabs |
| 7 | Revenue Attribution Engine | `202606220004_agent_revenue_attribution.sql` | `packages/agent-os/revenue/AgentRevenueAttributionStore.ts` | Revenue tab |
| 8 | Agent Approval Framework | `202606220005_agent_approval_framework.sql` | `packages/agent-os/approvals/{ApprovalRuleEngine,ApprovalRequestStore,ApprovalDecisionStore}.ts` | Approvals tab |
| 9 | Agent Learning System | `202606220006_agent_learning.sql` | `packages/agent-os/learning/{LearningEventStore,PerformanceScoringEngine,RecommendationEngine}.ts` | Learning tab |
| 10 | Agent Analytics & Executive Intelligence | none (reads Batches 1-9 tables) | `packages/agent-os/analytics/{AgentAnalyticsEngine,AgentScorecardEngine,AgentInsightsEngine,ExecutiveBriefEngine}.ts` | Overview/Health tabs + daily/weekly brief surfaces |

## Non-Duplication Commitments (carried forward from Batch 1-5)

- Approval framework (Batch 8) is agent-action-scoped (`agent_approval_rules/requests/decisions`) and is additive to, not a replacement for, `lib/runtime/governance.ts` (`GovernanceRule`/`GovernanceState`), which continues to gate replay/recovery candidates at the Workflow OS level. Agent OS approvals gate *agent actions before they reach* `ExecutionEngine.run()`.
- Revenue attribution (Batch 7) adds an `agent_id` dimension; it does not replace `lib/revenue-attribution/index.ts` (`getWorkflowAttribution`, workflow-keyed). `agent_revenue_attribution` rows are populated by `ExecutionEngine` when it records `agent_results`, alongside (not instead of) the existing workflow-level attribution.
- Mission Control Agent Center (Batch 6) is a new route segment inside the *existing* `app/mission-control/` app, not a new dashboard framework. It reads from Batch 1-9 tables the same way existing panels read `getRuntimeHealthState()` etc.
- Analytics engines (Batch 10) compute from existing tables; they do not introduce a new telemetry pipeline. `ExecutiveBriefEngine` (TESS) and weekly review (ALICE) are read-only aggregation over `agent_executions`, `agent_revenue_attribution`, `agent_learning_events`.

## Execution Order

1. Migrations 004-006 (additive, independent of each other — can ship in one PR).
2. `packages/agent-os/{revenue,approvals,learning}` — pure logic, unit-testable without UI.
3. Wire `ExecutionEngine.run()` (Batch 4, existing file) to optionally check approval rules before executing and to record revenue attribution after — **minimal, additive edit**, not a rewrite.
4. `packages/agent-os/analytics/*` — depends on 1-3 having data shape defined.
5. Mission Control `/mission-control/agents` route + 8 tab panels — last, since it's purely a read surface over everything above.
6. Tests + docs (`AGENT_GOVERNANCE_MODEL.md`, `AGENT_ANALYTICS_MODEL.md`, `AGENT_REVENUE_ATTRIBUTION_MODEL.md`) + this plan.
7. Validate lint/typecheck/build/test, commit, push to `feature/agent-os-governance-intelligence`.
