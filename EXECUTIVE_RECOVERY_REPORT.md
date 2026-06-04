# Executive Recovery Report

Date: 2026-06-01

## Root Cause Analysis

The onboarding failure is a schema drift failure. The application expects `public.organizations`, but the connected Supabase API schema cache does not expose it. Local code, generated types, and onboarding logic were ahead of the remote schema.

Contributing factors:

- Mixed legacy migration naming (`040_*`, `046_*`) and timestamped migration naming.
- Core tenancy table creation lives in `202605210003_phase6_multitenant_saas.sql`.
- Remote migration state could not be verified because this workspace is not linked to a Supabase project.
- Onboarding error handling did not provide schema-cache recovery guidance.

## Missing Migrations

Added:

- `20260616000000_core_tenancy_repair.sql`

This migration repairs the core tenancy/bootstrap schema and adds missing support tables requested in the sprint.

## Missing Tables Fixed

- `organizations`
- `organization_members`
- `profiles`
- `onboarding_states`
- `storefronts`
- `products`
- `orders`
- `workflow_events`
- `platform_events`
- `tenant_onboarding_runs`

## Broken Flows Fixed

- Signup organization creation now has a safe migration target.
- Onboarding error now includes a schema-cache recovery hint.
- Dashboard lead/ROI/booking metrics can now be scoped by organization.
- Runtime dead letters are no longer fetched globally.
- Assessment CTAs route into the assessment before strategy-session scheduling.

## Required SQL

Apply:

```sql
-- See supabase/migrations/20260616000000_core_tenancy_repair.sql
```

Then validate:

```sql
select to_regclass('public.organizations');
select to_regclass('public.organization_members');
select to_regclass('public.profiles');
select to_regclass('public.tenant_onboarding_runs');
```

## Required Deployments

1. `supabase link --project-ref <project-ref>`
2. `supabase migration list --linked`
3. `supabase migration up --linked`
4. Refresh Supabase schema cache.
5. Deploy the app.
6. Run signup -> onboarding -> dashboard smoke test.

## Remaining Risks

- Remote Supabase migration state is unverified from this machine.
- Some legacy tables use service-role-only RLS and should receive member-scoped policies in a dedicated RLS hardening sprint.
- Some GTM views are intentionally global agency views, not tenant views.
- Legacy text `organization_id` columns should not be FK-converted without a data migration plan.

## Go/No-Go Recommendation

Application: Go for deployable build artifact.

Database/onboarding: No-Go until the repair migration is applied to the linked Supabase project and the onboarding smoke test passes.

Go after:

- `organizations` is visible in Supabase schema cache.
- Signup creates organization, profile, membership, and onboarding run.
- Dashboard opens with tenant-scoped data.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.

Current local validation result:

- `npm install`: passed
- `npm run migration:validate`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run build`: passed
