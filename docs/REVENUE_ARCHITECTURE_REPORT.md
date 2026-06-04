# Revenue Architecture Report

Date: 2026-06-01

## Scope

Specialist: Revenue Operations Architect

## Evidence Reviewed

- `lib/revenue-playbooks/index.ts`
- `lib/pilot-operations.ts`
- `lib/commercial-operations.ts`
- `docs/REVENUE_CERTIFICATION_REPORT.md`
- `docs/ROI_TRACKING_REPORT.md`

## Playbook Validation

| Playbook | Status | Evidence |
| --- | --- | --- |
| No Show Prevention | Implemented | `no_show_prevention`, backing workflow `appointment_no_show` |
| Recall Recovery | Implemented | `recall_recovery`, backing workflows `recall_due`, `reactivation_candidate_detected` |
| Treatment Acceptance | Implemented | `treatment_acceptance`, backing workflows `stale_patient_detected`, `reactivation_candidate_detected` |
| Chair Fill | Implemented | `chair_fill`, backing workflows `lead_created`, `stale_patient_detected` |
| Review Growth | Implemented | `review_growth`, backing workflow `review_request_due` |
| Referral Growth | Implemented | `referral_growth`, backing workflows `lead_created`, `review_request_due` |

## Attribution

Attribution rules exist in playbook definitions and simulation/certification reports.

Gap:

- Migration certification found no dedicated revenue attribution table.
- Attribution is partly configured as JSON/rules and certification simulation rather than proven live database lineage.

## ROI Framework

Implemented:

- `calculatePilotRoi`
- legacy `calculateRevenueProjection`
- executive reports
- recall ROI validation simulation

## Decision

REVENUE ARCHITECTURE IS STRONG AT THE OPERATING MODEL LEVEL, PARTIAL AT LIVE DATA-LINEAGE LEVEL.
