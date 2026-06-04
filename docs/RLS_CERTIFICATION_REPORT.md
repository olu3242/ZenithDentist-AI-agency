# RLS Certification Report

Date: 2026-06-01

## Evidence Sources

- `supabase/migrations/`
- `DATABASE_INVENTORY.csv`

## Summary

- Migration-created tables: 108
- Tables with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`: 108
- Tables with at least one migration-created policy: 108

## Policy Pattern Found

The migration policy set is service-role-only:

`create policy "service_role_all_<table>" on public.<table> for all using (auth.role() = 'service_role')`

## Tenant Isolation

FAIL

The schema enables RLS, but tenant/member scoped policies are not present in the migrations for operational customer access. Service-role-only policies do not prove tenant isolation for authenticated practice users.

## Admin Access

FAIL

No explicit admin/member policies were found in migrations that map authenticated users through `organization_members`.

## Service Role Access

PASS

Service role access policies exist for all migration-created tables.

## Anonymous Access

PASS

No anonymous access policy was found in the migration policy set.

## Missing Policies

Missing policy classes:

- Authenticated tenant member read/write policies
- Organization admin policies
- Read-only executive policies
- Benchmark aggregate read policies

## Weak Policies

- Service-role-only policy coverage is not sufficient for tenant-facing production access.

## Unsafe Policies

No explicit anonymous `FOR ALL` policy was found.

## Result

FAIL

RLS is enabled everywhere, but tenant isolation and admin access are not certified because the migrations only prove service-role access.
