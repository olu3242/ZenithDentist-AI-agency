# PMS Certification Report

Generated: 2026-06-01

## Required Route Audit

| Required Route | Exists | Data Source Exists | UI Exists | Error Handling Exists | Status |
| --- | --- | --- | --- | --- | --- |
| `/dashboard/pms` | NO | PARTIAL | NO | NO | FAIL |
| `/dashboard/pms/connections` | NO | PARTIAL | NO | NO | FAIL |
| `/dashboard/pms/sync-health` | NO | PARTIAL | NO | NO | FAIL |
| `/dashboard/pms/mappings` | NO | PARTIAL | NO | NO | FAIL |
| `/dashboard/pms/reconciliation` | NO | PARTIAL | NO | NO | FAIL |
| `/dashboard/pms/logs` | NO | PARTIAL | NO | NO | FAIL |
| `/dashboard/pms/errors` | NO | PARTIAL | NO | NO | FAIL |
| `/dashboard/pms/import-export` | NO | PARTIAL | NO | NO | FAIL |

## Existing PMS-Adjacent Assets

- `/portal/integrations`
- `/internal/integrations`
- `/api/opendental/sync`
- `lib/pms.ts`
- `lib/open-dental.ts`
- `components/enterprise/pms-integration-manager.tsx`

## Verdict

Status: NOT CERTIFIED

The backend PMS pieces exist, but the exact requested PMS dashboard route family is absent. This is a pilot blocker if those routes are required for go-live.
