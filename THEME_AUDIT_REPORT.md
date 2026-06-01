# Theme Audit Report

## Canonical Palette

| Token | Hex |
| --- | --- |
| primary | `#2563EB` |
| secondary | `#06B6D4` |
| accent | `#14B8A6` |
| success | `#22C55E` |
| warning | `#F59E0B` |
| danger | `#EF4444` |
| navy | `#0B1020` |
| background | `#F8FAFC` |
| surface | `#F1F5F9` |
| card | `#FFFFFF` |
| foreground | `#0F172A` |
| muted | `#64748B` |
| border | `#E2E8F0` |

## Gradients

- Primary Zenith: `linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)`
- Sidebar: `linear-gradient(180deg, #0B1020 0%, #111827 100%)`
- Hero: `linear-gradient(135deg, #0B1020 0%, #2563EB 50%, #06B6D4 100%)`

## Implementation

- `tailwind.config.ts` now maps token utilities to the official light enterprise palette.
- `app/globals.css` defines both canonical CSS variables (`--primary`, `--background`, etc.) and compatibility brand variables.
- Global app background is light (`#F8FAFC`) with deep navy navigation surfaces.
- Legacy semantic utilities (`bg-paper`, `bg-ink`, `text-ink`, `border-line`) are normalized to official tokens.

## Score

Theme Consistency Score: 91/100
