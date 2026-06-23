# Forensic Code Audit — Batch 11-15 Revenue Workforce

Method: every detector function below was read in full at `/home/user/ZenithDentist-AI-agency/lib/automation/detectors.ts`. For each, confirmed: (a) real Supabase query with real filter/threshold logic, not a hardcoded return; (b) real call into `ExecutionEngine.run` with `agentId` resolved via `getAgentBySlug`.

## IVY (Chief Patient Success Officer)

| Trigger | File:Line | Stub? | ExecutionEngine call | agentId resolution |
|---|---|---|---|---|
| recall recovery (`recall.overdue`) | detectors.ts:126-195 | No — real query on `recall_tracking` filtered `status=overdue, months_overdue>0`, tiered 6/12/18mo by `tierOf()`, grouped by `organization_id` | detectors.ts:172-185 | `getAgentBySlug("ivy")` at detectors.ts:148 |
| treatment acceptance (`treatment.unscheduled`/`treatment.high_value`) | detectors.ts:211-271 | No — real query joining `roi_calculations` to `leads!inner(status)`, real `HIGH_VALUE_TREATMENT_THRESHOLD=2500` bucket split (line 209, 237-238) | detectors.ts:250-261 | `getAgentBySlug("ivy")` at detectors.ts:232 |
| patient reactivation (`patient.inactive`) | detectors.ts:66-119 | No — real query on `leads` with `created_at < cutoff (90 days)` and status exclusion | detectors.ts:100-111 | `getAgentBySlug("ivy")` at detectors.ts:89 |

All three use real computed thresholds (`INACTIVE_DAYS=90`, `HIGH_VALUE_TREATMENT_THRESHOLD=2500`, tier function on `months_overdue`), not literals returned unconditionally. Each function returns `triggered:false` early if `matches===0`/`rows.length===0`, proving the logic actually branches on query results rather than always firing.

## FINN (Chief Financial Recovery Officer)

| Trigger | File:Line | Stub? | ExecutionEngine call | agentId resolution |
|---|---|---|---|---|
| claim recovery (`claim.aging.30/60/90`) | detectors.ts:285-357 | No — real query on `claims` (`status in [submitted,pending]`), real age computation `ageDays()` (line 312) against `CLAIM_AGING_TIERS` (line 279-283), real per-tier dedup via `claimed` Set | detectors.ts:335-346 | `getAgentBySlug("finn")` at detectors.ts:306 |
| balance recovery (`balance.overdue`) | detectors.ts:365-427 | No — real query on `invoices`, filters `due_date < today`, excludes paid/void/cancelled, computes `amount_due > amount_paid` client-side (line 382-384) | detectors.ts:406-417 | `getAgentBySlug("finn")` at detectors.ts:389 |
| payment recovery (`payment.failed`) | detectors.ts:433-490 | No — real query on `payment_attempts` filtered `status=failed` | detectors.ts:469-480 | `getAgentBySlug("finn")` at detectors.ts:453 |

Migration `supabase/migrations/202606230001_finn_financial_tables.sql` confirms `claims` table is new and real (columns `claim_amount`, `status`, `submitted_at` match the query); `invoices`/`payment_attempts` are reused from pre-existing migration `20260621000000_operational_proving_ground_patient_commerce.sql` per the migration's own comment (lines 6-14) — verified these tables are referenced consistently with the columns selected in detectors.ts.

## MAX (Chief Operations Officer)

