# Dental Revenue OS — Technical Report

**Report Date:** 2026-05-30
**Build Status:** TypeScript zero errors, build passing
**Migration:** supabase/migrations/202605300001_dental_revenue_os.sql — 13 tables

---

## 1. Overview

The Dental Revenue OS is a domain-specific automation layer built on top of Workflow OS. It exposes seven modules, each responsible for a distinct revenue or operational surface of a dental practice. Every module routes through `executeWorkflow()` — no automation runs outside the engine. Modules are located under `lib/dental-revenue-os/`.

The system is designed around three layers:

1. **Event publication** — `publishDentalEvent()` emits structured events to Event Fabric, which Mission Control and AI OS consume.
2. **Workflow execution** — all patient-touching actions go through the Workflow OS state machine.
3. **Telemetry persistence** — outcomes write to Supabase tables created in the `202605300001` migration.

---

## 2. Module Inventory

### 2.1 Patient Recovery (`patient-recovery.ts`)

**Purpose:** Re-engage patients who have not visited in a configurable inactivity window.

**Trigger workflow:** `reactivation_candidate_detected`
**Action:** `queue_reactivation`

**Input interface:**
```typescript
interface PatientData {
  patientId: string;
  lastVisitDate?: string;
  treatmentValue?: number;
  outreachChannel?: string;
  metadata?: Record<string, unknown>;
}
```

**Metrics function:** `getPatientRecoveryMetrics(organizationId)` — queries `revenue_recovery_events` table and returns `{ events, total, totalRecovered }`.

**Scoring contribution to Practice Health:** `Math.min(100, patientRec.total * 5)` — 5 points per recorded event, capped at 100.

---

### 2.2 Recall Recovery (`recall-recovery.ts`)

**Purpose:** Outreach to patients whose hygiene recall date has passed.

**Trigger workflow:** `recall_due` (SLA: 30 minutes)
**Action:** `prioritize_outreach`

**Input interface:**
```typescript
interface RecallData {
  patientId: string;
  recallType?: string;
  outreachChannel?: string;
  dueDate?: string;
}
```

**Metrics function:** `getRecallRecoveryMetrics(organizationId)` — queries `recall_recovery_events`. Returns `{ events, total, booked }` where `booked` is the count of rows with `appointment_booked = true`.

**DB table:** `recall_recovery_events` with columns: `recall_type`, `outreach_channel`, `appointment_booked` (boolean), `revenue_attributed` (numeric).

**Scoring:** Recall booking rate: `Math.round((booked / total) * 100)`, used as `recallScore` (0–100) in the composite health score.

---

### 2.3 Review Growth (`review-growth.ts`)

**Purpose:** Post-visit review request dispatch and conversion tracking.

**Trigger workflow:** `review_request_due` (SLA: 120 minutes)
**Action:** `send_review_request`

**Input interface:**
```typescript
interface VisitData {
  patientId: string;
  visitDate?: string;
  platform?: string;
  providerName?: string;
}
```

**Metrics function:** `getReviewGrowthMetrics(organizationId)` — queries `review_growth_events`. Returns `{ events, total, converted, avgRating }`.

**DB table:** `review_growth_events` with `star_rating integer check (star_rating between 1 and 5)`, `converted boolean`, `request_sent_at`, `review_received_at`.

**Scoring:** `reviewScore = Math.round((converted / total) * 100)`.

---

### 2.4 Chair Utilization (`chair-utilization.ts`)

**Purpose:** Snapshot-based tracking of chair occupancy and revenue per chair.

**No workflow trigger.** Data is written directly to Supabase via `recordChairUtilization()`.

**Input interface:**
```typescript
interface ChairUtilizationSnapshot {
  locationId?: string;
  snapshotDate: string;
  totalChairs: number;
  occupiedHours: number;
  availableHours: number;
  revenuePerChair?: number;
}
```

**Computed field:** `utilizationPct = (occupiedHours / availableHours) * 100` computed on insert.

**Metrics function:** `getChairUtilizationMetrics(organizationId)` — returns `{ snapshots, avgUtilization }`. Average is computed in-process across all returned rows.

**DB table:** `chair_utilization_snapshots` — indexed by `organization_id` and `snapshot_date`. Linked to `practice_locations` via `location_id` FK.

**Scoring:** `chairScore = Math.min(100, Math.round(avgUtilization))`.

**Fallback:** Mission Control's Dental Revenue Center uses `72` as an industry-baseline fallback when no snapshots exist.

