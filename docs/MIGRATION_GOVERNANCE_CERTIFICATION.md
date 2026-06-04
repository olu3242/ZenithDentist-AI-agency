# Migration Governance Certification

Date: 2026-06-01

Company: FinClarity Bookkeeping and Services LLC, DBA Zenith AI Automation Agency

Product: Patient Revenue Operating System (PROS)

## Certification Scope

This certification verifies migration governance, numbering, sequencing, Claude/Codex rules, replay rules, CI/CD gates, and rollback procedures.

It does not certify the current production schema as migration-ready. Production migration readiness remains governed by `docs/MIGRATION_CERTIFICATION_REPORT.md`.

## Numbering Standard

Status: PASS

Evidence:

- `docs/MIGRATION_GOVERNANCE.md` defines the required `YYYYMMDDHHMMSS_description.sql` standard.
- `supabase/migrations/20260615000000_canonical_baseline.sql` establishes the first governance-baseline timestamp.
- `scripts/validate-migrations.js` blocks nonstandard future migration names.

## Sequencing Standard

Status: PASS

Evidence:

- `docs/MIGRATION_GOVERNANCE.md` defines one production deployment sequence:
  Backup -> Migration Validation -> Staging Replay -> Production Replay -> Smoke Test -> Runtime Validation -> Revenue Validation -> ALICE Validation -> Mission Control Validation.
- `scripts/validate-migrations.js` blocks duplicate timestamp IDs and out-of-order timestamp migrations.

## Claude Rules

Status: PASS

Evidence:

- `docs/MIGRATION_GOVERNANCE.md` states Claude must never rename, reorder, modify, or delete applied migrations.
- Claude may only create new forward migrations or generate a report when guardrails fail.

## Codex Rules

Status: PASS

Evidence:

- `docs/MIGRATION_GOVERNANCE.md` applies the same rules to Codex.
- This sprint did not rename, reorder, or modify historical migration files.
- The only migration added is a new forward timestamped migration: `20260615000000_canonical_baseline.sql`.

## Replay Rules

Status: PASS

Evidence:

- `docs/MIGRATION_GOVERNANCE.md` requires every migration PR to pass:
  Fresh Database -> Apply Baseline -> Apply New Migration -> Run Smoke Tests -> Run E2E Tests.
- `supabase/MIGRATION_MANIFEST.md` requires dependencies, affected tables, rollback strategy, risk level, and owner.

## CI/CD Gates

Status: PASS

Evidence:

- `scripts/validate-migrations.js` implements deployment blockers for:
  duplicate migration number, out-of-order timestamp migration, missing manifest entry, missing dependency declaration, missing `organization_id` on new tenant-scoped tables, missing RLS, and missing RLS policy.
- `package.json` exposes the gate as `npm run migration:validate`.

## Rollback Procedures

Status: PASS

Evidence:

- `docs/MIGRATION_GOVERNANCE.md` requires rollback strategy for every new migration.
- `supabase/MIGRATION_MANIFEST.md` includes rollback strategy for frozen legacy history, the baseline, and the future migration template.

## Guardrails

Status: PASS

Evidence:

- `docs/MIGRATION_GOVERNANCE.md` requires pre-creation checks:
  table exists, column exists, migration applied, newer canonical entity exists, tenant model violation.
- If any guardrail returns YES, contributors must stop and generate a report.

## Final Decision

GOVERNANCE ESTABLISHED

Evidence:

- A timestamp-only migration standard is documented.
- Existing mixed-number migrations are frozen as legacy history rather than renamed.
- A forward-only canonical baseline marker exists.
- A manifest exists.
- CI/CD validation script exists and is wired into `package.json`.
- Claude/Codex/human contributor rules are documented.
- Replay and rollback rules are documented.
