# Executive Dashboard Certification

## Status: CERTIFIED ✅

**Date:** 2026-06-03

---

## Admin Revenue Dashboard — 9 Panels

All panels sourced from `getAdminDashboardData()` → live Supabase queries.

| Panel | Query Source | Calculation | Type |
|-------|-------------|-------------|------|
| Visitors | outreach_events WHERE event_type = 'cta_clicked' | count | REAL QUERY |
| Assessments Started | outreach_events WHERE event_type = 'assessment_started' (fallback: leads by source) | count | REAL QUERY |
| Assessments Completed | audits table | count | REAL QUERY |
| Audits Generated | audits table | count | REAL QUERY |
| Bookings | bookings WHERE booking_status = 'scheduled' | count | REAL QUERY |
| Show Rate | bookings WHERE booking_status = 'completed' / scheduled | % | REAL QUERY |
| Active Opportunities | opportunities WHERE stage NOT IN ('won','lost') | count | REAL QUERY (FIXED) |
| Pipeline Value | opportunities.pipeline_value SUM (fallback: roi_calculations × 12) | currency | REAL QUERY (FIXED) |
| Est. Recoverable Revenue | roi_calculations.revenue_recovery_opportunity SUM | currency | REAL QUERY |

---

## Executive Dashboard Page (`/mission-control`) — Panel Audit

| Panel | Data Source | Status |
|-------|-------------|--------|
| Recovery Orchestrator | workflow_recovery_events, workflow_recovery_actions | REAL QUERY |
| Dead Letter Explorer | automation_dead_letters | REAL QUERY |
| Operational Health | automation_traces | REAL QUERY |
| Workflow Registry | lib/workflow-os/workflow-runtime.ts | REAL QUERY |
| Runtime Health | lib/runtime/automation-health.ts | REAL QUERY |
| Revenue Pipeline | leads, roi_calculations, audits, bookings, opportunities | REAL QUERY |
| Event Stream | runtime_event_fabric_events | REAL QUERY |

---

## Pipeline Value Calculation

**Primary source (post-fix):** `opportunities.pipeline_value` — set at opportunity creation as `revenue_recovery_opportunity × 12` (annual)

**Fallback:** `roi_calculations.revenue_recovery_opportunity × 12` — used when no opportunity records exist (backward compatibility)

This ensures pipeline value reflects actual tracked revenue opportunities, not just historical ROI calculations.

---

## Workflow Health Metrics

Sourced from `app/api/automation-health/route.ts`:
- 24-hour workflow throughput
- Success rate percentage
- Dead letter queue depth
- Healing score (replayable / total dead letters)
- MTTR (mean time to recovery)

Displayed on: `/workflow-os`, `/runtime-os`, `/mission-control`

---

## Booking Metrics

| Metric | Table | Column | Filter |
|--------|-------|--------|--------|
| Scheduled | bookings | booking_status | = 'scheduled' |
| Completed | bookings | booking_status | = 'completed' |
| Show Rate | bookings | computed | completed / scheduled |

---

## Assessment Metrics

| Metric | Source | Notes |
|--------|--------|-------|
| Assessments Started | outreach_events (assessment_started type) | Now published pre-funnel |
| Assessments Completed | audits count | 1:1 with audit generation |
| Audit→Booking Rate | bookings / audits × 100 | Conversion rate |

---

## Result: CERTIFIED — All 9 admin panels and all Executive Dashboard panels verified as real queries with no mock data
