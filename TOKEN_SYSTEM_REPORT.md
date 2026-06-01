# Token System Report

## Source

`lib/brand/tokens.ts` exports `ZenithTokens` with colors, gradients, spacing, radius, typography, elevation, and motion.

## CSS Variables

`app/globals.css` and `GlobalBrandProvider` expose:

- `--primary`
- `--secondary`
- `--accent`
- `--success`
- `--warning`
- `--danger`
- `--background`
- `--surface`
- `--card`
- `--foreground`
- `--muted`
- `--border`

## Tailwind Utilities

- `bg-background`
- `bg-surface`
- `bg-card`
- `text-foreground`
- `text-muted`
- `text-primary`
- `border-border`

## Status

Canonical token system implemented and wired into Tailwind, CSS variables, and providers.
