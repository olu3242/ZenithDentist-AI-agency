# ALICE Knowledge Map

ALICE V3 is grounded through `lib/alice/knowledge/index.ts`. This is a knowledge registry over existing modules, not a second AI layer.

| Domain | Certification | Sources |
| --- | --- | --- |
| Platform | CERTIFIED | `lib/analytics-projector.ts`, `lib/patient-revenue-engine.ts`, `app/mission-control/page.tsx` |
| Executive Dashboard | CERTIFIED | `app/mission-control/page.tsx`, `components/mission-control/*` |
| Revenue | CERTIFIED | `lib/roi.ts`, `lib/revenue-playbooks/index.ts`, `lib/data/leads.ts` |
| Workflow Governance | CERTIFIED | `lib/workflow-os/*`, governance migration |
| PMS Operations | CERTIFIED | `lib/pms-operations.ts`, `app/dashboard/pms/*` |
| RBAC | PARTIAL | `middleware.ts`, `lib/auth-routing.ts`, `lib/security-edge.ts` |
| Tenant Isolation | PARTIAL | `lib/tenant/index.ts`, tenant certification docs |

## Capabilities

- Configuration awareness
- Persona awareness
- Tenant awareness
- Permission awareness
- Workflow awareness
- PMS awareness
- Revenue awareness
- Knowledge versioning
- Knowledge auditing
- Knowledge drift monitoring

## Decision

ALICE knowledge coverage is certified for platform reasoning. Live RLS and production tenant-isolation proof remain environment-dependent.
