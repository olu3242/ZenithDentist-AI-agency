# Branding Certification Report

Date: 2026-06-04

## Production Branding

- Brand name normalized to `Zenith Pros`.
- Trademark text normalized to `Zenith Pros`.
- Product descriptor normalized to `Patient Revenue Operating System`.
- Production domain normalized to `https://zenithprosai.com`.

## Icon System

- `public/favicon.ico`
- `public/favicon.png`
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/apple-touch-icon.png`
- `app/icon.png`
- `app/opengraph-image.png`
- `app/twitter-image.png`

All generated assets use the existing Zenith logo mark path and the canonical brand colors `#0EA5E9` and `#14B8A6`.

## Metadata

- `metadataBase` is `https://zenithprosai.com`.
- Favicon metadata points to `/favicon.ico`.
- Apple icon metadata points to `/apple-touch-icon.png`.
- Open Graph image points to `/opengraph-image.png`.
- Twitter image points to `/twitter-image.png`.

## Validation Status

- `npm run build`: PASS
- `npm run lint`: PASS with no ESLint warnings or errors. The command prints the standard Next.js 15 `next lint` deprecation notice.
- `npm run typecheck`: PASS
- `npm run test:e2e`: PASS

## Local Production Route Check

Verified against `next start` on a temporary local port:

- `/favicon.ico`: 200
- `/favicon.png`: 200
- `/favicon-16x16.png`: 200
- `/favicon-32x32.png`: 200
- `/apple-touch-icon.png`: 200
- `/icon.png`: 200
- `/opengraph-image.png`: 200
- `/twitter-image.png`: 200
