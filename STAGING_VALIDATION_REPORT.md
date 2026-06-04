# Zenith Staging Validation Report

Date: June 2, 2026

## Deployment

Vercel project linked: `eduradiusllc/zenith-dentist-automation`

Deployment URL:

`https://zenithprosai.com`

Deployment ID:

`dpl_G7JM6maZsj14d4vBuGGo9BG3pgiy`

Deployment state: READY

Build result: PASS

## Access Validation

| Check | Result | Notes |
| --- | --- | --- |
| Public HTTP probe | BLOCKED | Preview deployment returns Vercel protection/authentication without bypass. |
| Protected `/login` probe via `vercel curl` | PASS | Login page HTML rendered. |
| Canonical site metadata | PASS | App metadata is normalized to `https://zenithprosai.com`. |
| LIZ API probe | INCONCLUSIVE | Route accepts `{ message }` locally, but Windows/Vercel CLI quoting malformed the staging JSON body. |

## Feature Validation

| Feature | Staging result | Evidence |
| --- | --- | --- |
| Authentication | PARTIAL | Login page renders through Vercel protected curl. OAuth callback and session persistence not certified. |
| Organizations | BLOCKED | Requires Supabase environment variables and verified remote migrations. |
| Onboarding | BLOCKED | Requires organization/profile/member persistence against staging database. |
| Revenue Assessment | BLOCKED | API depends on database/email configuration not present in Vercel environment. |
| Workflow OS | PARTIAL | Code builds; staging execution/persistence not certified. |
| Reports | PARTIAL | Routes build; report persistence not certified against staging database. |
| LIZ | PARTIAL | Local route model exists; staging API probe inconclusive and telemetry persistence requires Supabase config. |
| ALICE | PARTIAL | UI/routes build; live recommendation traceability requires staging data and environment config. |

## Staging Blockers

1. Vercel project currently has no environment variables configured.
2. Supabase remote migration state could not be verified because database authentication failed.
3. Preview deployment is protected, so normal browser/API probes receive Vercel authentication.
4. `NEXT_PUBLIC_SITE_URL` is not configured for the Vercel deployment.
5. Backend-dependent staging workflows cannot be certified without Supabase URL, anon key, service role key, and related integration secrets.

## Staging Decision

Status: CONDITIONAL GO for protected internal preview review only.

Status: NO-GO for production-equivalent staging certification.
