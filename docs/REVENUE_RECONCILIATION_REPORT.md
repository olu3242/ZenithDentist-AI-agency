# Revenue Reconciliation Report

Date: 2026-06-01

## Required Revenue Entities

- patients
- appointments
- treatment plans
- reviews
- referrals
- attribution

## Local Evidence

| Entity | Local State | Status |
| --- | --- | --- |
| patients | Not found | FAIL |
| appointments | Not found | FAIL |
| treatment plans | Not found | FAIL |
| reviews | Not found as patient-domain table | FAIL |
| referrals | `referral_flywheel_events` exists for GTM/customer success, not patient-domain referrals | WARNING |
| attribution | JSON fields on `leads` and `analytics_events`; no dedicated attribution table | FAIL |

## Remote Evidence

BLOCKED

Remote revenue schema, relationships, foreign keys, and metrics could not be inspected.

## Result

NOT RECONCILED

Revenue reconciliation requires remote schema access and a forward-fix plan based on actual remote state.
