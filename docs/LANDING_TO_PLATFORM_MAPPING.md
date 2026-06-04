# Landing To Platform Mapping

Generated: 2026-06-01

| Landing Section | Platform Counterpart | Status |
| --- | --- | --- |
| Hero Dashboard | `getAdminDashboardData()`, `getRuntimeHealthState()` | MAPPED |
| Route Probe | Mission Control/ALICE/Enterprise API routes | MAPPED |
| Ecosystem Bar | PMS/integration modules | EDUCATIONAL |
| Gallery Workspace | No single backend equivalent | STATIC PREVIEW |
| Revenue Leaks | Revenue playbooks, ROI assessment, `lib/roi.ts` | MAPPED |
| Playbooks | `lib/revenue-playbooks`, automation marketplace | MAPPED |
| ALICE Practice Advisor | `/portal/alice`, `/api/alice/*` | MAPPED |
| Mission Control | `/mission-control`, `/api/mission-control/*` | MAPPED |
| PMS Operations | `/portal/integrations`, `/api/opendental/sync` | PARTIAL |
| Role Workspaces | No canonical role routes | STATIC PREVIEW |
| Revenue Assessment | `components/public/roi-funnel-form.tsx`, `/api/roi-assessment` | MAPPED |
| Installation | Onboarding/bootstrap/automation/PMS modules | PARTIAL |
| FAQ | `/api/analytics/faq` | MAPPED |

## Required Removal or Relabeling

- Gallery Workspace should be relabeled as product preview or wired to real screenshots/data.
- Role Workspaces should be removed or backed by canonical role dashboards.
- PMS Operations should route to a real PMS Operations Center once created.

## Verdict

Status: PARTIALLY MAPPED
