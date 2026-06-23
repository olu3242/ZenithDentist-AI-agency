# Revenue Attribution Audit — Batch 11-15

For every `revenueImpact` literal passed to `ExecutionEngine.run` in `/home/user/ZenithDentist-AI-agency/lib/automation/detectors.ts`, this audit classifies the `amount` computation as:
- **COMPUTED** — derived from summed/aggregated real row data (varies with actual query results).
- **PER-UNIT ESTIMATE** — `matches/rows.length * constant`. This is not a hardcoded single value (it scales with real detected volume) but the per-unit dollar figure itself is an assumption, not pulled from a priced/billed source field.

| Trigger | Line | revenueType | amount expression | Classification |
|---|---|---|---|---|
| patient.inactive | 106-110 | patient_reactivation | `matches * 150` | PER-UNIT ESTIMATE |
| recall.overdue | 180-184 | recall_booking | `orgRows.length * 180` | PER-UNIT ESTIMATE |
| treatment.unscheduled/high_value | 256-260 | treatment_acceptance | `bucket.reduce((sum,r)=>sum+Number(r.recoverable_revenue),0)` | **COMPUTED** (real summed value from `roi_calculations.recoverable_revenue`) |
| claim.aging.30/60/90 | 341-345 | insurance_recovery | `orgRows.reduce((sum,r)=>sum+Number(r.claim_amount),0)` | **COMPUTED** (real summed `claims.claim_amount`) |
| balance.overdue | 412-416 | balance_recovery | `orgRows.reduce((sum,r)=>sum+(Number(r.amount_due)-Number(r.amount_paid)),0)` | **COMPUTED** (real outstanding balance from `invoices`) |
| payment.failed | 475-479 | payment_recovery | `orgRows.length * 250` | PER-UNIT ESTIMATE |
| appointment.no_show | 529-533 | production_saved | `matches * 200` | PER-UNIT ESTIMATE |
| schedule.open_slot | 593-597 | production_saved | `matches * 150` | PER-UNIT ESTIMATE |
| schedule.gap_detected | 646-650 | production_saved | `rows.length * 175` | PER-UNIT ESTIMATE |
| appointment.completed (review request) | 699-703 | review_generated | `matches * 25` | PER-UNIT ESTIMATE |
| review.positive / patient.promoter | 771-775 | review_generated / referral_conversion | `orgRows.length * 100` | PER-UNIT ESTIMATE |
| revenue.decline | 828-832 | revenue_at_risk | `(data??[]).reduce((sum,r)=>sum+Number(r.recoverable_revenue??0),0)` | **COMPUTED** (real summed `roi_calculations.recoverable_revenue`) |
| production.at_risk | 881-885 | revenue_at_risk | `matches * 150` | PER-UNIT ESTIMATE |
| goal.missed | 937-941 | revenue_at_risk | `Math.max(0, forecast.historicalDailyAverage * 30 - forecast.projectedNext30Days)` | **COMPUTED** (real `ForecastEngine.forecastRevenue()` output) |

## Distinction: per-unit estimate vs. hardcoded mock

None of the 14 `amount` expressions is a bare hardcoded literal like `amount: 100` returned unconditionally — every expression multiplies or sums against a real, query-derived count/value (`matches`, `rows.length`, `orgRows.length`, or a reduced sum of a real column). This is consistent with the task's instruction to reject "a literal 100 with no calculation" — none of these are that. However, 9 of 14 use a flat per-unit dollar constant (e.g., `* 150`, `* 200`, `* 25`) rather than a price pulled from billing/PMS data, because (per code comments at detectors.ts:198-208, 544-555) no PMS/treatment-plan/schedule-pricing table exists yet — this is a documented, acknowledged proxy, not a concealed mock. Auditor judgment: this is a real, repo-acknowledged data-source limitation, not a certification-blocking stub, but it should be disclosed as a limitation rather than presented as fully "real-dollar" computation in any external-facing certification claim.

## AgentRevenueAttributionStore.recordAttribution write path

Read in full at `/home/user/ZenithDentist-AI-agency/packages/agent-os/revenue/AgentRevenueAttributionStore.ts:34-57`. Confirmed:
- Inserts into `agent_revenue_attribution` table.
- `agent_id: input.agentId` — this is the **agent's registry UUID** (`agent.id`, e.g. `ivy.id`), not the slug string, matching the `agent_executions.agent_id` foreign key pattern used elsewhere (consistent join key).
- `revenue_type`, `revenue_amount`, `source_event`, `tenant_id`, `execution_id` all pass through unmodified from `ExecutionEngine.run`'s `input.revenueImpact`.
- No mocked/placeholder values inserted by the store itself — it is a thin pass-through insert.

## Call-site verification: recordAttribution is only invoked from ExecutionEngine.run

Grepped repo for `recordAttribution(` outside the store's own definition and its test files — only call site is `ExecutionEngine.ts:119`, confirming a single, non-duplicated attribution write path triggered only on workflow success (inside the `try` block, after `executeRegisteredAutomation` resolves — verified at ExecutionEngine.ts:78-127). On failure (`catch` block, lines 139-184), `recordAttribution` is never called — confirmed no attribution is recorded for failed executions.

## Verdict

**PASS** with a disclosed caveat: all attribution amounts are real, query-derived, non-mocked figures, but 9/14 use a flat per-unit dollar assumption (not actual billed amounts) due to missing PMS pricing data — an acknowledged, documented limitation rather than a concealed placeholder.
