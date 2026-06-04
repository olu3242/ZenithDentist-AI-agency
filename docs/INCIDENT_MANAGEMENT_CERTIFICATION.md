# Incident Management Certification

Status: PARTIAL

Implemented:

- `/internal/incidents`
- Canonical incident tables: `incidents`, `incident_events`, `incident_assignments`, `incident_root_causes`, `incident_recoveries`, `incident_timelines`
- Runtime incident visibility from existing Runtime OS
- RLS-enabled tenant-scoped schema

Certification blockers:

- Mutating incident actions for open/assign/escalate/recover/close
- Recovery write-through from Runtime OS to incident tables
- Staging incident lifecycle proof
