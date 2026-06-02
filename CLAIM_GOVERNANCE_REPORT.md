# CLAIM GOVERNANCE REPORT

## Implemented

- Created `claim_registry`.
- Seeded initial claim governance rows.
- Production Certification Center displays public claim allowance.

## Rule

No public claim should appear unless:

- `certification_status = 'certified'`
- and `public_allowed = true`

Pilot-only claims must remain qualified as pilot, preview, or certification-in-progress.

## Certification Status

Status: PILOT CERTIFIED

Remaining: add a content lint/check that scans public pages against `claim_registry`.