| Trigger | File:Line | Stub? | ExecutionEngine call | agentId resolution |
|---|---|---|---|---|
| no-show recovery (`appointment.no_show`) | detectors.ts:499-542 | No — real query on `bookings` (`booking_status=scheduled`, `scheduled_at < cutoff` using `NO_SHOW_GRACE_HOURS=2`) | detectors.ts:523-534 | `getAgentBySlug("max")` at detectors.ts:517 |
| open-chair recovery (`schedule.open_slot`) | detectors.ts:559-606 | No — real query on `bookings` (`booking_status=cancelled`, `created_at > cutoff` using `OPEN_SLOT_LOOKBACK_HOURS=24`) | detectors.ts:587-598 | `getAgentBySlug("max")` at detectors.ts:581 |
| waitlist fill (`schedule.gap_detected`) | detectors.ts:608-659 | No — same cancellation signal as open_slot but escalates only when `rows.length >= SCHEDULE_GAP_MIN_CLUSTER (3)` (line 630) — real cluster-threshold logic, not a stub duplicate | detectors.ts:640-651 | `getAgentBySlug("max")` at detectors.ts:634 |

Note: `detectOpenSlots` and `detectScheduleGaps` share a data source (cancelled bookings) by explicit documented design (comment at detectors.ts:544-555) — this is a deliberate proxy for a missing PMS schedule-feed table, not duplicated/dead code; the two functions encode genuinely different trigger conditions (any cancellation vs. clustered cancellations ≥3).

## NOVA (Chief Growth Officer)

| Trigger | File:Line | Stub? | ExecutionEngine call | agentId resolution |
|---|---|---|---|---|
| review generation (`appointment.completed`/review request) | detectors.ts:668-712 | No — real query on `bookings` (`booking_status=completed`, `scheduled_at < cutoff` using `REVIEW_REQUEST_MIN_HOURS=24`, `lead_id not null`) | detectors.ts:693-704 | `getAgentBySlug("nova")` at detectors.ts:687 |
| referral/advocacy (`review.positive`/`patient.promoter`) | detectors.ts:724-787 | No — real query on `reputation_events` (`event_type=review_received`, `sentiment=positive`), grouped by org, dual-fires two event types (review.positive -> patient_advocacy, patient.promoter -> referral_growth) | detectors.ts:765-776 | `getAgentBySlug("nova")` at detectors.ts:745 |

## ALICE (Chief Intelligence Officer)

| Trigger | File:Line | Stub? | ExecutionEngine call | agentId resolution |
|---|---|---|---|---|
| revenue leakage (`revenue.decline`) | detectors.ts:798-841 | No — real query on `roi_calculations` with real threshold `REVENUE_LEAK_THRESHOLD=10000` (line 23), real sum aggregation (line 821) | detectors.ts:822-833 | `getAgentBySlug("alice")` at detectors.ts:815 |
| production risk (`production.at_risk`) | detectors.ts:853-894 | No — real query on `bookings` (`booking_status=cancelled`); amount is `matches * 150` (a per-unit estimate, not a single hardcoded constant returned regardless of input — see REVENUE_ATTRIBUTION_AUDIT.md for a finer-grained verdict on this specific multiplier) | detectors.ts:875-886 | `getAgentBySlug("alice")` at detectors.ts:869 |
| goal miss (`goal.missed`) | detectors.ts:896-952 | No — real query on `agent_revenue_attribution`, real call into `ForecastEngine.forecastRevenue(tenantId)` (line 928), only fires `if (forecast.trend !== "down") continue` (line 929) — genuine conditional gating on computed forecast trend | detectors.ts:931-942 | `getAgentBySlug("alice")` at detectors.ts:916 |

`packages/agent-os/revenue-intelligence/ForecastEngine.ts` was confirmed to exist and is imported at detectors.ts:10 (not a stray import — actively called at line 928).

## Verdict for this category

All 14 named triggers (3 IVY + 3 FINN + 3 MAX + 2 NOVA + 3 ALICE = 14) have real, non-stub detector implementations with genuine query logic and conditional branching, and each correctly resolves `agentId` via `getAgentBySlug(slug)` before calling `ExecutionEngine.run`. **PASS** for code-reality; see REVENUE_ATTRIBUTION_AUDIT.md for a separate, stricter verdict on whether every `revenueImpact.amount` is a *real computed* dollar figure versus a flat per-unit estimate.
