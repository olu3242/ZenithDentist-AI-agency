# Agent Trigger Matrix (Batch 11-15)

| Trigger | Agent | Automation | Detector Function | Workflow Blueprint |
|---|---|---|---|---|
| recall.overdue (6/12/18mo tiers) | IVY | Recall Recovery | `detectRecallOverdue` | `recall_recovery` |
| patient.inactive | IVY | Patient Reactivation | `detectInactivePatients` (existing, extended) | `patient_reactivation` |
| treatment.unscheduled | IVY | Treatment Acceptance | `detectUnscheduledTreatment` | `treatment_acceptance` |
| treatment.high_value | IVY | Treatment Acceptance (priority) | `detectUnscheduledTreatment` (high-value filter) | `treatment_acceptance` |
| claim.aging.30 | FINN | Claim Recovery | `detectAgingClaims` | `claim_recovery` |
| claim.aging.60 | FINN | Claim Recovery (escalation) | `detectAgingClaims` | `claim_recovery` |
| claim.aging.90 | FINN | Claim Recovery (escalation) | `detectAgingClaims` | `claim_recovery` |
| balance.overdue | FINN | Balance Recovery | `detectOverdueBalances` | `balance_recovery` |
| payment.failed | FINN | Payment Recovery | `detectFailedPayments` | `payment_recovery` |
| appointment.no_show | MAX | No-show Recovery | `detectNoShows` (existing) | `appointment_no_show` (existing) |
| appointment.cancelled | MAX | Open Chair Recovery | reuses Batch C cancellation handler | `appointment_cancelled` (existing) |
| schedule.open_slot | MAX | Open Chair Recovery | `detectOpenSlots` | `open_chair_recovery` |
| schedule.gap_detected | MAX | Waitlist Fill | `detectScheduleGaps` | `waitlist_fill` |
| appointment.completed | NOVA | Review Generation | `detectReviewRequests` (existing, renamed trigger) | `review_request` (existing) |
| review.positive | NOVA | Patient Advocacy | `detectPromoters` | `patient_advocacy` |
| patient.promoter | NOVA | Referral Growth | `detectPromoters` | `referral_growth` |
| revenue.decline | ALICE | Revenue Leakage Detection | `detectRevenueLeaks` (existing, extended) | `alice_revenue_opportunity_agent` (existing) |
| production.at_risk | ALICE | Opportunity Detection | `detectProductionRisk` | `alice_revenue_opportunity_agent` |
| goal.missed | ALICE | Executive Recommendations | `detectGoalMiss` | `alice_revenue_opportunity_agent` |

All detector functions live in `lib/automation/detectors.ts` (extended, not replaced) and are invoked from `runAllDetectors()` / `/api/automation/scan`, the existing cron-protected route. Each detector now calls `ExecutionEngine.run({ agentId, tenantId, eventType: trigger, payload, workflowId })` instead of calling `executeRegisteredAutomation` directly, so every workforce action is agent-attributed, approval-gated, and revenue-attributable through the existing Batch 1-10 plumbing.
