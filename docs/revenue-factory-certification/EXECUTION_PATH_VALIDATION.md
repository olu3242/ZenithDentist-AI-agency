# Execution Path Validation — Batch 11-15

## Canonical chain (verified by direct read of each file)

1. **Detector** (`/home/user/ZenithDentist-AI-agency/lib/automation/detectors.ts`) — runs a Supabase query, branches on row count.
2. **`getAgentBySlug(slug)`** (`/home/user/ZenithDentist-AI-agency/packages/agent-os/router/AgentRegistry.ts:28-40`) — queries `agent_registry` table `eq("agent_id", agentId)`, returns `null` on error/no-row (detectors.ts checks for `null` and short-circuits with `*_agent_not_registered` error in every one of the 14 call sites — verified individually).
3. **`ExecutionEngine.run(...)`** (`/home/user/ZenithDentist-AI-agency/packages/agent-os/execution/ExecutionEngine.ts:26-185`):
   - Inserts `agent_executions` row, `status="running"` (lines 34-48).
   - Calls `ApprovalRuleEngine.checkApproval(agentId, actionType)` (line 50).
   - If `!autoApproved`: creates an `ApprovalRequestStore` row, sets execution status `pending_approval`, returns early (lines 51-76) — **no workflow execution occurs**, confirming approval gating is enforced before any side effect.
   - If approved: enters `try` block, calls `executeRegisteredAutomation(workflowId)` (line 82) only `if (input.workflowId)`.
   - On success: inserts `agent_actions` (status completed), `agent_results` (success:true), updates `agent_executions` to `completed`, then **if `input.revenueImpact` is set**, calls `AgentRevenueAttributionStore.recordAttribution(...)` (lines 118-127).
   - On throw (`catch`): inserts `agent_actions` (status failed) and `agent_results` (success:false), updates `agent_executions` to `status="failed"`, returns `{status:"failed", success:false, error: message}` — **no attribution write occurs on failure** (verified: `recordAttribution` call is inside the `try` block, after the workflow call succeeds, not duplicated in `catch`).
4. **`executeRegisteredAutomation(workflowId)`** — imported from `@/lib/automation-os/registry` (ExecutionEngine.ts:9) — this is the pre-existing Workflow OS entrypoint; ExecutionEngine does not reimplement it (confirmed by the file's own header comment, ExecutionEngine.ts:1-4, and by the absence of any inline workflow-execution logic in the file).
5. **`AgentRevenueAttributionStore.recordAttribution(...)`** (`/home/user/ZenithDentist-AI-agency/packages/agent-os/revenue/AgentRevenueAttributionStore.ts:34-57`) — inserts into `agent_revenue_attribution` with `agent_id`, `execution_id`, `tenant_id`, `revenue_type`, `revenue_amount`, `source_event`.

## Per-trigger path citations (all 14)

| # | Trigger | Detector entry | getAgentBySlug | ExecutionEngine.run call | workflowId passed |
|---|---|---|---|---|---|
| 1 | recall.overdue | detectors.ts:126 | detectors.ts:148 | detectors.ts:172 | `recall_recovery` |
| 2 | treatment.unscheduled/high_value | detectors.ts:211 | detectors.ts:232 | detectors.ts:250 | `treatment_acceptance` |
| 3 | patient.inactive | detectors.ts:66 | detectors.ts:89 | detectors.ts:100 | `patient_reactivation` |
| 4 | claim.aging.30/60/90 | detectors.ts:285 | detectors.ts:306 | detectors.ts:335 | `claim_recovery` |
| 5 | balance.overdue | detectors.ts:365 | detectors.ts:389 | detectors.ts:406 | `balance_recovery` |
| 6 | payment.failed | detectors.ts:433 | detectors.ts:453 | detectors.ts:469 | `payment_recovery` |
| 7 | appointment.no_show | detectors.ts:499 | detectors.ts:517 | detectors.ts:523 | `appointment_no_show` |
| 8 | schedule.open_slot | detectors.ts:559 | detectors.ts:581 | detectors.ts:587 | `open_chair_recovery` |
| 9 | schedule.gap_detected | detectors.ts:608 | detectors.ts:634 | detectors.ts:640 | `waitlist_fill` |
| 10 | appointment.completed (review request) | detectors.ts:668 | detectors.ts:687 | detectors.ts:693 | `review_request_due` |
| 11 | review.positive / patient.promoter | detectors.ts:724 | detectors.ts:745 | detectors.ts:765 | `patient_advocacy` / `referral_growth` |
| 12 | revenue.decline | detectors.ts:798 | detectors.ts:815 | detectors.ts:822 | `alice_revenue_opportunity_agent` |
| 13 | production.at_risk | detectors.ts:853 | detectors.ts:869 | detectors.ts:875 | `alice_revenue_opportunity_agent` |
| 14 | goal.missed | detectors.ts:896 | detectors.ts:916 | detectors.ts:931 | `alice_revenue_opportunity_agent` |

`runAllDetectors()` (detectors.ts:955-983) orchestrates all 15 detector functions (note: `detectRecallDue`, the legacy pre-Batch-11 detector, is also in this list — it does NOT go through ExecutionEngine, it uses the older `publishFunnelEvent`+`executeRegisteredAutomation` pattern directly, lines 48-63). This is a **pre-existing legacy trigger, not one of the 14 Batch 11-15 triggers**, and is excluded from the count above per the task's named-trigger list.

## Duplicate/parallel execution path check

Grepped the entire repo (excluding `node_modules` and test files) for `ExecutionEngine.run` call sites:

```
lib/automation/detectors.ts:100,172,250,335,406,469,523,587,640,693,765,822,875,931
```

**Result: exactly 14 call sites, all in `lib/automation/detectors.ts`, none anywhere else in `lib/`, `packages/`, or `app/`.** No second/parallel implementation of any of these 14 triggers exists. `packages/agent-os/revenue-intelligence/RecommendationEngine.ts` references `ExecutionEngine.run()` only in a comment (line 6), not a call — confirmed by reading the file; it does not independently dispatch executions.

Also grepped for a second definition of any detector function name (`detectInactivePatients`, `detectAgingClaims`, `detectNoShows`, etc.) anywhere else in the repo — all matches resolve to the single definitions in `lib/automation/detectors.ts`. No shadow/duplicate detector files found.

## Verdict

**PASS.** Full path traced and confirmed for all 14 triggers with no duplicate or parallel execution paths.
