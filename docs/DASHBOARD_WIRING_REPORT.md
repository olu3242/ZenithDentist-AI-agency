# Dashboard Wiring Report

Generated: 2026-06-01

## Summary

Dashboard surfaces are mostly wired to backend modules. However, several dashboard concepts requested by the sprint are represented as portal/internal pages rather than the exact named dashboards.

## KPI Mapping

| KPI / Widget | Backend Source | Status |
| --- | --- | --- |
| Revenue Recovered | `operational_metrics.recovered_revenue`, `roi_calculations.recoverable_revenue`, `roi_calculations.revenue_recovery_opportunity` | WIRED |
| Workflow Health | `getAutomationOSState()`, `getWorkflowRuntimeHealth()`, `workflow-os` modules | WIRED |
| Runtime Health | `getRuntimeHealthState()`, runtime trace modules | WIRED |
| Practice Health | `calculatePracticeHealth()` from operational metrics, events, benchmarks | WIRED |
| ALICE Opportunities | `generateOperationalInsights()`, `lib/alice`, `/api/alice/*` | WIRED |
| Leads | `leads` via `getAdminDashboardData()` | WIRED |
| Bookings | `bookings` via `getAdminDashboardData()` | WIRED |
| Reports | `reports`, `buildExecutiveReport()` | WIRED |
| PMS Health | `pms_integrations`, Open Dental sync modules | PARTIAL |

## Surface Audit

| Surface | Route | Status |
| --- | --- | --- |
| Practice Owner Dashboard | `/dashboard`, `/portal/dashboard` | WIRED |
| Front Desk Dashboard | Role workspace in landing only | PARTIAL |
| Provider Dashboard | Role workspace in landing only | PARTIAL |
| Office Manager Dashboard | Role workspace in landing only | PARTIAL |
| Mission Control | `/mission-control` | WIRED |
| PMS Center | `/portal/integrations`, `/api/opendental/sync` | PARTIAL |
| Revenue Center | `/portal/revenue`, `/internal/revenue`, `/admin/roi` | WIRED |
| ALICE Center | `/portal/alice`, `/api/alice/*` | WIRED |

## Blockers

- Dedicated role dashboards for Front Desk, Provider, and Office Manager are not standalone canonical routes.
- PMS Center is not present under the required `/dashboard/pms/*` route family.
- Landing role dashboards are static previews and cannot be counted as backend-certified dashboards.

## Verdict

Status: PARTIALLY WIRED
