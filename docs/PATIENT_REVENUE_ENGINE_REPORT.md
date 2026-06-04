# Revenue Recovery System Report

## Overview

The Patient Revenue Operating System (PROS) is a multi-engine automation platform that captures, recovers, and attributes dental practice revenue across the full patient lifecycle. Each engine emits automation events via `lib/automation/runtime.ts` and is queryable for metrics.

---

## Revenue Engines

### 1. No-Show Prevention
- **Module**: `lib/revenue-engine/no-show-prevention.ts`
- **Workflow ID**: `appointment_no_show`
- **Trigger**: `appointment_scheduled`
- **Action**: `send_reminders` at T-48h, T-24h, T-2h
- **Metrics**: `getNoShowMetrics(organizationId)` — totalAppointments, noShows, noShowRate, preventedNoShows, estimatedRevenueProtected
- **Database**: `automation_events` (workflow = `appointment_no_show`)
- **Avg appointment value assumed**: $250

### 2. Recall Recovery
- **Module**: `lib/dental-revenue-os/recall-recovery.ts`
- **Workflow ID**: `recall_due`
- **Trigger**: `recall_due`
- **Action**: `prioritize_outreach`
- **Metrics**: `getRecallRecoveryMetrics(organizationId)` — events, total, booked
- **Database**: `recall_recovery_events`

### 3. Chair Fill (Waitlist + Cancellation Recovery)
- **Module**: `lib/revenue-engine/chair-fill.ts`
- **Workflow ID**: `recall_due`
- **Trigger**: `chair_fill_opportunity`
- **Action**: `notify_waitlist`
- **Metrics**: `getChairFillMetrics(organizationId)` — totalOpenSlots, filledSlots, fillRate, revenueRecovered
- **Database**: `chair_utilization_snapshots`

### 4. Treatment Acceptance Follow-Up
- **Module**: `lib/revenue-engine/treatment-acceptance.ts`
- **Workflow ID**: `ai_followup_required`
- **Trigger**: `treatment_plan_proposed`
- **Action**: `schedule_followup` (default: T+7 days)
- **Metrics**: `getAcceptanceMetrics(organizationId)` — totalProposed, totalAccepted, acceptanceRate, estimatedPipelineValue, recoveredValue
- **Database**: `revenue_recovery_events` (recovery_type = `treatment_acceptance`)

### 5. Review Growth
- **Module**: `lib/dental-revenue-os/review-growth.ts`
- **Workflow ID**: `review_request_due`
- **Trigger**: `review_request_due`
- **Metrics**: `getReviewGrowthMetrics(organizationId)`
- **Database**: `review_growth_events`

### 6. Referral Engine
- **Module**: `lib/revenue-engine/referral-engine.ts`
- **Workflow ID**: `lead_created`
- **Trigger**: `referral_detected`
- **Action**: `capture_referral`
- **Metrics**: `getReferralMetrics(organizationId)` — totalReferrals, convertedReferrals, conversionRate, totalReferralValue
- **Database**: `revenue_recovery_events` (recovery_type = `referral`)

---

## Revenue Attribution Engine

- **Module**: `lib/revenue-attribution/index.ts`
- **Functions**:
  - `getWorkflowAttribution(workflowId, organizationId, period)` — attribution for a single workflow
  - `getOrganizationRevenueSummary(organizationId, period)` — all-engine aggregate
- **Attribution breakdown**:
  - `recallRecovery` — from `recall_recovery_events.revenue_attributed`
  - `noShowPrevention` — from `revenue_recovery_events` (recovery_type = `no_show_prevention`)
  - `chairFill` — from `revenue_recovery_events` (recovery_type = `chair_fill`)
  - `treatmentAcceptance` — from `revenue_recovery_events` (recovery_type = `treatment_acceptance`)
  - `reviews` — from `review_growth_events.revenue_attributed`
  - `referrals` — from `revenue_recovery_events` (recovery_type = `referral`)
  - `other` — remaining `revenue_recovery_events`

---

## Database Tables Used

| Table | Engine |
|-------|--------|
| `automation_events` | No-Show Prevention, Patient Journey |
| `recall_recovery_events` | Recall Recovery, Attribution |
| `revenue_recovery_events` | Treatment Acceptance, Referrals, Attribution |
| `review_growth_events` | Review Growth, Attribution |
| `chair_utilization_snapshots` | Chair Fill |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/dental/revenue-summary` | GET | Aggregated revenue attribution. Query: `start`, `end` (YYYY-MM-DD) |
| `/api/dental/attribution` | GET | Per-workflow attribution. Query: `workflowId`, `start`, `end` |

---

## Workflow Triggers Per Engine

| Engine | Workflow ID | Trigger Name |
|--------|-------------|--------------|
| No-Show Prevention | `appointment_no_show` | `appointment_scheduled` |
| Recall Recovery | `recall_due` | `recall_due` |
| Chair Fill | `recall_due` | `chair_fill_opportunity` |
| Treatment Acceptance | `ai_followup_required` | `treatment_plan_proposed` |
| Review Growth | `review_request_due` | `review_request_due` |
| Referral Engine | `lead_created` | `referral_detected` |
