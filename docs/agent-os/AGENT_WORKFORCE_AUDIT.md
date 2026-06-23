# Agent Workforce Audit (Batch 11-15 Phase 0)

**Branch:** feature/agent-workforce-revenue-factory (off feature/agent-os-governance-intelligence, which has Batches 1-10 merged)

## Existing Capabilities Inventory

| Capability | Implementation | Reuse Plan for Batch 11-15 |
|---|---|---|
| Agent Registry | `agent_registry`/`agent_capabilities`/`agent_tools`/`agent_metrics` (migration 202606220001); IVY/FINN/MAX/NOVA/ALICE already seeded | No new registry rows needed — workforce automations attach to existing agent_id rows |
| Agent Router | `packages/agent-os/router/{AgentRouter,AgentResolver,AgentDispatcher,AgentRegistry}.ts` | Extend `AgentResolver`'s static eventType→agent table with the new trigger names below (recall.overdue→ivy, claim.aging.30→finn, etc.) — additive entries only |
| Agent Memory | `packages/agent-os/memory/*` (202606220002) | Workforce automations write segment/campaign state into `agent_memory`, not new tables |
| Execution Engine | `packages/agent-os/execution/ExecutionEngine.ts` (202606220003, extended Batch 8 with approval gate + revenue attribution hook) | Every workforce automation MUST call `ExecutionEngine.run()` — no new execution path |
| Revenue Attribution | `packages/agent-os/revenue/AgentRevenueAttributionStore.ts` (202606220004) | `revenueImpact` field on `ExecutionEngine.run()` is the only way workforce automations record dollars |
| Approval Framework | `packages/agent-os/approvals/*` (202606220005) | Mass campaigns / bulk outreach in IVY/NOVA automations route through existing `ApprovalRuleEngine` — no new approval table |
| Learning System | `packages/agent-os/learning/*` (202606220006) | Conversion/response rates feed `agent_learning_events`/`agent_performance_scores` via existing stores |
| Agent Analytics | `packages/agent-os/analytics/*` | `AgentScorecardEngine`/`AgentAnalyticsEngine` already compute per-agent stats from `agent_executions`/`agent_revenue_attribution` — workforce automations populate the underlying tables, analytics need no changes |
| Mission Control Agent Center | `app/mission-control/agents/page.tsx` | Phase 6 extends this existing route with a "Revenue Workforce" section, not a new page tree |
| Runtime OS | `lib/runtime/instrumentation.ts`, `lib/runtime/trace-engine.ts` | Untouched — `executeRegisteredAutomation` already calls into this |
| Workflow OS | `lib/workflow-os/*`, `lib/automation/registry.ts`, `lib/automation-os/registry.ts:executeRegisteredAutomation` | Each workforce automation maps to ONE existing or new `AutomationBlueprint` + `executeRegisteredAutomation(workflowId)` call inside `ExecutionEngine.run({..., workflowId})` |
| Communication channels | `lib/adapters/{email-adapter,sms-adapter}.ts` (real Resend/Twilio, Batch C remediation) | Reused directly — no new adapters |
| Detection / cron triggers | `lib/automation/detectors.ts`, `/api/automation/scan`, `vercel.json` cron | New trigger names (recall.overdue, claim.aging.30/60/90, schedule.gap_detected, etc.) are added as new detector functions in this same file/pattern, not a new cron system |

## Existing Triggers (before this batch)

`lib/workflow-os/workflow-router.ts:TRIGGER_MAP` — 10 triggers already mapped to workflows. `lib/automation/detectors.ts` — 5 detectors (recall_due, inactive_patients, no_shows, review_requests, revenue_leaks) already running on a 4h cron.

## Existing Approval Requirements

`agent_approval_rules` (Batch 8) already encodes: auto-approve = appointment_reminder, review_request, patient_education, recall_notification, status_update; approval-required = mass_campaign, financial_adjustment, custom_ai_message, bulk_patient_outreach, high_risk_operation. Batch 11-15 automations classify their actions into these existing categories — no new rule taxonomy invented.

## Extension Points Identified

1. `lib/automation/detectors.ts` — add new detector functions for the new trigger registry (recall.overdue tiers, claim.aging.30/60/90, treatment.unscheduled, schedule.gap_detected, appointment.completed, etc.), each calling `ExecutionEngine.run()` instead of `executeRegisteredAutomation` directly going forward (detectors become agent-aware).
2. `AgentResolver.ts` routing table — additive entries for new event types.
3. `lib/automation/registry.ts` — new `AutomationBlueprint` entries per automation (Recall Recovery, Treatment Acceptance, Patient Reactivation, Claim Recovery, Balance Recovery, Payment Recovery, No-show Recovery, Open Chair Recovery, Waitlist Fill, Review Generation, Referral Growth, Patient Advocacy) so each still has a real Workflow OS blueprint.
4. `packages/agent-os/revenue-intelligence/` — new package (ALICE-only, Phase 5), reading existing `roi.ts`/`revenue-attribution` data, not replacing it.
5. `app/mission-control/agents/page.tsx` — additive "Revenue Workforce" section.
