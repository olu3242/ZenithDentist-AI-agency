# LAYOUT AUDIT

## Scope

Audited the active application layout surfaces:

- `app/layout.tsx`
- `app/portal/layout.tsx`
- `app/dashboard/*`
- `app/admin/layout.tsx`
- `app/internal/layout.tsx`
- `app/mission-control/page.tsx`
- `components/app/app-shell.tsx`
- `components/portal/*`

## Findings

### Root Layout

`app/layout.tsx` owns global providers, analytics, theme, and the floating LIZ widget. It does not impose portal spacing and remains appropriate as the global application root.

### Portal Layout

`app/portal/layout.tsx` delegates to `AppShell`, but portal pages previously owned their own content width, spacing, and grids. This created inconsistent rendering when new pages or widgets were added.

### Dashboard Layout

There is no `app/dashboard/layout.tsx`. Dashboard pages directly use `AppShell`, which is now backed by `PortalShell`. Role dashboards therefore inherit the same top navigation, sidebar, breadcrumb, and watermark behavior.

### Admin Layout

`app/admin/layout.tsx` uses `AppShell`. Admin pages inherit the unified shell after the AppShell refactor.

### Mission Control Layout

There is no `app/mission-control/layout.tsx`. Mission Control uses `AppShell` directly and keeps its specialized three-column operational layout. It now inherits the governed shell and watermark behavior.

## Root Cause

The portal had a shared outer shell, but page-level content wrappers were locally defined. Each page could choose its own max width, grid breakpoints, spacing, and card groupings, which caused scattered components, excessive whitespace, and inconsistent enterprise dashboard structure.

## Remediation

- Introduced `PortalShell` as the canonical shell implementation.
- Refactored `AppShell` to delegate to `PortalShell`.
- Added `BackgroundWatermark` as an absolute, non-layout-affecting brand layer.
- Added `DashboardContainer`, `DashboardGrid`, `KpiGrid`, `InsightGrid`, and `ActionGrid`.
- Normalized all portal pages to use the shared container.
- Reduced page header scale and placed it in a governed card surface.

## Status

Resolved for portal rendering governance. Dashboard, admin, internal, and mission-control surfaces inherit the same shell.
