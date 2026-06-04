# Schema Cache Recovery

Date: 2026-06-01

## Symptom

`Unable to create organization: Could not find the table public.organizations in the schema cache`

## Root Cause

PostgREST/Supabase schema cache does not see `public.organizations`. The code and generated types expect the table, but the remote database either never applied the tenancy migration or the schema cache was not refreshed after schema changes.

## Implemented Recovery

- Added `supabase/migrations/20260616000000_core_tenancy_repair.sql`.
- Updated `supabase/MIGRATION_MANIFEST.md`.
- Updated `lib/database.types.ts`.
- Added an onboarding error hint that points operators to the repair migration and schema refresh.

## Operator Steps

```bash
supabase link --project-ref <project-ref>
supabase migration list --linked
supabase migration up --linked
supabase db lint --linked
```

Then refresh PostgREST schema cache by restarting/redeploying the Supabase API layer or issuing a schema reload through the Supabase dashboard where available.

## Verification Query

```sql
select to_regclass('public.organizations') as organizations_table;
select to_regclass('public.organization_members') as organization_members_table;
select to_regclass('public.profiles') as profiles_table;
```

Expected result: all three return non-null relation names.
