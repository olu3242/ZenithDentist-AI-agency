# Foreign Key Certification Report

Date: 2026-06-01

## Evidence Sources

- `supabase/migrations/`
- Static SQL reference scan

## Required Areas

| Area | Evidence | Result |
| --- | --- | --- |
| patients | No `patients` table in migrations | FAIL |
| appointments | No `appointments` table in migrations | FAIL |
| workflows | `workflow_runs.workflow_id` exists, but no FK to workflow registry | FAIL |
| executions | `automation_traces` and `workflow_runs` exist, but no canonical `workflow_executions` table | FAIL |
| events | `automation_trace_events.trace_id` references `automation_traces(trace_id)` | PASS |
| analytics | `analytics_events.lead_id` references `leads(id)`; `operational_metrics` has tenant/location references added later | PARTIAL |
| attribution | No dedicated attribution table; attribution stored as JSON | FAIL |

## Broken Ordering Evidence

`046_production_hardening_operational_tables.sql` references tables that sort later in the local migration chain:

- `public.organizations`
- `public.leads`
- `public.automation_events`

This is a migration-chain foreign-key blocker.

## Orphaned Row Validation

NOT CERTIFIED

No linked database connection was available, so live orphan-row queries could not be executed.

## Result

FAIL

Foreign key integrity cannot be certified because required domain tables are absent, key runtime tables are noncanonical/orphaned from generated types, and live orphan validation was not possible.
