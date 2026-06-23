# Remediation Plan — Testing Category Failure

Required to move Category 8 (Testing) from FAIL to PASS:

1. **Install coverage tooling.** Add `@vitest/coverage-v8` to devDependencies (`npm install -D @vitest/coverage-v8`) and add a `coverage` block to `/home/user/ZenithDentist-AI-agency/vitest.config.ts` (currently has no `coverage` key — read in full, only has `test.environment`/`test.include`/`resolve.alias`). Add a `"test:coverage": "vitest run --coverage"` script to `package.json` (currently only has `"test": "vitest run"` at line 15) so a coverage percentage can be produced and verified rather than guessed.

2. **Add end-to-end tests for the 9 named triggers not covered by `tests/agent-workforce/revenue-factory.test.ts`** (currently only covers `detectInactivePatients`, `detectAgingClaims`, `detectNoShows`, `detectReviewRequests`, `detectRevenueLeaks` — file lines 124-233). Missing scenarios, each needing a `mockFullChain(...)` test following the existing pattern in that file:
   - `detectRecallOverdue` (tier bucketing 6/12/18mo) — `lib/automation/detectors.ts:126`
   - `detectUnscheduledTreatment` (high-value vs standard bucket split) — `lib/automation/detectors.ts:211`
   - `detectOverdueBalances` — `lib/automation/detectors.ts:365`
   - `detectFailedPayments` — `lib/automation/detectors.ts:433`
   - `detectOpenSlots` — `lib/automation/detectors.ts:559`
   - `detectScheduleGaps` (cluster threshold ≥3) — `lib/automation/detectors.ts:608`
   - `detectPromoters` (dual event-type fan-out: review.positive + patient.promoter) — `lib/automation/detectors.ts:724`
   - `detectProductionRisk` — `lib/automation/detectors.ts:853`
   - `detectGoalMiss` (requires mocking `ForecastEngine.forecastRevenue` trend="down") — `lib/automation/detectors.ts:896`

3. Re-run `npm run test -- --coverage` (or the new `test:coverage` script) after adding tests, and only then update any certification document with an actual measured percentage.
