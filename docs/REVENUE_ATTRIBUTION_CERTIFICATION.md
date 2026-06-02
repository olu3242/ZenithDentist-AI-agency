# Revenue Attribution Certification

Status: PARTIAL

Implemented:

- `/internal/revenue-attribution`
- Canonical revenue attribution tables:
  - `revenue_attributions`
  - `campaign_attributions`
  - `workflow_attributions`
  - `appointment_attributions`
  - `treatment_attributions`
  - `membership_attributions`
  - `video_attributions`
- Attribution totals by journey type

Certification blockers:

- Live automation write-through
- PMS patient/appointment/treatment linkage
- Evidence-backed revenue amount verification
