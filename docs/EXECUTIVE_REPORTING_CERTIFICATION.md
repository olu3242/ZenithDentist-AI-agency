# Executive Reporting Certification
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Purpose:** Certify that every executive dashboard consumes real data — no mocks, no static fixtures

---

## 1. Client Portal Dashboard
**File:** `app/portal/page.tsx`

| Data Function | Source | Tables Queried | Status |
|---|---|---|---|
| `getPortalData()` | `lib/data/operations.ts` | `workflow_executions`, `revenue_attribution_records`, `patient_engagements`, `video_deliveries` | REAL DATA |
| `calculatePracticeHealth()` | `lib/health.ts` | Computed from `getPortalData()` metrics + benchmarks | REAL DATA |
| `generateOperationalInsights()` | `lib/data/operations.ts` | Derived from live metrics | REAL DATA |
| Benchmarking data | `tenantData.benchmarks[0]` | `benchmarks` table | REAL DATA |

**Verdict: REAL DATA**

---

## 2. Internal Mission Control
**File:** `app/internal/mission-control/page.tsx`

| Data Function | Source | Status |
|---|---|---|
| `getMissionControlState()` | `lib/stability.ts` | REAL DATA |

`getMissionControlState()` queries live Supabase tables for system health, event fabric status, and workflow execution counts. No static fallback data is returned.

**Verdict: REAL DATA**

---

## 3. Revenue Operations Center
**File:** `app/internal/revenue-attribution/` and revenue center pages

| Metric | Source Table | Status |
|---|---|---|
| No-show recovery revenue | `revenue_attribution_records` WHERE engine = `no_show_prevention` | REAL DATA |
| Treatment acceptance revenue | `revenue_attribution_records` WHERE engine = `treatment_acceptance` | REAL DATA |
| Referral revenue | `revenue_attribution_records` WHERE engine = `referral_engine` | REAL DATA |
| Chair fill revenue | `revenue_attribution_records` WHERE engine = `chair_fill` | REAL DATA |
| Video attribution totals | `video_attribution_records` grouped by `attribution_type` | REAL DATA |

**Verdict: REAL DATA** (attribution inserts confirmed functional this sprint)

---

## 4. Benchmarking Engine
**File:** `app/internal/benchmarking/` pages

| Metric | Source | Status |
|---|---|---|
| Practice health score | `calculatePracticeHealth()` from live metrics | REAL DATA |
| Industry benchmarks | `benchmarks` table | REAL DATA |
| Workflow performance | `workflow_executions` aggregates | REAL DATA |

**Verdict: REAL DATA**

---

## 5. Analytics Pages

| Page | Data Source | Status |
|---|---|---|
| Patient engagement analytics | `patient_engagements` table aggregates | REAL DATA |
| Video journey analytics | `video_deliveries` + `journey_outcomes` | REAL DATA |
| Recall recovery rate | `journey_outcomes` WHERE type = `recall_booked` | REAL DATA |
| Workflow execution log | `workflow_executions` | REAL DATA |

**Verdict: REAL DATA**

---

## 6. Executive OS / PROS Dashboards

Certified in previous sprint audits (`docs/EXECUTIVE_CENTER_CERTIFICATION.md`, `docs/PROS_V2_CANONICAL_BLUEPRINT.md`). No mock data sources identified in portal or executive route groups. All metric computations trace to Supabase query functions.

**Verdict: REAL DATA**

---

## Known Limitations

| Limitation | Impact |
|---|---|
| Stripe Customer Portal not implemented | Billing self-service data absent from portal |
| Dentrix/EagleSoft/Denticon PMS not connected | Patient volume metrics reflect Open Dental practices only |
| No real-time push updates | Dashboards refresh on page load; no WebSocket live feed |

---

## Overall Executive Reporting Certification

| Dashboard | Status |
|---|---|
| Portal (`portal/page.tsx`) | REAL DATA |
| Mission Control | REAL DATA |
| Revenue Attribution Center | REAL DATA |
| Benchmarking Engine | REAL DATA |
| Video Journey Analytics | REAL DATA |
| Patient Engagement Analytics | REAL DATA |

**Overall Verdict: REAL DATA — no mock data sources detected in executive reporting layer**
