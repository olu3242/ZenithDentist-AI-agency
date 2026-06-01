# Dashboard Canonicalization Report

Generated: 2026-06-01

## Canonical Dashboard System

| Dashboard Domain | Canonical Route / Library |
| --- | --- |
| Executive Dashboard | `/dashboard`, `components/metric-card.tsx`, `RuntimeHealthDashboard` |
| Practice Portal | `/portal/dashboard`, `components/portal/*` |
| Mission Control | `/mission-control`, `components/mission-control/*` |
| Admin CRM | `/admin/*`, `components/admin/*` |
| Revenue Center | `/portal/revenue`, `/admin/roi`, `/internal/revenue` |
| ALICE Center | `/portal/alice`, `/api/alice/*` |

## Duplicate Dashboard Risk

- `components/enterprise/*` overlaps with Mission Control and internal platform panels.
- `components/autonomous/*` overlaps with ALICE/Mission Control runtime intelligence.
- `app/internal/*` overlaps with Mission Control and portal routes.
- Landing role workspace cards are static previews, not canonical dashboards.

## KPI Logic

Canonical KPI logic should remain in:

- `lib/data/operations.ts`
- `lib/data/leads.ts`
- `lib/runtime/*`
- `lib/workflow-os/*`
- `lib/roi.ts`
- `lib/health.ts`

## Verdict

Status: PARTIALLY CANONICALIZED

Mission Control and Portal are the strongest canonical dashboard systems. Internal/enterprise/autonomous dashboard surfaces remain consolidation candidates.
