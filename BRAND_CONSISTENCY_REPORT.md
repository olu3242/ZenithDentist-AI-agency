# Brand Consistency Report

## Canonical Brand Assets

| Asset | Status |
| --- | --- |
| `lib/brand.ts` | Present, canonical |
| `lib/brand/tokens.ts` | Present, canonical tokens |
| `lib/theme.ts` | Missing |
| `providers/global-brand-provider.tsx` | Present |
| `providers/global-theme-provider.tsx` | Present |
| `components/branding/GlobalBrandLogo.tsx` | Present |
| `components/branding/GlobalBrandLoader.tsx` | Present |

## Hardcoded Color Audit

Remaining hardcoded colors exist in:

- `app.css` static prototype stylesheet
- `app/og/route.tsx`
- `lib/reports.ts` exported HTML styles
- Several Mission Control panels with inline executive dark-surface hex values
- SVG/chart components with hardcoded stroke/fill values

## Classification

| Item | Classification | Notes |
| --- | --- | --- |
| `components/branding/*` | CANONICAL | Active brand system |
| `providers/global-*` | CANONICAL | Active providers |
| `components/brand/*` | DUPLICATE-SHIM | Re-export compatibility, not active implementation |
| `app.css` | ORPHANED/STATIC | Prototype only, not Next app shell |
| `lib/theme.ts` | MISSING | Expected by sprint, not present |

## Score

Brand Consistency Score: 82/100

## Recommendation

Keep current brand system as canonical. Add `lib/theme.ts` and migrate remaining hardcoded hex styles in Mission Control, OG image, report exports, and static prototype assets in a future cleanup pass.
