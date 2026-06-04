# Database Audit Report

Date: 2026-06-01

## Root Finding

The onboarding failure `Could not find the table public.organizations in the schema cache` is caused by database drift: application code and generated types expect `public.organizations`, but the connected Supabase database does not expose that table in PostgREST's schema cache.

Local migrations contain a core tenancy migration (`202605210003_phase6_multitenant_saas.sql`) that creates `organizations`, but legacy migrations named `040_*` through `046_*` sort before timestamped migrations and several reference `public.organizations`. A remote project that missed, skipped, or partially replayed the timestamped tenancy migration can therefore end up with code deployed ahead of schema.

## Implemented Fix

Added forward-only repair migration:

- `supabase/migrations/20260616000000_core_tenancy_repair.sql`

This migration creates or repairs:

- `organizations`
- `profiles`
- `organization_members`
- `onboarding_states`
- `storefronts`
- `products`
- `orders`
- `workflow_events`
- `platform_events`
- `tenant_onboarding_runs`

It also adds indexes, RLS enablement, service-role policies, and member read policies for core tenancy bootstrap.

## Required Table Audit

| Table | Local schema status | Recovery action |
| --- | --- | --- |
| `organizations` | Defined in `202605210003`; missing remotely per runtime error | Recreated/altered by repair migration |
| `organization_members` | Defined in `202605210003` | Recreated by repair migration if missing |
| `profiles` | Defined in `202605310001` | Recreated/altered by repair migration if missing |
| `storefronts` | Missing from local migrations | Added by repair migration |
| `onboarding_states` | Missing from local migrations | Added by repair migration |
| `products` | Missing from local migrations | Added by repair migration |
| `orders` | Missing from local migrations | Added by repair migration |
| `roi_assessments` | Defined in `20260601150000` | Present locally |
| `workflow_runs` | Defined in `046_production_hardening_operational_tables.sql` | Present locally |
| `workflow_events` | Missing from local migrations | Added by repair migration |
| `automation_traces` | Defined in `040_runtime_trace_system.sql` | Present locally |
| `automation_dead_letters` | Defined in `040_runtime_trace_system.sql` | Present locally |
| analytics tables | `analytics_events`, `faq_interactions`, `outreach_events`, `usage_metrics`, `benchmark_snapshots` exist locally | Present locally |
| ALICE tables | `alice_conversations`, `alice_messages`, `alice_memory`, `alice_enterprise_memory`, change/observation/refresh tables exist locally | Present locally |
| mission control tables | Runtime, governance, incident, replay, provider, executive report, and operational memory tables exist locally | Present locally |

## Missing Or Weak Areas

| Area | Finding | Status |
| --- | --- | --- |
| Migration ordering | Legacy `040_*` and `046_*` migrations can reference `organizations` before `202605210003` creates it | Documented; repaired by post-baseline migration |
| Remote drift | Remote migration state could not be verified because the workspace is not linked to a Supabase project | Deployment step required |
| RLS | Most legacy tables have service-role policies only | Tenant-facing tables repaired; broader policy hardening remains a follow-up |
| Foreign keys | Legacy text `organization_id` tables cannot be safely converted in-place without data review | Documented risk |
| Generated types | New repair tables were missing from `lib/database.types.ts` | Updated |

## SQL Validation Queries

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'organizations',
    'organization_members',
    'profiles',
    'storefronts',
    'onboarding_states',
    'products',
    'orders',
    'roi_assessments',
    'workflow_runs',
    'workflow_events',
    'automation_traces',
    'automation_dead_letters',
    'analytics_events',
    'faq_interactions',
    'outreach_events',
    'alice_conversations',
    'alice_messages',
    'alice_memory',
    'runtime_event_fabric_events',
    'runtime_governance_decisions',
    'operational_incidents',
    'executive_report_snapshots',
    'platform_events',
    'tenant_onboarding_runs'
  )
order by table_name;

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'organizations',
    'organization_members',
    'profiles',
    'storefronts',
    'onboarding_states',
    'products',
    'orders',
    'roi_assessments',
    'workflow_runs',
    'workflow_events',
    'automation_traces',
    'automation_dead_letters',
    'analytics_events',
    'platform_events',
    'tenant_onboarding_runs'
  )
order by table_name, ordinal_position;

select tablename, indexname
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name;

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select *
from supabase_migrations.schema_migrations
order by version;
```

## Deployment Validation

Run after applying migrations:

```bash
supabase migration list --linked
supabase migration up --linked
supabase db lint --linked
```
