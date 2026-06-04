# Platform Integration Certification

Generated: 2026-06-01

## Scores

| Category | Score | Evidence |
| --- | ---: | --- |
| Frontend Wiring | 72 | Primary dashboards wired; landing still mixed. |
| Backend Wiring | 82 | Supabase/server/API modules present across major domains. |
| Executive Dashboard | 86 | Strong runtime/module aggregation. |
| PMS | 38 | PMS backend exists; required `/dashboard/pms/*` routes missing. |
| ALICE | 78 | ALICE modules/API/routes exist; live provider validation pending. |
| Revenue Center | 80 | Portal/admin/internal revenue routes wired to data modules. |
| ROI Assessment | 90 | End-to-end code path exists; env/migration validation pending. |
| Responsiveness | 68 | Responsive CSS patterns present; screenshots not run. |
| UX | 62 | Executive/admin experience understandable; role-specific dental UX incomplete. |
| Performance | 55 | Build passes; Lighthouse not run. |

## Final Decision

REQUIRES REMEDIATION

## Evidence

- ROI Assessment and Executive Dashboard are substantially wired.
- Dashboard and portal data routes use backend modules.
- Landing page is now partially backend-fed but still includes static/demo sections.
- Required PMS dashboard route family is absent.
- Route-level loading/error/offline certification is incomplete.
- Lighthouse and viewport screenshot certification were not executed.

## Required Remediation

1. Create or remap canonical PMS Operations Center routes required by the sprint.
2. Replace landing static previews with public-safe backend adapters or mark them as education-only.
3. Add route-level loading/error/empty/retry/offline states for pilot routes.
4. Run browser viewport screenshots across mobile, tablet, laptop, desktop, and ultra-wide.
5. Run Lighthouse and API timing probes against an accessible deployment.
