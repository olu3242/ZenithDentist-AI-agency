# Zenith Database Deployment Audit

Date: June 2, 2026

## Summary

Local migration governance is passing, but remote Supabase drift is not certified. The staging/prod database cutover is blocked until the linked Supabase database credentials are corrected and the remote migration list is verified.

## Migration Inventory

Local migrations found: 22

- Legacy operational migrations: `040` through `046`
- Phase migrations: `202605210001` through `202605210007`
- Bootstrap and automation migrations: `202605310001`, `202605310002`
- Revenue/workflow migrations: `20260601150000`, `20260601170000`
- Tenancy recovery migrations: `20260615000000`, `20260616000000`
- LIZ action telemetry: `20260617000000`
- Production evidence certification: `20260618000000`

## Local Governance Result

Command: `npm run migration:validate`

Result: PASS

Fixes completed during this sprint:

- Added missing manifest entry for `20260617000000_liz_action_events.sql`.
- Added missing manifest entry for `20260618000000_production_evidence_certification.sql`.
- Added dependency documentation for both migrations.
- Added tenant-scoping column `organization_id` to `claim_registry`.
- Added `idx_claim_registry_org`.
- Updated seeded claim registry rows to use a nullable global organization scope.

## Schema Coverage

Required deployment domains are represented locally:

| Domain | Local status |
| --- | --- |
| Organizations | Present in core tenancy repair/baseline migrations |
| Organization members | Present in core tenancy repair/baseline migrations |
| Profiles | Present in bootstrap/core tenancy migrations |
| Storefronts | Present in platform schema set |
| Onboarding states | Present in core tenancy repair |
| Products/orders | Present in commercial/platform migrations |
| ROI assessments | Present in revenue commercialization migration |
| Workflow runs/events | Present in Automation Platform migrations |
| Automation traces/dead letters | Present in runtime/automation migrations |
| Analytics tables | Present in analytics/production evidence migrations |
| ALICE tables | Present in AI operations/traceability migrations |
| LIZ tables | Present in `20260617000000_liz_action_events.sql` |
| Mission control tables | Present in enterprise governance/evidence migrations |

## RLS And Tenant Isolation

Local migration set includes RLS coverage for the core tenancy, workflow, LIZ telemetry, and production evidence tables. Tenant-scoped runtime/evidence tables use `organization_id` where required. `claim_registry` now supports organization-specific claims while allowing global seeded claim definitions.

## Remote Drift Verification

Command attempted: `supabase migration list`

Result: BLOCKED

Reason: the linked Supabase database rejected the configured database password for the `postgres` user. Because the remote migration list could not be fetched, drift between local schema and the remote Supabase project is not certified.

## Cutover Requirements

Before production cutover:

1. Correct the linked Supabase database password/connection.
2. Run `supabase migration list`.
3. Confirm `20260617000000` and `20260618000000` are applied to staging.
4. Run remote DB lint after credential repair.
5. Refresh generated Supabase types after migration application.
6. Re-run onboarding, organization provisioning, LIZ telemetry, workflow, and reports persistence checks against staging.

## Database Deployment Decision

Status: NO-GO for production database cutover.

Local migration governance is clean, but remote drift is unverified.
