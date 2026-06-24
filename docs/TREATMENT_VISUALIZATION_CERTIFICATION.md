# Treatment Visualization Journey Certification
**Sprint:** release/platform-convergence
**Date:** 2026-06-24
**Source:** `lib/treatment-visualization/index.ts`, `lib/patient-journey/index.ts`, `lib/automation-registry.ts`, `lib/dental-automation-library.ts`, `lib/aps.ts` (Growth Score), `app/portal/treatment-visualization/page.tsx`, `app/portal/reports/page.tsx`, `tests/treatment-visualization/treatment-visualization.test.ts`

---

## Overview

The Treatment Visualization Agent (TVA) journey generates patient-facing treatment
education (overview, expected outcome, recovery timeline, FAQ) for unscheduled
high-value treatment plans, delivers it to the patient, tracks engagement, and
attributes downstream acceptance revenue. This report certifies each deliverable
against the original directive.

---

## Deliverable Certification

### 1. Migration
| Field | Value |
|---|---|
| Tables | `treatment_visualizations`, `treatment_media` |
| Columns | status lifecycle (`pending` → `education_sent` → `viewed` → `accepted`/`failed`), `retry_count`, `treatment_code`, `treatment_value`, `organization_id`, `patient_id` |
| **Verdict** | **PASS** |

### 2. Agent Wiring
| Field | Value |
|---|---|
| Agent | TVA registered via `getAgentBySlug`, invoked through `ExecutionEngine.run` |
| Failure mode | `createTreatmentVisualization` fails fast with `tva_agent_not_registered` if the agent is not registered, and marks the row `failed` with the propagated error if execution fails |
| Retry | `retryTreatmentVisualization` re-runs the agent for `failed` rows, increments `retry_count`, and no-ops for non-failed rows |
| **Verdict** | **PASS** |

### 3. Workflow Wiring
| Field | Value |
|---|---|
| Registration | Blueprint entry added to `automationRegistry` and `dentalAutomationLibrary`; no separate Workflow OS registration required since `assertWorkflowExists` derives directly from `automationRegistry` |
| **Verdict** | **PASS** |

### 4. Portal Integration
| Field | Value |
|---|---|
| Route | `/portal/treatment-visualization` — education pipeline KPIs, revenue influence, acceptance risk, and per-treatment education content (overview, expected outcome, recovery timeline, FAQ) |
| Navigation | Added to `portalNavItems` in `lib/navigation.ts` using the existing unused `BookOpenCheck` icon |
| Reporting | Added as an independent section in `app/portal/reports/page.tsx` (education engagement, acceptance lift, revenue influence) without altering `ExecutiveReport`'s fixed stat-grid contract |
| **Verdict** | **PASS** |

### 5. Revenue Attribution
| Field | Value |
|---|---|
| Education sent | `AgentRevenueAttributionStore.recordAttribution` called with `revenueType: "treatment_visualization_sent"` |
| Treatment accepted | `recordTreatmentAcceptance` calls `recordAttribution` with `revenueType: "treatment_visualization"` and the accepted dollar value |
| **Verdict** | **PASS** |

### 6. APS Integration
| Field | Value |
|---|---|
| Growth Score | New dimension added to the Growth Score model; `WEIGHTS` rebalanced to continue summing to 100 |
| **Verdict** | **PASS** |

### 7. Mission Control Integration
| Field | Value |
|---|---|
| Detection | `detectUnscheduledTreatmentForVisualization` added to `runAllDetectors()`, following the existing `detectUnscheduledTreatment` proxy pattern (`roi_calculations.recoverable_revenue` joined to `leads.status`), scoped to the high-value threshold, with `tenantId: "global"` (matching the schema's lack of `organization_id` on `leads`) |
| **Verdict** | **PASS** |

### 8. Analytics Integration
| Field | Value |
|---|---|
| Events tracked | `treatment_visualization.education_sent`, `treatment_visualization.education_viewed`, `treatment_visualization.treatment_accepted`, `treatment_visualization.revenue_generated` |
| Storage | Written to the existing `analytics_events` table via `trackTreatmentVisualizationEvent`, `destination: "internal"` |
| Patient lifecycle | `advancePatientLifecycle` invoked with `treatment_planned → treatment_visualization_pending` (education sent) and `treatment_visualization_pending → treatment_accepted` (accepted); `treatment_visualization_pending` added to the lifecycle state machine in `lib/patient-journey/index.ts` |
| **Verdict** | **PASS** |

### 9. E2E Test Coverage
| Field | Value |
|---|---|
| Suite | `tests/treatment-visualization/treatment-visualization.test.ts` |
| Coverage | Happy path (education generation → send → lifecycle advance → revenue attribution → analytics), ExecutionEngine failure path, unregistered-agent failure path, retry path (re-run + supersede), retry no-op for non-failed state, education engagement recording, treatment acceptance recording, raw analytics event tracking |
| Result | 8/8 tests passing |
| **Verdict** | **PASS** |

### 10. Certification Report
| Field | Value |
|---|---|
| This document | `docs/TREATMENT_VISUALIZATION_CERTIFICATION.md` |
| **Verdict** | **PASS** |

---

## Verification Results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npm run lint` | Clean (no warnings or errors) |
| `npm test` (vitest, full suite) | 168/168 passing across 17 files |
| `npm run build` | Succeeded — `/portal/treatment-visualization` and dependent routes compile |

---

## Summary

| Deliverable | Verdict |
|---|---|
| Migration | PASS |
| Agent Wiring | PASS |
| Workflow Wiring | PASS |
| Portal Integration | PASS |
| Revenue Attribution | PASS |
| APS Integration | PASS |
| Mission Control Integration | PASS |
| Analytics Integration | PASS |
| E2E Test Coverage | PASS |
| Certification Report | PASS |

**10/10 deliverables: PASS.**
**Overall Treatment Visualization Journey Certification: PASS for pilot**
