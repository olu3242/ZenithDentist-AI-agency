# RENDERING GOVERNANCE REPORT

## Objective

Create a unified enterprise-grade rendering system for Zenith portal pages and prevent logos, watermarks, or local page wrappers from breaking dashboard layout.

## Implemented

- Created `PortalShell`.
- Refactored `AppShell` to use `PortalShell`.
- Created `BackgroundWatermark`.
- Created `DashboardContainer`.
- Created `DashboardGrid`.
- Created `KpiGrid`.
- Created `InsightGrid`.
- Created `ActionGrid`.
- Created `DESIGN_TOKENS.ts`.
- Normalized portal pages to use shared rendering primitives.
- Reduced oversized page header typography.
- Standardized portal header card spacing.
- Added breadcrumb context in the shell.

## Page Normalization Status

- Executive Command: normalized
- Revenue: normalized
- Patients: normalized
- Operations: normalized
- Automation/Orchestration: normalized
- Reports: normalized
- Portal Dashboard: normalized
- ALICE: normalized
- Forecasting: normalized
- Reviews: normalized
- Recall: normalized
- Locations: normalized
- Simulations: normalized

## Governance Rules

1. Portal pages must use `DashboardContainer`.
2. Portal page titles must use `PortalHeader`.
3. KPI sections must use `KpiGrid`.
4. Insight/recommendation sections must use `InsightGrid`.
5. Action/settings groups must use `ActionGrid`.
6. No portal page should render a logo as layout content.
7. Brand watermarks must use `BackgroundWatermark`.
8. No page should create a competing full-viewport shell.
9. Cards should use 8px radius, consistent border, and restrained shadow.
10. Page content should remain inside `max-w-7xl`.

## Validation

- `npm run typecheck`: passed
- `npm run lint`
- `npm run build`: passed

## Deployment Readiness

The rendering system is structurally ready. Browser QA is recommended on authenticated portal routes with seeded tenant data before production deployment.
