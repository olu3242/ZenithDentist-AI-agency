# Local Remote Diff Report

Date: 2026-06-01

## Objective

Compare local migration chain against actual remote database state.

## Local State Evidence

Local migration inventory exists from prior certification:

- `DATABASE_INVENTORY.csv`
- 108 migration-created tables
- 83 migration-created tables represented in `lib/database.types.ts`
- 22 migration-created tables missing from generated database types
- 3 test/demo/audit-classified tables

## Remote State Evidence

BLOCKED

Remote state could not be retrieved because `supabase link` failed with a Supabase access-control error.

## Diff Classification

P0 Critical Drift:

- Remote applied migration list unknown.
- Remote schema unknown.
- Remote table/function/policy/trigger/view inventory unknown.
- Production cutover cannot be certified without remote state evidence.

P1 Drift:

- Local migration chain still contains frozen legacy mixed numbering before `20260615000000_canonical_baseline.sql`.
- Local database types do not represent all local migration-created tables.

P2 Drift:

- Local governance baseline exists, but it is a governance marker, not a replay-certified schema snapshot.

## Result

DIFF BLOCKED

No local-vs-remote claims can be made without remote evidence.
