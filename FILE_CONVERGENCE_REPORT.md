# File Convergence Report

## Duplicate / Compatibility Files

| Area | Files | Classification |
| --- | --- | --- |
| Brand providers | `providers/global-*`, `components/brand/global-*` | Canonical + re-export shims |
| Logo | `components/branding/*`, `components/brand/global-brand-logo.tsx` | Canonical + re-export shim |
| Runtime/Event | `lib/event-fabric`, `lib/runtime/event-fabric`, `lib/events/*` | Partial overlap |
| Analytics | `lib/analytics.ts`, `lib/telemetry/gtm.ts`, workflow analytics modules | Partial overlap |
| Reports | Many root `*_REPORT.md` files | Needs archive strategy |
| Static prototype | `index.html`, `app.css`, `app.js`, `zenith-ai-*.html` | Orphan/static artifacts |

## Conflicts

- `lib/theme.ts` missing while providers/tokens exist.
- Hardcoded colors remain in `app.css`, OG route, report HTML, and several executive panels.

## Cleanup Recommendation

Do not delete during dirty-state audit. Archive reports into `reports/` and static prototype assets into `archive/` after committing current work.
