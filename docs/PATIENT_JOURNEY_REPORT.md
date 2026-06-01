# Patient Journey Report

## Patient Lifecycle Overview

The patient lifecycle is modeled as a state machine with 10 states. Every transition can optionally fire a workflow via `lib/patient-journey/index.ts`.

---

## Lifecycle States

| State | Description |
|-------|-------------|
| `lead` | Prospect captured (form, referral, missed call) |
| `new_patient` | Lead converted, intake completed |
| `scheduled` | Appointment booked |
| `confirmed` | Appointment confirmed (responded to reminder) |
| `seen` | Appointment attended |
| `treatment_planned` | Treatment plan presented |
| `treatment_accepted` | Patient accepted treatment plan |
| `completed` | Treatment completed |
| `recall` | Due for hygiene / follow-up recall |
| `advocate` | Active referrer / promoter |

---

## Valid State Transitions

```
lead           → new_patient, scheduled
new_patient    → scheduled
scheduled      → confirmed, lead (no-show fallback)
confirmed      → seen, scheduled (reschedule)
seen           → treatment_planned, recall, completed
treatment_planned → treatment_accepted, recall
treatment_accepted → scheduled, completed
completed      → recall, advocate
recall         → scheduled, advocate
advocate       → recall
```

---

## Workflow Triggers Per Transition

| From State | To State | Workflow ID |
|------------|----------|-------------|
| `lead` | `new_patient` | `lead_created` |
| `lead` | `scheduled` | `lead_created` |
| `scheduled` | `confirmed` | `appointment_no_show` |
| `scheduled` | `lead` (no-show) | `appointment_no_show` |
| `seen` | `treatment_planned` | `ai_followup_required` |
| `seen` | `recall` | `recall_due` |
| `seen` | `completed` | `review_request_due` |
| `treatment_planned` | `treatment_accepted` | `ai_followup_required` |
| `treatment_planned` | `recall` | `recall_due` |
| `completed` | `recall` | `recall_due` |
| `completed` | `advocate` | `review_request_due` |
| `recall` | `scheduled` | `recall_due` |
| `recall` | `advocate` | `review_request_due` |

Transitions with no workflow listed are valid but require no automation.

---

## API / Functions

- `advancePatientLifecycle(event: PatientJourneyEvent)` — validates transition, fires automation event
- `getPatientJourney(patientId, organizationId)` — returns lifecycle events from `automation_events` audit trail
- `LIFECYCLE_TRANSITIONS` — map of valid transitions per state
- `WORKFLOW_TRIGGERS` — map of workflow IDs per transition

---

## Revenue Engine Integration

Each lifecycle transition maps to a revenue engine:

| Transition | Revenue Engine |
|------------|---------------|
| `lead → scheduled` | Referral Engine / Lead Recovery |
| `scheduled → confirmed` | No-Show Prevention |
| `seen → treatment_planned` | Treatment Acceptance |
| `seen → completed` | Review Growth |
| `completed → recall` | Recall Recovery |
| `recall → scheduled` | Chair Fill / Recall Recovery |
| `recall → advocate` | Review Growth + Referral Engine |
