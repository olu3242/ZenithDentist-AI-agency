# Revenue Workforce Architecture (Batch 11-15)

## Flow (every automation, no exceptions)

```
Detector (lib/automation/detectors.ts, cron via /api/automation/scan)
  → ExecutionEngine.run({ agentId, tenantId, eventType, payload, workflowId, revenueImpact? })
      → ApprovalRuleEngine.checkApproval()  [existing, Batch 8]
      → executeRegisteredAutomation(workflowId)  [existing, Workflow OS]
      → AgentRevenueAttributionStore.recordAttribution()  [existing, Batch 7, when revenueImpact given]
  → agent_executions / agent_actions / agent_results  [existing tables]
  → LearningEventStore.recordEvent() / PerformanceScoringEngine  [existing, Batch 9]
  → AgentAnalyticsEngine / AgentScorecardEngine  [existing, Batch 10, reads the above]
  → Mission Control Agent Center "Revenue Workforce" section  [Phase 6, reads analytics]
```

No automation introduces a parallel execution path. The only new code per automation is: (1) a detector function producing candidates, (2) an `AutomationBlueprint` entry so Workflow OS has somewhere to route the actual communication/scheduling actions, (3) the `ExecutionEngine.run()` call wiring agent + workflow + revenue together.

## Agent Responsibility Boundaries

- **IVY** (Chief Patient Success Officer) — recall, treatment acceptance, reactivation. Writes `revenue_type` = `recall_booking` / `treatment_acceptance` / `patient_reactivation` to `agent_revenue_attribution`.
- **FINN** (Chief Financial Recovery Officer) — claims, balances, failed payments. Writes `revenue_type` = `insurance_recovery` / `balance_recovery` / `payment_recovery`.
- **MAX** (Chief Operations Officer) — no-shows, open chair, waitlist. Writes `revenue_type` = `production_saved`.
- **NOVA** (Chief Growth Officer) — reviews, referrals, advocacy. Writes `revenue_type` = `review_generated` / `referral_conversion`.
- **ALICE** (Chief Intelligence Officer) — does not execute patient-facing actions herself; she detects leakage/opportunity and emits `agent_recommendations` (existing Batch 9 table) with a `responsible_agent` field pointing at IVY/FINN/MAX/NOVA, who then execute via the same `ExecutionEngine.run()` path when a human approves the recommendation (or auto-approves per existing rule).

## New Package: `packages/agent-os/revenue-intelligence/`

ALICE-only, Phase 5. Reads existing `lib/roi.ts`, `lib/revenue-attribution/index.ts`, and the new `agent_revenue_attribution` table — does not replace either. `RevenueLeakageEngine` classifies leakage into 6 categories (recall/treatment/scheduling/claims/collections/referral) sourced from existing detector outputs; `OpportunityEngine`/`ForecastEngine`/`RecommendationEngine` are thin aggregation/heuristic layers producing `agent_recommendations` rows, reusing the Batch 9 table rather than creating a new one.

## Mission Control Extension (Phase 6)

`app/mission-control/agents/page.tsx` gains a "Revenue Workforce" section listing IVY/FINN/MAX/NOVA/ALICE cards with: revenue recovered, patients reactivated, claims recovered, appointments recovered, reviews generated, referrals generated, revenue at risk, revenue opportunities — all computed by the existing `AgentAnalyticsEngine`/`AgentScorecardEngine`, filtered/grouped per agent.
