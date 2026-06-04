# RLS Reconciliation Report

Date: 2026-06-01

## Local Expected Policies

Local migrations show RLS enabled broadly, but policies are primarily service-role-only:

`auth.role() = 'service_role'`

## Remote Actual Policies

BLOCKED

Remote policies could not be retrieved because Supabase project access is denied.

## Missing Policies

Evidence from local migrations indicates missing policy classes:

- Authenticated tenant member policies
- Organization admin policies
- Read-only executive policies
- Benchmark aggregate read policies

## Unsafe Policies

No anonymous broad-access policies were found locally.

Remote unsafe policies: UNKNOWN.

## Service Role Only Policies

Local status: PRESENT

This is acceptable for service operations but does not certify tenant-facing access.

## Tenant Isolation Gaps

Local tenant isolation is not fully certified because several required entities are absent and tenant/member policies are not present in migrations.

Remote tenant isolation: UNKNOWN.

## Result

NOT RECONCILED
