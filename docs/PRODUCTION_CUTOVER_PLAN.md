# Production Cutover Plan

Date: 2026-06-01

## Pre-Cutover Checklist

- Normalize migration filename ordering.
- Link Supabase project and export applied migration list.
- Run empty-environment migration dry run.
- Regenerate `lib/database.types.ts`.
- Resolve orphaned migration tables.
- Add or certify required patient, appointment, workflow execution, workflow event, runtime log, retry, and attribution tables.
- Certify tenant/member RLS policies.
- Produce verified backup and restore evidence.

## Migration Window

Do not schedule a production migration window until P0 blockers in `docs/MIGRATION_AUDIT_REPORT.md` are resolved.

## Verification Steps

- Apply migrations to empty environment.
- Seed minimal organization, user, PMS integration, playbook, patient, appointment, runtime event, attribution, analytics, ALICE, and Mission Control data.
- Execute smoke tests.
- Execute E2E operational validation.
- Verify RLS using tenant member and admin roles.
- Verify rollback restore.

## Rollback Triggers

- Any migration failure.
- Missing required table.
- Tenant data leakage.
- RLS bypass or missing authenticated policy.
- Runtime trace failure.
- Event Fabric failure.
- Revenue attribution failure.

## Post-Cutover Validation

- Confirm migration version list.
- Confirm tenant login and organization membership.
- Confirm PMS integration record.
- Confirm playbook registry activation.
- Confirm runtime trace writes.
- Confirm Event Fabric writes.
- Confirm analytics projection.
- Confirm ALICE report generation.
- Confirm Mission Control state update.

## Success Criteria

All P0 blockers resolved, empty-environment dry run passed, rollback verified, tenant isolation passed, and E2E migration validation captured.

## Current Cutover Status

DO NOT CUT OVER
