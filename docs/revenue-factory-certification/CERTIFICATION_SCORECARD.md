# Certification Scorecard — Batch 11-15 Revenue Workforce

| # | Category | Result | Evidence citation |
|---|---|---|---|
| 1 | IVY | PASS | 3/3 triggers real, non-stub, traced to `ExecutionEngine.run` with `getAgentBySlug("ivy")` — `lib/automation/detectors.ts:66-119, 126-195, 211-271` |
| 2 | FINN | PASS | 3/3 triggers real, non-stub, traced with `getAgentBySlug("finn")` — `lib/automation/detectors.ts:285-357, 365-427, 433-490`; backing table confirmed in `supabase/migrations/202606230001_finn_financial_tables.sql` |
| 3 | MAX | PASS | 3/3 triggers real, non-stub, traced with `getAgentBySlug("max")` — `lib/automation/detectors.ts:499-542, 559-606, 608-659` |
| 4 | NOVA | PASS | 2/2 triggers real, non-stub, traced with `getAgentBySlug("nova")` — `lib/automation/detectors.ts:668-712, 724-787` |
| 5 | ALICE | PASS | 3/3 triggers real, non-stub, traced with `getAgentBySlug("alice")` — `lib/automation/detectors.ts:798-841, 853-894, 896-952`; `ForecastEngine.forecastRevenue` genuinely called at `detectors.ts:928` |
| 6 | Attribution | PASS (with disclosed caveat) | All 14 `revenueImpact.amount` expressions are query-derived (5 fully computed sums, 9 per-unit estimates scaled by real detected volume — none are bare hardcoded constants); `AgentRevenueAttributionStore.recordAttribution` writes correctly only on success path — `packages/agent-os/execution/ExecutionEngine.ts:118-127`, `packages/agent-os/revenue/AgentRevenueAttributionStore.ts:34-57` |
| 7 | MissionControl | PASS | Revenue Workforce section sources all numbers from `AgentAnalyticsEngine`/`RevenueLeakageEngine`/`OpportunityEngine`/`AgentRevenueAttributionStore`; zero hardcoded literals found by grep — `app/mission-control/agents/page.tsx:91-128, 240-268` |
| 8 | Testing | **FAIL** | 93/93 tests pass with zero skips (`npm run test` actual output), BUT no coverage tool is installed (`npx vitest run --coverage` -> `MISSING DEPENDENCY '@vitest/coverage-v8'`) and 9 of 14 named triggers have no dedicated end-to-end test in `tests/agent-workforce/revenue-factory.test.ts` — cannot certify coverage adequacy without fabricating a number |
| 9 | Resiliency | PASS | `ExecutionEngine.run`'s catch block genuinely marks `status:"failed"` and records the error (pre-existing test `tests/agent-os/execution.test.ts:93-113`, plus 2 new throwaway injection tests for Supabase-insert-error and no-attribution-on-failure, both passed and then removed) |

## Summary

8 of 9 categories PASS. Category 8 (Testing) FAILS strictly because coverage cannot be measured (tooling absent) and because the task's certification bar implicitly requires verifiable coverage evidence for all 14 named triggers, which does not exist — only 5 of 14 have dedicated end-to-end tests, and the remainder are not provably covered.
