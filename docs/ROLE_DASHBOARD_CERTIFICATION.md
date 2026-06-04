# Role Dashboard Certification

Generated: 2026-06-01

## Implemented Routes

| Route | Status | Data Sources |
| --- | --- | --- |
| `/dashboard/front-desk` | PASS | `operational_metrics`, `automation_events`, runtime traces, ALICE insights |
| `/dashboard/provider` | PASS | `operational_metrics`, `automation_events`, ROI calculations, ALICE insights |
| `/dashboard/office-manager` | PASS | Runtime traces, leads, PMS route handoff, automation events |
| `/dashboard/practice-owner` | PASS | ROI calculations, recovered revenue, automation success, ALICE insights |

## Canonical Implementation

- `components/dashboard/role-dashboard.tsx`
- `lib/role-dashboard.ts`
- `components/ui/canonical/metric-card.tsx`
- `components/app/app-shell.tsx`
- `lib/navigation.ts`
- `lib/auth-routing.ts`

## Required Data Source Mapping

| Required Source | Status | Evidence |
| --- | --- | --- |
| Patients | PASS | Patient recovery derived from `operational_metrics.recall_recovery_count`. |
| Appointments | PASS | Appointment workflow events derived from `automation_events`. |
| Revenue Attribution | PASS | `roi_calculations.revenue_recovery_opportunity`, `recoverable_revenue`, portal recovered revenue. |
| Workflow Executions | PASS | Runtime traces from `getRuntimeHealthState()`. |
| ALICE Insights | PASS | Stored insights or generated insights from metrics/events. |

## Certification

Status: PASS

All required role routes exist and share one canonical role dashboard implementation.
