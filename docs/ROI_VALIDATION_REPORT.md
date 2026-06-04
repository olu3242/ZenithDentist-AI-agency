# ROI Validation Report

Date: 2026-06-01

## Simulation

Implemented in `runRecallRoiValidationSimulation` in `lib/pilot-operations.ts`.

Scenario:

100 Recall Patients -> 25 Reactivated -> 18 Scheduled -> 15 Seen -> $18,000 Production

## Attribution Verification

- Playbook: Recall Recovery
- Workflow: `recall_due`
- Patient journey: Recall Patient -> Reactivated -> Scheduled -> Seen -> Production
- Average production per seen patient: $1,200

## Result

Attribution is verified because production equals $18,000, seen patients do not exceed scheduled patients, and scheduled patients do not exceed reactivated patients.
