# Dashboard Coverage Report

Generated: 2026-06-01

## Summary

Dashboard shell and major panels compile, but live data coverage is blocked/degraded by the invalid Supabase service-role key.

## Widget Coverage

| Area | UI Exists | API/Lib Connected | Database Connected | Real Data Status | Mock/Fallback Risk |
| --- | --- | --- | --- | --- | --- |
| Practice Dashboard | YES | YES | PARTIAL | BLOCKED/DEGRADED | Empty fallback if service client unavailable. |
| Recall Pipeline | PARTIAL | YES | PARTIAL | BLOCKED/DEGRADED | Data comes through operational metrics/events where available. |
| Appointments | PARTIAL | NO dedicated API | UNKNOWN | NOT VERIFIED | No dedicated requested API route. |
| Outreach Log | PARTIAL | NO dedicated API | UNKNOWN | NOT VERIFIED | No dedicated requested API route. |
| Reviews | PARTIAL | NO dedicated API | UNKNOWN | NOT VERIFIED | No dedicated requested API route. |
| Revenue Recovery | YES | YES | PARTIAL | BLOCKED/DEGRADED | Derived from Supabase data or empty fallback. |
| Campaigns | PARTIAL | YES | PARTIAL | BLOCKED/DEGRADED | Automation/event state requires service-role access. |
| ROI Calculator | YES | YES | PARTIAL | PARTIAL | Existing admin ROI route; live persistence depends on DB access. |
| Automation Dashboard | YES | YES | PARTIAL | BLOCKED/DEGRADED | Automation registry can render but live execution counts require DB/runtime data. |

## Evidence

Key data modules:

- `lib/data/operations.ts`
- `lib/data/tenants.ts`
- `lib/data/leads.ts`
- `lib/runtime/automation-health.ts`
- `lib/automation-os/registry.ts`

Fallback pattern:

- `createServiceClient()` returns `null` when no usable service-role key exists.
- Several modules return empty operational data to keep pages renderable.

## Current Readiness

Dashboard UI: `PARTIAL`

Dashboard live-data readiness: `BLOCKED` until `SUPABASE_SERVICE_ROLE_KEY` is replaced with a real service-role key.

