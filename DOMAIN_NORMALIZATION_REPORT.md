# Domain Normalization Report

Date: 2026-06-04

## Canonical Production Domain

`https://zenithprosai.com`

## Updated Public-Facing References

- App metadata base, Open Graph URL, Twitter image metadata, and canonical URL now resolve from `https://zenithprosai.com`.
- JSON-LD homepage URL now uses `https://zenithprosai.com`.
- Environment defaults now use `https://zenithprosai.com` instead of a localhost fallback for public site metadata.
- Launch/runbook references to old Vercel, Zenith Dentist, and Zenith AI app URLs were normalized to `https://zenithprosai.com`.
- Calendly webhook documentation now targets `https://zenithprosai.com/api/calendly/events`.

## Intentional Exceptions

- Supabase project URLs remain intact because they are operational service endpoints, not public brand domains.
- Third-party dependency URLs remain intact, including Google Tag Manager, Meta Pixel, Anthropic, OpenAI, Unsplash, Calendly, npm registry, GitHub, and vendor documentation links.
- Local development smoke-test defaults may still use `http://localhost:3000` when explicitly scoped to local development.

## Verification

- `git grep -n "vercel.app"` reviewed and production references normalized.
- `git grep -n "supabase.co"` reviewed and retained only where used as Supabase service endpoints or setup documentation.
- `git grep -n "localhost"` reviewed and retained only in development/test or historical audit context.
- `git grep -n "http://"` and `git grep -n "https://"` reviewed for public-facing Zenith domain references.
