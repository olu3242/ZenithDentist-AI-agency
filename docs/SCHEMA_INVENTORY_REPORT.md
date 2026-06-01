# Schema Inventory Report

Date: 2026-06-01

## Evidence Sources

- `supabase/migrations/`
- `lib/database.types.ts`
- Generated inventory: `DATABASE_INVENTORY.csv`

## Inventory Summary

- Tables created by migration SQL: 108
- Tables present in generated TypeScript database types: 83
- Tables created by migrations but not represented in `lib/database.types.ts`: 22
- Test/demo/audit-classified tables: 3
- Duplicate physical `CREATE TABLE public.<name>` definitions: 0 found

## Canonical Tables

Canonical status in this report means the table is created by migrations and represented in `lib/database.types.ts`.

Canonical table count: 83.

Examples include:

- `organizations`
- `organization_members`
- `locations`
- `profiles`
- `pms_integrations`
- `normalized_healthcare_events`
- `automation_events`
- `automation_traces`
- `automation_trace_events`
- `automation_dead_letters`
- `runtime_event_fabric_events`
- `operational_metrics`
- `insight_snapshots`
- `recommendations`
- `reports`
- `automation_registry`

## Deprecated Tables

No migration explicitly marks a table as deprecated.

## Test/Demo/Audit Tables

Classified by table name:

- `benchmark_events`
- `simulation_accuracy_events`
- `simulation_events`

## Orphaned Tables

These tables are created by migrations but are not present in `lib/database.types.ts`:

- `agent_logs`
- `analytics_events`
- `anomaly_events`
- `automation_failures`
- `automation_queue`
- `billing_events`
- `confidence_events`
- `enterprise_events`
- `forecasting_events`
- `intelligence_events`
- `intelligence_quality_events`
- `operational_risk_events`
- `optimization_events`
- `orchestration_dependency_events`
- `orchestration_events`
- `prediction_events`
- `recommendation_events`
- `recommendation_outcome_events`
- `resilience_events`
- `subscription_entitlements`
- `usage_counters`
- `workflow_runs`

## Duplicate Canonical Entities

Physical duplicate table names were not found.

Conceptual runtime duplication was found:

- `automation_events`
- `automation_traces`
- `workflow_runs`
- `automation_queue`
- `automation_failures`

These overlap around workflow/runtime execution evidence. Because `workflow_runs`, `automation_queue`, and `automation_failures` are not represented in generated database types, canonical runtime ownership is not fully certified.

## Result

FAIL

The schema inventory is complete enough to identify the database surface, but orphaned migration tables and overlapping runtime execution entities block migration safety certification.
