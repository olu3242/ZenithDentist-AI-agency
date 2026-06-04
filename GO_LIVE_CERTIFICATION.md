# Go-Live Certification

Status: CONDITIONAL GO

## Certified

- `/internal/go-live` exists as the go-live certification center.
- `go_live_checklists` enforces integrations connected, workflows active, templates configured, training completed, and testing passed.
- Checklist-level go-live requirements are available through `client_onboarding_items.go_live_requirement`.
- Each go-live gate can require evidence through `evidence_type`, `evidence_record_id`, and `evidence_status`.
- Certification state is persisted by tenant and implementation project.
- Customer success review scheduling is represented through `customer_success_reviews`.

## Production Gate

A client should not be marked GO LIVE unless all checklist gates are true and `certified = true`.
