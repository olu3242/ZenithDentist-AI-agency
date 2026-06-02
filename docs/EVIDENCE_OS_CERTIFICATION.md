# Evidence OS Certification

Status: PARTIAL

Implemented:

- `/internal/evidence`
- Canonical evidence tables:
  - `automation_evidence`
  - `workflow_evidence`
  - `revenue_evidence`
  - `patient_journey_evidence`
  - `relationship_evidence`
  - `video_evidence`
  - `alice_evidence`
  - `liz_evidence`
  - `compliance_evidence`
- Evidence explorer connected through `getEnterpriseOperationsState`

Certification blockers:

- Remote migration application
- Evidence write-through from every major action
- Cross-linking to trace IDs, patients, actors, and outcomes in staging
