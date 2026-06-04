# WATERMARK SYSTEM

## Component

`components/app/background-watermark.tsx`

## Purpose

The Zenith logo can appear as background brand texture without occupying dashboard space or changing layout dimensions.

## Rules

- Opacity: `0.035`
- Pointer events: `none`
- Positioning: `absolute`
- Z-index: below content
- Sizing: viewport-constrained with `object-contain`
- Layout impact: none

## Implementation

The watermark is mounted inside `PortalShell` behind the content layer. The content wrapper uses a higher z-index, so dashboard cards, tables, charts, forms, and navigation remain fully interactive.

## Governance

No page should render a logo as main dashboard content unless the page is a dedicated brand, login, loading, or marketing experience.

## Status

Implemented. Portal pages no longer need to render brand marks to achieve branded presentation.
