# RESPONSIVE AUDIT

## Desktop

The shell uses a stable `260px` sidebar and a `minmax(0, 1fr)` content region. Portal content is constrained to `max-w-7xl`, preventing uncontrolled wide-screen sprawl.

## Tablet

Grid components collapse from multi-column to one or two columns depending on available width. Cards and charts remain inside the shared content container.

## Mobile

The sidebar stacks above the content, top navigation wraps safely, role labels collapse where needed, and breadcrumbs truncate instead of overflowing.

## Overflow Controls

- Shell content region uses `min-w-0`.
- Breadcrumbs use truncation.
- Navigation labels truncate.
- Watermark is absolutely positioned and clipped by its parent.
- KPI cards use stable minimum height.

## Known Visual Risks

Some individual chart/table components may still require local overflow handling if their internal implementation uses fixed column widths. The shell and page container now provide the correct responsive boundary for those components.

## Status

Implemented at shell and page-container level. Full browser screenshot QA is still recommended before production release.
