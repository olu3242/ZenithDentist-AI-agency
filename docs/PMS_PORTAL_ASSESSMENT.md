# PMS Portal Assessment

Date: 2026-06-01

## Scope

Specialist: PMS Integration Architect

## Evidence Reviewed

- PMS adapters: `lib/pms.ts`
- PMS integration page: `app/portal/integrations/page.tsx`
- PMS sync route: `app/api/opendental/sync/route.ts`
- Enterprise integration state: `lib/enterprise-cloud.ts`
- PMS integration component: `components/enterprise/pms-integration-manager.tsx`

## Classification

Current implementation constitutes:

A. PMS Framework: YES

B. PMS Integration Layer: PARTIAL

C. PMS Operations Portal: NO

## PMS Portal Component Matrix

| Component | Status | Evidence |
| --- | --- | --- |
| PMS Connection Center | Partial | `/portal/integrations`, `pms_integrations`, supported providers in `lib/pms.ts` |
| PMS Sync Health Center | Partial | PMS health score and enterprise state exist; not a full operational center |
| PMS Mapping Center | Missing | No dedicated mapping UI for patient, appointment, production, collections, review, referral fields |
| PMS Reconciliation Center | Missing | No reconciliation queue or mismatch review center found |
| PMS Error Management Center | Partial | Runtime/provider health exists, but no PMS-specific error workbench |
| PMS Audit Center | Partial | Runtime/Event Fabric audit exists, but no PMS-specific audit center |
| PMS Import/Export Center | Missing | No dedicated import/export portal found |

## Direct Answer

DOES A TRUE PMS PORTAL EXIST?

NO.

There is a PMS framework and a partial PMS integration layer. A complete PMS Operations Portal does not yet exist.
