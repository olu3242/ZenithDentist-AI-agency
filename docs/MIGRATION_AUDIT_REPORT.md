# Migration Audit Report

Date: 2026-06-01

## Evidence Sources

- `supabase/migrations/`
- `supabase migration list`

## Migration Files Found

16 migration files exist.

- `040_runtime_trace_system.sql`
- `041_operational_memory_incidents.sql`
- `042_governance_self_healing.sql`
- `043_operational_cloud_mesh.sql`
- `044_gap_closure_platformization.sql`
- `045_gtm_delivery_growth.sql`
- `046_production_hardening_operational_tables.sql`
- `202605210001_phase4_production_schema.sql`
- `202605210002_phase5_ai_operations.sql`
- `202605210003_phase6_multitenant_saas.sql`
- `202605210004_phase7_8_autonomous_os.sql`
- `202605210005_phase10_11_healthcare_cloud.sql`
- `202605210006_batch1_2_operational_stability.sql`
- `202605210007_e2e_automation_audit.sql`
- `202605310001_first_user_bootstrap_profiles.sql`
- `202605310002_automation_os_registry.sql`

## Chronological Ordering

FAIL

The migration chain mixes numeric prefixes (`040`-`046`) with timestamp prefixes (`202605...`). Supabase applies migrations by filename ordering. The `040`-`046` migrations sort before the foundational `202605210003_phase6_multitenant_saas.sql` migration that creates `organizations`.

Evidence:

- `046_production_hardening_operational_tables.sql` references `public.organizations`, `public.leads`, and `public.automation_events`.
- `organizations` is created later in lexicographic order by `202605210003_phase6_multitenant_saas.sql`.
- `leads` is created later in lexicographic order by `202605210001_phase4_production_schema.sql`.
- `automation_events` is created later in lexicographic order by `202605210002_phase5_ai_operations.sql`.

## Timestamp Consistency

FAIL

The chain uses two incompatible naming schemes. Numeric migrations do not carry chronological timestamps.

## Duplicate Migrations

No duplicate migration filenames found.

No duplicate physical table creation names found.

## Missing Migrations

Evidence of missing production schema:

- Required `patients` table is absent.
- Required `appointments` table is absent.
- Required `workflow_executions` table is absent.
- Required `workflow_events` table is absent.
- Required `automation_execution_logs` table is absent.
- Required `automation_retries` table is absent.
- Dedicated revenue attribution table is absent.

## Partially Applied Migrations

UNKNOWN / NOT CERTIFIED

Command run:

`supabase migration list`

Result:

`Cannot find project ref. Have you run supabase link?`

Because the project is not linked locally, applied migration state cannot be verified.

## Findings

P0 blockers:

- Mixed filename ordering can apply dependent migrations before dependency tables exist.
- Applied migration state cannot be verified from the current repo because Supabase is not linked.
- Required runtime and patient-domain tables are absent.

P1 warnings:

- 22 migration-created tables are absent from generated database types.
- Runtime execution evidence is split across multiple tables with overlapping semantics.

P2 recommendations:

- Rename or replace legacy numeric migrations with timestamped, dependency-safe migrations before production.
- Regenerate database types after migration chain normalization.
- Add an applied-migration evidence export from the linked Supabase project before cutover.

## Result

FAIL
