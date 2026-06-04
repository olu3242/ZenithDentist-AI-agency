# PMS Portal Gap Matrix

Date: 2026-06-01

## Harmonized Status

The original matrix is superseded by the implemented Canonical PMS Operations Center. The PMS route family now exists under `/dashboard/pms` and shares `PMSOperationsCenter`, `getPMSOperationsState`, `lib/pms.ts`, `lib/open-dental.ts`, and the enterprise cloud integration state.

| Capability | Priority | Status | Evidence | Remaining Gap |
| --- | --- | --- | --- |
| PMS Mapping Center | P0 Critical | Implemented | `/dashboard/pms/mappings`, `PMSOperationsCenter`, `getPMSOperationsState().mappings` | Needs live remote PMS credential validation per provider. |
| PMS Reconciliation Center | P0 Critical | Implemented | `/dashboard/pms/reconciliation`, Open Dental pilot batch reconciliation hash | Needs live mismatch queue persistence for production batches. |
| PMS Import/Export Center | P1 Important | Implemented | `/dashboard/pms/import-export`, import endpoint `/api/opendental/sync`, export source `normalized_healthcare_events` | Needs operator-triggered export/download actions. |
| PMS Error Management Center | P1 Important | Implemented | `/dashboard/pms/errors`, integration degradation and health filtering | Needs persisted remediation workflow linkage. |
| PMS Audit Center | P1 Important | Partial | `/dashboard/pms/logs`, enterprise integration logs, revenue orchestration run summaries | Needs dedicated immutable PMS audit evidence records. |
| PMS Sync Health Center | P1 Important | Implemented | `/dashboard/pms/sync-health`, integration health scores | Needs remote connector health proof in staging. |
| PMS Connection Center | P2 Future Enhancement | Implemented | `/dashboard/pms/connections`, `/portal/integrations`, `lib/pms.ts`, supported provider adapters | Dentrix/Eaglesoft/Carestream remain adapter-normalization ready, not vendor-auth certified. |

## Decision

PMS Portal readiness is no longer missing at the UI/route level. Production certification remains partial until live PMS credentials, remote sync, persisted reconciliation evidence, retry proof, and connector certification are verified in staging.
