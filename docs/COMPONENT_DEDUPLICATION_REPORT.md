# Component Deduplication Report

Generated: 2026-06-01

## Summary

Created a canonical shared UI target:

- `components/ui/canonical/metric-card.tsx`
- `components/ui/canonical/loading-state.tsx`
- `components/ui/canonical/index.ts`

These re-export the existing canonical implementations without introducing new visual systems.

## Duplicate Risk Areas

| Component Type | Canonical | Duplicate / Risk |
| --- | --- | --- |
| Metric/KPI cards | `components/metric-card.tsx`, `components/ui/canonical/metric-card.tsx` | Tenant health, client maturity, dashboard-specific scorecards. |
| Loading states | `components/loading-skeleton.tsx`, `GlobalBrandLoader`, `components/ui/canonical/loading-state.tsx` | `components/brand/global-loader.tsx` legacy. |
| Navigation/sidebars | AppShell + portal/admin/internal sidebars | Multiple role-specific sidebar implementations. |
| Charts | Portal chart components | Enterprise/autonomous chart-style panels overlap. |
| Dashboards | Executive Dashboard + portal dashboard | Enterprise/autonomous/internal dashboard panels overlap. |
| Brand logos | `components/branding/ZenithLogo.tsx` | Legacy `components/brand/*` and older global brand components. |

## Action Taken

No broad move/removal was performed because the worktree contains many prior changes and a wide refactor would risk regressions. Canonical import paths were established for future consolidation.

## Verdict

Status: PARTIALLY DEDUPLICATED
