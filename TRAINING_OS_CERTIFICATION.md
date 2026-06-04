# Training OS Certification

Status: PARTIALLY CERTIFIED

## Certified

- `/internal/training` exists as the role-based training center.
- `training_tracks` supports Practice Owner, Office Manager, Front Desk, and Provider tracks.
- `training_assignments` tracks assigned, started, completed, and certified statuses.
- Training completion feeds the go-live certification model.

## Go-Live Requirements

- Connect training content completion events to `training_assignments`.
- Require `certified` training assignments before setting `go_live_checklists.training_completed`.

