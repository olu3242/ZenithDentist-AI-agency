# Patient OS Evidence Audit

Date: 2026-06-02

| Workflow | Trigger Exists | Workflow Registered | Execution Recorded | Evidence Recorded | Mission Control Event | ALICE Trace | Revenue Attribution | Retry/Self-Healing | Tenant Safe | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `welcome_patient` | Yes | Yes | Partial | Missing | Missing | Missing | Missing | Yes | Yes | Partial |
| `post_visit_checkin` | Partial | Not found as local canonical workflow | Missing | Missing | Missing | Missing | Missing | Missing | Partial | Fail |
| `patient_30_day_checkin` | Partial | Not found as local canonical workflow | Missing | Missing | Missing | Missing | Missing | Missing | Partial | Fail |
| `patient_90_day_checkin` | Partial | Not found as local canonical workflow | Missing | Missing | Missing | Missing | Missing | Missing | Partial | Fail |

## Notes

The local Video Engagement OS includes `welcome_patient` and video journey workflows, but the Patient OS evidence workflows described in the pasted sprint are not fully implemented in this checkout. Production certification requires runtime handlers that write workflow execution, evidence, ALICE trace, mission control outcome, and revenue attribution records.
