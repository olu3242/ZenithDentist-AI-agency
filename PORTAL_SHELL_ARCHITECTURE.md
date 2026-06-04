# PORTAL SHELL ARCHITECTURE

## Canonical Shell

`components/app/portal-shell.tsx` is the unified enterprise shell for authenticated product areas.

## Shell Responsibilities

- Sidebar navigation
- Organization switcher
- Top navigation
- Breadcrumbs
- Notification count
- User role menu
- Sign out action
- Offline state banner
- Background watermark layer
- Governed content region

## AppShell Compatibility

`components/app/app-shell.tsx` remains the public compatibility wrapper. Existing pages can continue importing `AppShell`, while the actual rendering system is centralized in `PortalShell`.

## Rendering Contract

Pages should render only their domain content. They should not create competing full-page shells, brand marks, viewport-level backgrounds, or custom content containers.

## Content Rules

- Use `DashboardContainer` as the first page-level content wrapper.
- Use `PortalHeader` as the page title surface.
- Use shared grids for KPI, insight, action, and dashboard sections.
- Keep page-specific layout decisions inside grid composition, not shell structure.

## Result

The portal now renders like a SaaS operating system: stable sidebar, predictable top bar, breadcrumb context, restrained header, and structured content grid.
