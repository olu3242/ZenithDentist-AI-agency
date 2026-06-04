# SLA Certification

Status: PARTIAL

Implemented:

- `/internal/sla`
- Canonical SLA tables: `client_slas`, `sla_events`, `sla_scores`, `sla_violations`, `sla_breaches`, `sla_forecasts`
- SLA compliance and error-budget summary from Runtime OS

Certification blockers:

- Per-client SLA records in staging
- Error-budget persistence
- SLA forecast writes from ALICE/Runtime OS
