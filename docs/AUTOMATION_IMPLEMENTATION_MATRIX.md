# Automation Implementation Matrix

> **Platform Maturity Sprint — June 2026**
> All entries verified against codebase at `/home/user/ZenithDentist-AI-agency`.

## Automation Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and verified |
| ⚠️ | Partially implemented / stub present |
| ❌ | Not yet implemented |

---

## Core Automation Matrix

| Automation | Trigger | Library File | Workflow ID | Evidence Captured | Attribution Method | Status |
|---|---|---|---|---|---|---|
| **Recall Recovery** | `recall_due` | `lib/dental-revenue-os/recall-recovery.ts` | `recall_due` | `recall_recovery_events.appointment_booked`, `workflow_execution_id` | `recall_recovery_events.appointment_booked = true` → `revenue_attribution_records` | ✅ Production |
| **No-Show Prevention** | `appointment_scheduled` | `lib/revenue-engine/no-show-prevention.ts` | `appointment_no_show` | `automation_events` rows with `workflow = appointment_no_show`, `status = completed` | `preventedNoShows * avgAppointmentValue ($250)` via `getNoShowMetrics()` | ✅ Production |
| **Treatment Acceptance** | `ai_followup_required` | `lib/revenue-engine/treatment-acceptance.ts` | `ai_followup_required` | `revenue_recovery_events` where `recovery_type = 'treatment_acceptance'` | `amount_recovered` on `revenue_recovery_events` rows where `outcome = accepted` | ✅ Production |
| **Chair Fill** | `chair_fill_opportunity` | `lib/revenue-engine/chair-fill.ts` + `lib/dental-revenue-os/chair-utilization.ts` | `recall_due` | `chair_utilization_snapshots` (utilization_pct, revenue_per_hour, chairs_occupied) | `revenueRecovered` summed from `chair_utilization_snapshots.revenue_per_hour` | ✅ Production |
| **Review Growth** | `review_request_due` | `lib/dental-revenue-os/review-growth.ts` | `review_request_due` | `review_growth_events` (converted, star_rating, review_received_at, workflow_execution_id) | `converted = true` → indirect attribution (reputation → patient acquisition) | ✅ Production |
| **Referral Growth** | `lead_created` | `lib/revenue-engine/referral-engine.ts` | `lead_created` | `revenue_recovery_events` where `recovery_type = 'referral'` | `amount_recovered` on rows where `outcome = converted` | ✅ Production |

---

## Function Entry Points

| Automation | Trigger Function | Metrics Function |
|---|---|---|
| Recall Recovery | `triggerRecallRecovery(organizationId, RecallData)` | `getRecallRecoveryMetrics(organizationId)` |
| No-Show Prevention | `triggerNoShowPrevention(NoShowPreventionPayload)` | `getNoShowMetrics(organizationId)` |
| Treatment Acceptance | `triggerTreatmentFollowUp(TreatmentAcceptancePayload)` | `getAcceptanceMetrics(organizationId)` |
| Chair Fill | `triggerChairFill(ChairFillPayload)` | `getChairFillMetrics(organizationId)` |
| Review Growth | `triggerReviewRequest(organizationId, VisitData)` | `getReviewGrowthMetrics(organizationId)` |
| Referral Growth | `triggerReferralWorkflow(ReferralPayload)` | `getReferralMetrics(organizationId)` |

---

## Event Emission Layer

All six automations emit through one of two canonical paths:

1. **`emitAutomationEvent()`** — `lib/automation/runtime.ts`
   - Used by: No-Show Prevention, Treatment Acceptance, Chair Fill, Referral Growth
2. **`executeWorkflow()`** — `lib/workflow-os/workflow-engine.ts`
   - Used by: Recall Recovery, Review Growth

Both paths write a `workflow_executions` row and propagate through the Workflow OS state machine (`lib/workflow-os/workflow-state-machine.ts`).

---

## Database Tables Per Automation

| Automation | Primary Table | Secondary Tables |
|---|---|---|
| Recall Recovery | `recall_recovery_events` | `workflow_executions`, `patients` |
| No-Show Prevention | `automation_events` | `workflow_executions` |
| Treatment Acceptance | `revenue_recovery_events` | `workflow_executions` |
| Chair Fill | `chair_utilization_snapshots` | `workflow_executions` |
| Review Growth | `review_growth_events` | `workflow_executions` |
| Referral Growth | `revenue_recovery_events` | `leads` |

Attribution link added in migration `202606010002_revenue_attribution.sql`: `workflow_execution_id` FK added to `revenue_recovery_events`, `recall_recovery_events`, `review_growth_events`, `chair_utilization_snapshots`.

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
