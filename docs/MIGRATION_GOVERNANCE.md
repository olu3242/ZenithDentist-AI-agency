# Migration Governance

Date: 2026-06-01

Company: FinClarity Bookkeeping and Services LLC, DBA Zenith Pros

Product: Patient Revenue Operating System (PROS)

## Objective

Establish one migration sequence, one migration authority, one replay path, and one production deployment path.

No future migration may bypass this governance model.

## Numbering Standard

All new migrations must use:

`YYYYMMDDHHMMSS_description.sql`

Examples:

- `20260601100000_initial_platform.sql`
- `20260601103000_workflow_os.sql`
- `20260601110000_runtime_os.sql`
- `20260601113000_revenue_engine.sql`
- `20260601120000_alice.sql`
- `20260601123000_mission_control.sql`

Forbidden for new migrations:

- `001_create_tables.sql`
- `002_auth.sql`
- `20250601_fix.sql`
- `workflow_patch.sql`

## Legacy Migration Freeze

Existing migrations before `20260615000000_canonical_baseline.sql` are frozen legacy history.

Claude, Codex, GitHub Copilot, human developers, and CI/CD jobs must not rename, reorder, edit, squash, or delete legacy migrations.

## Claude And Codex Rules

Claude and Codex must never:

- Rename migrations
- Reorder migrations
- Modify applied migrations
- Delete migration history
- Create duplicate canonical tables
- Create a parallel tenant model
- Create a parallel runtime model

Claude and Codex may only:

- Create new forward migrations with a timestamp newer than the canonical baseline
- Generate reports when a requested migration would violate governance
- Add manifest entries for new migrations
- Add validation evidence

Good:

`20260602100000_add_workflow_versions.sql`

Bad:

Modify `20260501093000_create_patients.sql`

## Migration Categories

CORE:

- `organizations`
- `profiles`
- `memberships`

REVENUE:

- `patients`
- `appointments`
- `treatments`
- `reviews`

WORKFLOW:

- `workflows`
- `workflow_versions`
- `workflow_executions`

RUNTIME:

- `dead_letters`
- `retries`
- `execution_logs`

AI:

- `alice_agents`
- `alice_insights`

ANALYTICS:

- `analytics_metrics`
- `analytics_projections`

MISSION_CONTROL:

- `mission_control_metrics`

## Canonical Baseline Policy

Baseline migration:

`20260615000000_canonical_baseline.sql`

Purpose:

- Mark the permanent governance transition.
- Represent the current production-truth cutover point.
- Freeze previous mixed-number migration history as legacy.

Rules:

- Never edit the baseline after release.
- Future changes must be additive forward migrations.
- Any correction to baseline behavior must be made in a newer migration.

## Mandatory Pre-Creation Guardrails

Before creating a migration, Claude, Codex, Copilot, or a human developer must verify:

1. Does the table already exist?
2. Does the column already exist?
3. Is the migration already applied?
4. Is there a newer canonical entity?
5. Does the migration violate the tenant model?

If any answer is YES, stop and generate a report instead of creating a migration.

## Deployment Sequencing

Required production sequence:

1. Backup
2. Migration Validation
3. Staging Replay
4. Production Replay
5. Smoke Test
6. Runtime Validation
7. Revenue Validation
8. ALICE Validation
9. Executive Dashboard Validation

No shortcuts.

## CI/CD Migration Gate

Deployments must fail for:

- Duplicate migration number
- Out-of-order migration
- Missing dependency
- Missing `organization_id` on tenant-scoped tables
- Missing RLS
- Replay failure
- Schema drift detected

Local validator:

`npm run migration:validate`

## Replay Certification

Every migration PR must pass:

Fresh Database -> Apply Baseline -> Apply New Migration -> Run Smoke Tests -> Run E2E Tests

No pass = no merge.

## Rollback Policy

Forward migrations must include rollback strategy in `supabase/MIGRATION_MANIFEST.md`.

Destructive rollback migrations are not allowed without verified backup/restore evidence and explicit production approval.
