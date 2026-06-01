# Rollback Plan

Date: 2026-06-01

## Database Rollback

- Stop writes.
- Snapshot current failed migration state.
- Restore last verified full database backup.
- Verify organization, membership, PMS, automation registry, operational metrics, runtime traces, and reports.

## Migration Rollback

- Do not run destructive down migrations in production unless explicitly tested.
- Prefer full restore to the last verified backup.
- Reconcile migration history only after restore validation.

## Runtime Rollback

- Disable automation execution workers.
- Pause playbook installation or workflow execution actions.
- Replay only after trace and dead-letter integrity is verified.

## Configuration Rollback

- Restore previous environment variable snapshot.
- Restore previous deployed commit SHA.
- Verify Supabase URL/key pairing and service role availability.

## Tenant Rollback

- Roll back tenant-by-tenant only if tenant identifiers and restore scope are proven.
- Verify `organization_id` isolation before resuming tenant access.

## Rollback Triggers

- Migration fails.
- Tenant isolation fails.
- RLS policy validation fails.
- Runtime tables missing.
- Event Fabric writes fail.
- Revenue attribution cannot be traced.

## Certification Result

NOT CERTIFIED

Rollback procedures are defined, but restore evidence is not available from the current local environment.
