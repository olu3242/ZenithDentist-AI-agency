# RLS Coverage Report

Generated: 2026-06-01

## Status

PARTIAL - local migration files include broad RLS coverage, but production database verification was not executed in this pass.

## Evidence From Migrations

Migrations include many `alter table ... enable row level security` and `create policy ... service_role_all_*` statements across runtime, workflow, operations, healthcare cloud, onboarding, profiles, and automation registry tables.

Key examples:

- `automation_traces`
- `automation_trace_events`
- `automation_dead_letters`
- `runtime_event_fabric_events`
- `tenant_onboarding_runs`
- `profiles`
- `automation_registry`
- healthcare cloud and operational event tables

## Gaps

- Production `pg_policies` was not queried in this local-only run.
- Tenant-member readable policies are not fully verified.
- Most policies appear service-role centric, which is safe for server-only access but not sufficient for direct client-side Supabase access.

## Required Verification

Run against linked production Supabase:

```bash
supabase db lint --linked
supabase migration list --linked
```

Then query:

```sql
select schemaname, tablename, policyname from pg_policies where schemaname = 'public';
```

## Release Decision

PARTIAL until production `pg_policies` confirms complete coverage.