---

### 2.5 Insurance Verification (workflow, no dedicated module file)

**Trigger workflow:** `insurance_verification` (SLA: 30 minutes)
**Triggers:** `appointment scheduled`, `insurance on file expired`, `verification window reached`
**Dependencies:** `billing_sync` (integration not yet wired — marked DISCONNECTED)

Included in the Scale and Enterprise packages only. Workflow is registered in `lib/automation/registry.ts`. No dedicated `insurance-verification.ts` module exists; this module is currently delivered by the registry definition.

---

### 2.6 Treatment Follow-Up (workflow, no dedicated module file)

**Trigger workflow:** `treatment_followup` (SLA: 60 minutes)
**Triggers:** `treatment plan accepted`, `treatment completed`, `post-op window reached`

Included in Scale and Enterprise packages. Registered in the automation registry. No dedicated TS module; the registry blueprint governs its behavior.

---

### 2.7 Practice Health (`practice-health.ts`)

**Purpose:** Composite health score aggregating all five active metric sources.

**Computation:** `computePracticeHealthScore(organizationId)` calls five metric functions in parallel:
- `getRevenueRecoverySummary` → `revenueScore`
- `getRecallRecoveryMetrics` → `recallScore`
- `getReviewGrowthMetrics` → `reviewScore`
- `getChairUtilizationMetrics` → `chairScore`
- `getPatientRecoveryMetrics` → `patientScore`

**Score formula:** `Math.round((revenueScore + recallScore + reviewScore + chairScore + patientScore) / 5)`

**Extended summary:** `getPracticeHealthSummary()` returns the score plus raw metrics: `totalRevenuRecovered`, `recallBookingRate`, `reviewConversionRate`, `avgChairUtilization`, `avgReviewRating`.

Note: There is a typo in the field name `totalRevenuRecovered` (missing 'e') in the exported interface — it appears at line 25 of `practice-health.ts`.

---

## 3. Revenue Recovery Module (`revenue-recovery.ts`)

**Purpose:** Records and queries revenue recovery events from any workflow.

**Functions:**
- `recordRevenueRecoveryEvent(organizationId, event)` — inserts into `revenue_recovery_events`
- `getRevenueRecoverySummary(organizationId)` — returns `{ events, total, totalRecovered, byType }`

`byType` is a record keyed by `recovery_type` summing `amount_recovered` per category.

---

## 4. Event System (`dental-events.ts`)

Seven canonical event type constants are exported:

| Constant | Value |
|---|---|
| `REVENUE_RECOVERED` | `dental.revenue.recovered` |
| `PATIENT_REACTIVATED` | `dental.patient.reactivated` |
| `RECALL_COMPLETED` | `dental.recall.completed` |
| `REVIEW_GENERATED` | `dental.review.generated` |
| `INSURANCE_VERIFIED` | `dental.insurance.verified` |
| `TREATMENT_ACCEPTED` | `dental.treatment.accepted` |
| `PRACTICE_HEALTH_CHANGED` | `dental.practice.health_changed` |

**Publication function:** `publishDentalEvent(eventType, organizationId, payload)` — routes through `publishEvent()` from `lib/event-fabric`. Sets:
- `event_source: "workflow_os"`
- `priority: "moderate"`
- `workflow_id: payload.workflow_id ?? "dental_revenue_os"`

---

## 5. Workflow OS Integration

Every patient-action function calls `executeWorkflow()` from `lib/workflow-os/workflow-engine.ts`:

```typescript
executeWorkflow({
  workflowId: "recall_due",
  organizationId,
  triggerName: "recall_due",
  actionName: "prioritize_outreach",
  payload: { patient_id, recall_type, outreach_channel, due_date },
  initiatedBy: "system",
})
```

`executeWorkflow()` enforces:
1. Workflow must exist in the registry (`assertWorkflowExists`)
2. State transition must be legal (`assertLegalTransition("registered", "scheduled")`)
3. SLA is resolved from the workflow version
4. Execution is delegated to `emitAutomationEvent()` (automation runtime)
5. A `workflow.execution.started` event is published to the Runtime Event Fabric

---

## 6. State Machine (11 States)

Defined in `lib/workflow-os/workflow-state-machine.ts`:

```
registered → scheduled → queued → executing → waiting | paused
  → completed | failed | cancelled | replayed | escalated
```

**Terminal states:** `completed`, `cancelled`
**Active states:** `executing`, `waiting`, `paused`
**Recoverable states:** `failed`, `escalated`

