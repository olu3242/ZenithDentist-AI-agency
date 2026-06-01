# Revenue Operations Audit — PROS Sprint
**Generated:** 2026-06-01  
**Scope:** 6 Revenue Engines

---

## Revenue Engine Matrix

| Engine | File | Trigger | Action | Outcome | Attribution Bucket | API Route |
|--------|------|---------|--------|---------|-------------------|-----------|
| No-Show Prevention | `lib/revenue-engine/no-show-prevention.ts` | `appointment_scheduled` | `send_reminders` | Appointment confirmed | `noShowPrevention` | `/api/dental/revenue` |
| Recall Recovery | `lib/dental-revenue-os/recall-recovery.ts` | `recall_due` | `prioritize_outreach` | Recall appointment booked | `recallRecovery` | `/api/dental/recall` |
| Treatment Acceptance | `lib/revenue-engine/treatment-acceptance.ts` | `treatment_plan_proposed` | `schedule_followup` | Treatment accepted | `treatmentAcceptance` | `/api/dental/revenue` |
| Chair Fill | `lib/revenue-engine/chair-fill.ts` | `chair_fill_opportunity` | `notify_waitlist` | Open slot filled | `chairFill` | `/api/dental/chairs` |
| Review Generation | `lib/dental-revenue-os/review-growth.ts` | `review_request_due` | `send_review_request` | Review received | `reviews` | `/api/dental/reviews` |
| Referral Engine | `lib/revenue-engine/referral-engine.ts` | `referral_detected` | `capture_referral` | Referral converted | `referrals` | `/api/dental/revenue` |

---

## Engine Detail

### 1. No-Show Prevention
**File:** `lib/revenue-engine/no-show-prevention.ts`

- **Trigger Function:** `triggerNoShowPrevention(payload: NoShowPreventionPayload)`
- **Workflow ID:** `appointment_no_show`
- **Emit Path:** `emitAutomationEvent()` → `automation_events` table
- **Metrics Function:** `getNoShowMetrics(organizationId)` → queries `appointments` table
- **Revenue Metric:** `estimatedRevenueProtected = preventedNoShows × avgAppointmentValue`
- **Attribution Table:** `revenue_recovery_events` with `recovery_type = "no_show_prevention"`

**Payload Fields:** organizationId, patientId, appointmentId, scheduledAt, patientName, patientPhone, patientEmail, providerName, appointmentType

**Status:** Fully implemented. Uses `emitAutomationEvent()` (pre-Workflow OS path). Attribution via `revenue_recovery_events`.

---

### 2. Recall Recovery
**File:** `lib/dental-revenue-os/recall-recovery.ts`

- **Trigger Function:** `triggerRecallRecovery(organizationId, recallData: RecallData)`
- **Workflow ID:** `recall_due`
- **Emit Path:** `executeWorkflow()` → Workflow OS → Event Fabric (upgraded path)
- **Metrics Function:** `getRecallRecoveryMetrics(organizationId)` → queries `recall_recovery_events`
- **Revenue Metric:** `revenue_attributed` field per row; `booked` count from `appointment_booked = true`
- **Attribution Table:** `recall_recovery_events` (linked to `workflow_executions` via `workflow_execution_id` FK from migration 202606010002)

**Payload Fields:** patientId, recallType, outreachChannel, dueDate, metadata

**Status:** Fully implemented and uses `executeWorkflow()` (Workflow OS canonical path). Attribution FK wired.

---

### 3. Treatment Acceptance
**File:** `lib/revenue-engine/treatment-acceptance.ts`

- **Trigger Function:** `triggerTreatmentFollowUp(payload: TreatmentAcceptancePayload)`
- **Workflow ID:** `ai_followup_required`
- **Emit Path:** `emitAutomationEvent()` → `automation_events`
- **Metrics Function:** `getTreatmentAcceptanceMetrics(organizationId)` → queries `revenue_recovery_events` where `recovery_type = "treatment_acceptance"`
- **Revenue Metric:** `estimatedPipelineValue`, `recoveredValue`
- **Attribution Table:** `revenue_recovery_events` with `recovery_type = "treatment_acceptance"`

**Payload Fields:** organizationId, patientId, treatmentPlanId, estimatedValue, treatmentType, proposedAt, followUpDays (default 7)

