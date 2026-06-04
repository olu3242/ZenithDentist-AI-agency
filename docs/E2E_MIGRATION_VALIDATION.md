# E2E Migration Validation

Date: 2026-06-01

## Required Trace

Patient Created -> Appointment Created -> Playbook Triggered -> Workflow Executed -> Runtime Executed -> Revenue Attribution Created -> Analytics Updated -> ALICE Consumed -> Mission Control Updated

## Validation Result

FAIL

## Evidence

- `patients` table is absent from migrations.
- `appointments` table is absent from migrations.
- Dedicated revenue attribution table is absent.
- Required Event Fabric events `patient_created`, `appointment_created`, `revenue_generated`, `analytics_projected`, `alice_evaluated`, and `mission_control_updated` were not found as published events.
- No linked database was available for executing and capturing a live trace.

## Captured Trace

No full production migration E2E trace was captured.

## Result

FAIL
