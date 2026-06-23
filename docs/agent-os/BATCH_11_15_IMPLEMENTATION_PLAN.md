# Batch 11-15 Implementation Plan — Autonomous Revenue Workforce

**Branch:** feature/agent-workforce-revenue-factory (off feature/agent-os-governance-intelligence)
**Prerequisite:** Batches 1-10 merged (verified in AGENT_WORKFORCE_AUDIT.md).

## Phase Order

1. **Phase 1 — IVY**: extend `lib/automation/detectors.ts` with `detectRecallOverdue` (6/12/18mo tiers), `detectUnscheduledTreatment`; add 3 `AutomationBlueprint`s (`recall_recovery`, `treatment_acceptance`, `patient_reactivation`) to `lib/automation/registry.ts`; wire all three through `ExecutionEngine.run()` with `revenueImpact`.
2. **Phase 2 — FINN**: `detectAgingClaims` (30/60/90 tiers), `detectOverdueBalances`, `detectFailedPayments`; blueprints `claim_recovery`, `balance_recovery`, `payment_recovery`. Requires `claims`/`balances` data sources — if no such tables exist yet, query existing `roi_calculations`/`bookings`-adjacent tables and degrade gracefully (matching the existing M1 pattern from the Patient Ops audit: "limited until PMS connected").
3. **Phase 3 — MAX**: extend existing no-show detector to route through `ExecutionEngine`; `detectOpenSlots`, `detectScheduleGaps`; blueprints `open_chair_recovery`, `waitlist_fill`.
4. **Phase 4 — NOVA**: extend existing review-request detector; `detectPromoters`; blueprints `referral_growth`, `patient_advocacy`.
5. **Phase 5 — ALICE**: `packages/agent-os/revenue-intelligence/{RevenueLeakageEngine,OpportunityEngine,ForecastEngine,RecommendationEngine}.ts`.
6. **Phase 6 — Mission Control**: "Revenue Workforce" section in `app/mission-control/agents/page.tsx`.
7. **Phase 7 — Revenue Factory Certification**: `docs/agent-os/REVENUE_FACTORY_CERTIFICATION.md` tracing the 5 required scenarios end-to-end through code citations, same evidence-based methodology as the Patient Ops Readiness Audit.

## Commit Strategy (per spec, 6 commits)

1. `feat(ivy): implement patient success operating system`
2. `feat(finn): implement financial recovery operating system`
3. `feat(max): implement operations recovery operating system`
4. `feat(nova): implement growth operating system`
5. `feat(alice): implement revenue command center`
6. `feat(agent-os): revenue factory certification and mission control integration`

## Non-Duplication Commitments

- No new execution engine, router, or registry — every automation terminates in the existing `ExecutionEngine.run()` → `executeRegisteredAutomation()` chain.
- No new approval table — all mass/bulk/financial actions classify into the existing 5 approval-required categories from Batch 8.
- No new revenue attribution table — all dollars flow through `agent_revenue_attribution` (Batch 7).
- No new cron system — new detectors join `runAllDetectors()` and the existing `/api/automation/scan` 4h cron.

## Validation Gate

lint, typecheck, build, unit tests (`tests/agent-workforce/*.test.ts`), all must pass before each phase's commit where feasible, and certainly before the final certification commit.
