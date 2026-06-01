# Documentation Canonicalization Report

Generated: 2026-06-01

## Summary

The `docs/` folder contains many sprint-specific reports. Several are useful evidence artifacts, but there is no canonical index separating current truth from historical sprint output.

## Canonical Documentation Index

| Category | Canonical Current Documents |
| --- | --- |
| Pilot readiness | `DENTAL_PILOT_READINESS_REPORT.md`, `PILOT_CERTIFICATION_REPORT.md` |
| Migration governance | `MIGRATION_GOVERNANCE.md`, `MIGRATION_GOVERNANCE_CERTIFICATION.md`, `MIGRATION_CERTIFICATION_REPORT.md` |
| Revenue/ROI | `ROI_ASSESSMENT_COMMERCIALIZATION_REPORT.md`, `ROI_CERTIFICATION_REPORT.md`, `REVENUE_CERTIFICATION_REPORT.md` |
| Platform integration | `PLATFORM_INTEGRATION_CERTIFICATION.md`, `API_WIRING_AUDIT.md` |
| Canonicalization | `PROS_CANONICALIZATION_CERTIFICATION.md`, this report |
| Operations | `PRODUCTION_CUTOVER_PLAN.md`, `BACKUP_PLAN.md`, `ROLLBACK_PLAN.md` |

## Duplicate/Superseded Risk

- Multiple revenue reports overlap: revenue architecture, certification, reconciliation, tracking, validation.
- Multiple landing reports overlap: experience review, gap matrix, integration report.
- Multiple migration reports overlap: audit, drift, dry run, certification, governance.
- Multiple commercial reports overlap: commercial readiness and commercialization readiness.

## Archive Recommendation

Create `docs/archive/` and move superseded sprint reports after stakeholder approval. No files were archived in this pass to avoid losing evidence.

## Verdict

Status: PARTIALLY CANONICALIZED
