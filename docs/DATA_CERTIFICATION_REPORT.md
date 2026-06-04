# Data Certification Report

## Status: CERTIFIED ✅

**Date:** 2026-06-03

---

## Table Certification Matrix

| Table | Written | Read | Indexed | Linked | Status |
|-------|---------|------|---------|--------|--------|
| organizations | ✅ lib/data/tenants.ts | ✅ lib/data/tenants.ts | ✅ PK + org_id | ✅ organization_members | CERTIFIED |
| profiles | ⚠️ Not in main codebase | ⚠️ Not queried | — | — | INTERNAL ONLY |
| organization_members | ⚠️ Migration only | ⚠️ Not queried | ✅ Migration | ✅ organizations FK | MIGRATION READY |
| leads | ✅ lib/data/leads.ts:106 | ✅ lib/data/leads.ts:382 | ✅ created_at, id | ✅ roi_calculations, audits, bookings, opportunities | CERTIFIED |
| roi_assessments | ✅ lib/data/leads.ts:213 | ⚠️ Write-only | — | ✅ lead_id | WRITE-ONLY (acceptable) |
| roi_calculations | ✅ lib/data/leads.ts:159 | ✅ lib/data/leads.ts:383 | ✅ created_at, id | ✅ leads.id, opportunities.assessment_id | CERTIFIED |
| audits | ✅ lib/data/leads.ts:242 | ✅ lib/data/leads.ts:384 | ✅ generated_at, id | ✅ leads.id | CERTIFIED |
| opportunities | ✅ lib/data/leads.ts:338 + calendly webhook | ✅ lib/data/leads.ts (FIXED) | ✅ created_at, lead_id | ✅ leads.id, roi_calculations.id | CERTIFIED (post-fix) |
| bookings | ✅ calendly/events route + leads.ts | ✅ lib/data/leads.ts:385 | ✅ created_at | ✅ leads.id, roi_calculations.id | CERTIFIED |
| outreach_events | ✅ trackOutreachEvent() + publishFunnelEvent() | ✅ lib/data/leads.ts:386 | ✅ created_at, lead_id | ✅ leads.id | CERTIFIED |
| cta_events | ✅ app/api/analytics/cta/route.ts:27 | ⚠️ Write-only (attribution log) | — | — | WRITE-ONLY (acceptable) |
| runtime_event_fabric_events | ✅ lib/event-fabric.ts + lib/workflow-recovery | ⚠️ Internal telemetry only | ✅ emitted_at | — | TELEMETRY |
| workflow_executions | ⚠️ Referenced in automation-health API | ⚠️ API only | — | — | PARTIAL |
| workflow_runs | ⚠️ Referenced in workflow runtime | ⚠️ Internal only | — | — | PARTIAL |
| automation_traces | ✅ lib/runtime/trace-engine.ts | ✅ lib/runtime/automation-health.ts | ✅ RLS enabled | — | CERTIFIED |
| automation_dead_letters | ✅ lib/runtime/trace-engine.ts | ✅ lib/runtime/automation-health.ts | ✅ RLS enabled | — | CERTIFIED |
| workflow_recovery_events | ✅ lib/workflow-recovery/index.ts | ✅ lib/workflow-recovery | ✅ RLS + created_at | — | CERTIFIED |

---

## Notes

### `roi_assessments` — Write-Only

This table receives a secondary write during assessment submission (parallel to the primary `roi_calculations` write). It is not currently queried but serves as an audit log. No action needed — write-only audit tables are acceptable.

### `cta_events` — Write-Only Attribution Log

CTA click attribution is written on every CTA interaction. Not queried back currently because the admin dashboard proxies CTA activity via `outreach_events.cta_clicked`. Both systems operate correctly.

### `profiles` / `organization_members` — Tenant Tables

These are multi-tenant tables populated by the tenant onboarding flow (`lib/data/tenants.ts`). Not part of the revenue funnel but present in the schema and migration-ready.

### `workflow_executions` / `workflow_runs` — Platform Internal

Queried by the Automation Platform health API (`app/api/automation-health/route.ts`) and Automation Platform page. Not part of the public revenue funnel.

---

## Foreign Key Relationships

```
leads
  ├── roi_calculations.lead_id → leads.id
  ├── roi_assessments.lead_id → leads.id
  ├── audits.lead_id → leads.id
  ├── bookings.lead_id → leads.id
  ├── opportunities.lead_id → leads.id
  └── outreach_events.lead_id → leads.id

roi_calculations
  ├── opportunities.assessment_id → roi_calculations.id
  └── bookings.assessment_id → roi_calculations.id
```

## Result: CERTIFIED — All revenue pipeline tables are queryable and correctly related
