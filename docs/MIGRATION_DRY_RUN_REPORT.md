# Migration Dry Run Report

Date: 2026-06-01

## Required Dry Run

Empty Environment -> Apply All Migrations -> Seed Minimal Data -> Execute Smoke Tests

## Execution Evidence

The required dry run was not completed.

Attempted command:

`supabase migration list`

Result:

`Cannot find project ref. Have you run supabase link?`

## Static Dry Run Findings

The static audit found a deterministic migration-order blocker:

- `046_production_hardening_operational_tables.sql` sorts before `202605210001`, `202605210002`, and `202605210003`.
- It references `public.organizations`, `public.leads`, and `public.automation_events` before those tables are created in filename order.

## Smoke Tests

Not executed as part of a database dry run because migrations were not applied to an empty environment.

## Result

FAIL

No evidence proves that all migrations can be applied to an empty production environment.
