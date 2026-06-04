# E2E Reconciliation Report

Date: 2026-06-01

## Required Trace

Patient Created -> Appointment Created -> Revenue Playbook Triggered -> Workflow Executed -> Runtime Executed -> Attribution Generated -> Analytics Projected -> ALICE Consumed -> Executive Dashboard Updated

## Execution

NOT EXECUTED AGAINST REMOTE

Reason:

Remote schema and migration state could not be discovered. Required local revenue and runtime tables are also not fully represented.

## Local Application Checks

- Smoke test passed.
- E2E production invariant check passed.
- Build passed.

These checks validate application invariants, not remote database reconciliation.

## Result

NOT E2E RECONCILED
