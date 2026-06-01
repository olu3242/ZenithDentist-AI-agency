# Playbook Installation Report

Date: 2026-06-01

## Required Playbooks

- No Show Prevention
- Recall Recovery
- Chair Fill
- Treatment Acceptance
- Review Growth
- Referral Growth

## Implementation

Canonical definitions live in `lib/revenue-playbooks/index.ts`.

The automated installer lives in `lib/pilot-operations.ts` as `installRevenuePlaybooks`.

Each installation configures:

- Workflows through existing `automation_registry` records
- Triggers from playbook definitions
- Attribution rules on the registry configuration payload
- Monitoring metadata with activation timestamp

## Workflow Backing

- `appointment_no_show`: No Show Prevention
- `recall_due`: Recall Recovery
- `reactivation_candidate_detected`: Recall Recovery, Treatment Acceptance
- `lead_created`: Chair Fill, Referral Growth
- `stale_patient_detected`: Chair Fill, Treatment Acceptance
- `review_request_due`: Review Growth, Referral Growth

## Status

Installer created. It activates existing workflows and does not create a duplicate execution path.
