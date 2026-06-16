# PMS Integration Certification

## Decision

Ready with remediation.

## Evidence

- `app/api/opendental/sync/route.ts`: Open Dental sync route.
- `lib/open-dental.ts`: Open Dental event normalization.
- `lib/adapters/pms-adapter.ts`: PMS adapter interface for patients, appointments, providers.
- `app/dashboard/pms/*`: PMS operations routes exist for overview, connections, errors, import/export, logs, mappings, reconciliation, and sync health.
- `components/dashboard/pms-operations-center.tsx`: PMS operational UI surface.
- `components/enterprise/pms-integration-manager.tsx`: enterprise PMS integration posture.
- `docs/COMMERCIAL_AUTOMATION_AUDIT.md`: states Dentrix/Eaglesoft/Denticon adapters are stub only.
- `docs/CHAIR_FILL_ENGINE_SPEC.md`: states real-time cancellation webhook and waitlist query are pending.

## Vendor Status

| Vendor | Status | Evidence |
| --- | --- | --- |
| Open Dental | Pilot-ready with remediation | Sync route, normalizer, pilot panel, PMS pages |
| Dentrix | Not production-certified | Registry/stub references only |
| Eaglesoft | Not production-certified | Registry/stub references only |
| Denticon | Schema-supported in newer readiness tables; not production-certified | Supported list in implementation intelligence |

## Capability Matrix

| Capability | Status |
| --- | --- |
| Authentication | Partial: credential setup workflow exists; live vendor auth proof absent |
| Data Mapping | Partial: mappings UI exists |
| Patient Sync | Partial: adapter path exists |
| Appointment Sync | Partial: adapter path exists |
| Provider Sync | Partial: adapter path exists |
| Recall Data | Partial: recall fields/tables exist |
| Treatment Plans | Partial: treatment intelligence exists |
| Claims | Partial: insurance recovery schema exists |
| Health Monitoring | Certified at UI/model level |

## PMS Readiness Score

62.

Reason: Open Dental has the strongest operational path, but first-customer readiness depends on vendor-specific credential testing and live sync verification.