**Status:** Implemented. Uses older `emitAutomationEvent()` path (not Workflow OS). Metrics query confirmed against `revenue_recovery_events`.

---

### 4. Chair Fill
**File:** `lib/revenue-engine/chair-fill.ts`

- **Trigger Function:** `triggerChairFill(payload: ChairFillPayload)`
- **Workflow ID:** `recall_due` (reuses recall workflow; chair fill is a trigger variant)
- **Trigger Name:** `chair_fill_opportunity`
- **Action:** `notify_waitlist`
- **Emit Path:** `emitAutomationEvent()` → `automation_events`
- **Metrics Function:** `getChairFillMetrics(organizationId)` → queries `chair_utilization_snapshots`
- **Revenue Metric:** `revenueRecovered = filledSlots × avgSlotValue`
- **Attribution Table:** `chair_utilization_snapshots` (linked via `workflow_execution_id` from migration 202606010002)

**Payload Fields:** organizationId, openSlotDate, openSlotTime, durationMinutes, providerName, notifyWaitlist

**Status:** Implemented. Reuses `recall_due` workflow ID — this is a known design compromise. Chair fill needs its own workflow definition to get proper attribution.

---

### 5. Review Generation
**File:** `lib/dental-revenue-os/review-growth.ts`

- **Trigger Function:** `triggerReviewRequest(organizationId, visitData: VisitData)`
- **Workflow ID:** `review_request_due`
- **Emit Path:** `executeWorkflow()` → Workflow OS (canonical path)
- **Metrics Function:** `getReviewGrowthMetrics(organizationId)` → queries `review_growth_events`
- **Revenue Metric:** `converted` flag, `revenue_attributed` per event, `avgRating`
- **Attribution Table:** `review_growth_events` (linked via `workflow_execution_id` FK)

**Payload Fields:** patientId, visitDate, platform, providerName, metadata

**Status:** Fully implemented with Workflow OS path. Attribution FK wired in migration 202606010002.

---

### 6. Referral Engine
**File:** `lib/revenue-engine/referral-engine.ts`

- **Trigger Function:** `triggerReferralWorkflow(payload: ReferralPayload)`
- **Workflow ID:** `lead_created`
- **Trigger Name:** `referral_detected`
- **Action:** `capture_referral`
- **Emit Path:** `emitAutomationEvent()` → `automation_events`
- **Metrics Function:** `getReferralMetrics(organizationId)` → queries `revenue_recovery_events` where `recovery_type = "referral"`
- **Revenue Metric:** `totalReferralValue`, `convertedReferrals`, `conversionRate`
- **Attribution Table:** `revenue_recovery_events` with `recovery_type = "referral"`

**Payload Fields:** organizationId, patientId, referralSource (google | internal | patient | provider), referredPatientName, estimatedValue

**Status:** Implemented. Uses `lead_created` workflow — a general lead workflow repurposed for referrals. A dedicated `referral_workflow` definition would improve attribution precision.

---

## Attribution Flow Summary

```
triggerXxx()
  → emitAutomationEvent() OR executeWorkflow()
    → automation_events / workflow_executions table
      → revenue event table (recall_recovery_events, revenue_recovery_events, etc.)
        → workflow_revenue_attribution VIEW
          → getWorkflowAttribution() / getOrganizationRevenueSummary()
            → /api/dental/attribution or /api/dental/revenue-summary
```

---

## Findings

1. **Workflow OS adoption is partial:** Recall Recovery and Review Generation use `executeWorkflow()` (canonical). No-Show, Treatment Acceptance, Chair Fill, and Referral use `emitAutomationEvent()` directly. All 6 should migrate to Workflow OS for consistent attribution.

2. **Chair Fill reuses recall_due workflow ID** — attribution will be conflated with recall events. Requires dedicated workflow definition.

3. **Referral Engine reuses lead_created workflow ID** — same issue. Referrals need `referral_workflow` definition.

4. **Attribution FK coverage:** Recall Recovery and Review Growth have `workflow_execution_id` FK via migration 202606010002. Revenue Recovery Events (used by No-Show, Chair Fill, Treatment Acceptance, Referral) also has the FK. Full attribution chain is structurally in place.
