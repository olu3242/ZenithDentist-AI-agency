# Canonical Baseline Validation

Date: 2026-06-01

## Baseline Under Test

`supabase/migrations/20260615000000_canonical_baseline.sql`

## Baseline Purpose

The baseline is a governance marker that freezes previous mixed-number migrations as legacy history and starts the timestamp-only forward migration sequence.

## Validation Against Remote Schema

Result: NOT VALIDATED

Reason:

Remote schema could not be retrieved. Supabase project linking failed with access-control denial.

## Validation Against Local Schema

Result: PARTIAL MATCH

Evidence:

- Baseline file exists.
- Baseline uses required `YYYYMMDDHHMMSS_description.sql` naming.
- Baseline is registered in `supabase/MIGRATION_MANIFEST.md`.
- `npm run migration:validate` passes.

Limitation:

- Baseline does not contain a full canonical schema snapshot.
- Baseline cannot prove remote table/index/policy/function/trigger/view match.

## Output

PARTIAL MATCH

The baseline matches governance requirements locally, but remote schema validation is blocked.