`paused` and `escalated` transitions require operator approval via ALICE governance.

---

## 7. Database Schema (13 Tables from Migration)

| Table | Key Columns |
|---|---|
| `practice_profiles` | `organization_id`, `practice_name`, `npi`, `specialty` |
| `practice_locations` | `organization_id`, `practice_id`, `is_primary` |
| `practice_metrics` | `metric_date`, `production_amount`, `no_show_count`, `hygiene_production` |
| `revenue_recovery_events` | `recovery_type`, `amount_recovered`, `status`, `outcome` |
| `recall_recovery_events` | `recall_type`, `outreach_channel`, `appointment_booked`, `revenue_attributed` |
| `review_growth_events` | `platform`, `star_rating`, `converted`, `request_sent_at`, `review_received_at` |
| `chair_utilization_snapshots` | `snapshot_date`, `total_chairs`, `utilization_pct`, `revenue_per_chair` |
| `discovery_sessions` | `session_type`, `conducted_by`, `pain_points`, `qualified` |
| `practice_assessments` | `health_score`, `revenue_score`, `retention_score`, `reputation_score` |
| `opportunity_scores` | `opportunity_type`, `score`, `confidence`, `estimated_value` |
| `roi_projections` | `projection_period`, `projected_revenue`, `actual_revenue`, `variance_pct` |
| `automation_baselines` | `automation_id`, `metric_name`, `baseline_value`, `sample_size` |
| `automation_results` | `automation_id`, `baseline_id`, `result_value` |
| `impact_measurements` | `delta_value`, `delta_pct`, `measured_at` |

All 13 tables have:
- `organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `deleted_at timestamptz` (soft-delete)
- `created_at`, `updated_at` with trigger `set_updated_at()`
- Row-level security ENABLED with a `"org members read"` SELECT policy

**RLS note:** Policies are defined in the migration SQL but the service client (`createServiceClient`) bypasses RLS by using the service role key. Customer-facing portal queries should use the anon/user client, not service client, for RLS to be effective. This is a current gap.

---

## 8. ALICE Grounding

ALICE Dental (`lib/ai-os/alice-dental.ts`) reads from these modules through:
- `computeTenantRoi(organizationId)` — derived from workflow analytics and recovery events
- `getWorkflowAnalyticsSummary()` — KPI map per workflow including `successRate`, `failureRate`, `slaBreachCount`

ALICE uses KPI failure rates to estimate recovery opportunity values:
- Recall: `failureRate * totalExecutions * 2.5` ($ per failed execution)
- Reactivation: `failureRate * totalExecutions * 2.8`

---

## 9. Dashboard Surfaces

**Dental Revenue Center** (`lib/mission-control/dental-revenue-center.ts`) exposes:
- `practiceHealthScore` (0–100, weighted: success 35%, recall 30%, chair 20%, ROI 15%)
- `revenueRecoveredMtd`
- `recallRecoveryRate`
- `reviewGrowthMtd` (MTD count from `review_growth_events`)
- `chairUtilizationRate` (falls back to 72% industry baseline)
- `operationalEfficiencyScore = (overallSuccessRate * 0.5 + overallRecoveryRate * 0.5)`
- `revenueOpportunities[]` — dynamically computed from workflow KPI failure rates

**Client Success Dashboard** (`lib/client-success-os/success-dashboard.ts`) additionally exposes:
- `recoveredRevenue`, `recoveredPatients`, `reviewGrowth`, `recallRecoveryRate`
- `workflowHealth: "healthy" | "degraded" | "critical"` (thresholds: ≥75 healthy, ≥50 degraded)
- `automationStatus[]` per workflow
- `openTickets`, `closedTickets` from `support_tickets` table (graceful fallback if table absent)

---

## 10. Known Gaps and Issues

| Gap | Location | Severity |
|---|---|---|
| `insurance_verification` has no dedicated module file | Registry only | Medium |
| `treatment_followup` has no dedicated module file | Registry only | Medium |
| `createServiceClient` bypasses RLS on all queries | All modules | High |
| `totalRevenuRecovered` typo in exported interface | `practice-health.ts:25` | Low |
| OpenDental integration MOCKED — recall/no-show data not live | `lib/open-dental.ts` | High |
| Twilio DISCONNECTED — SMS outreach channel non-functional | Integration layer | High |
| Chair utilization queries use hardcoded 72% fallback | `dental-revenue-center.ts:39` | Medium |
