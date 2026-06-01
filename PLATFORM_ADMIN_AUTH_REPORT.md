# Platform Admin Auth Report

Generated: 2026-05-31

## Executive Finding

Platform Admin creation fails because the Supabase Admin API path is initialized without a valid `SUPABASE_SERVICE_ROLE_KEY`.

The local `.env.local` file has:

- `NEXT_PUBLIC_SUPABASE_URL`: present
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: present, JWT-like
- `SUPABASE_SERVICE_ROLE_KEY`: missing
- `SUPABASE_SECRET_KEY`: present, but not JWT-like

Before this fix, `createServiceClient()` preferred `SUPABASE_SECRET_KEY` over `SUPABASE_SERVICE_ROLE_KEY`. That means Platform Admin creation could call Supabase Auth Admin with a non-service-role key and receive the provider error: `Invalid API key`.

## Step 1 - Environment Audit

Files inspected:

- `.env.local`: present
- `.env`: missing
- `.env.production`: missing
- `.env.example`: present
- `next.config.mjs`: present, no env injection
- `vercel.json`: missing
- `middleware.ts`: reads access tokens directly from `process.env`
- `lib/env.ts`: canonical env schema
- `src/config/env.ts`: missing
- `config/env.ts`: missing

Required env status:

| Variable | `.env.local` status | Runtime side | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Present | server + client | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present, JWT-like | server + client | Correct for browser/client auth only |
| `SUPABASE_SERVICE_ROLE_KEY` | Missing | server only | Required for `auth.admin.createUser` |
| `SUPABASE_SECRET_KEY` | Present, non-JWT | server only | Legacy/incorrect for Supabase Auth Admin in this app |
| `OPENAI_API_KEY` | Present | server only | Used only when `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | Present | server only | Used only when `AI_PROVIDER=anthropic` |
| `RESEND_API_KEY` | Present | server only | Used by `lib/email.ts` |
| `ADMIN_ACCESS_TOKEN` | Present | server/middleware | Route guard token |
| `PORTAL_ACCESS_TOKEN` | Present | server/middleware | Route guard token |
| `INTERNAL_ACCESS_TOKEN` | Present | server/middleware | Super admin/internal token |

Variables referenced in code but not defined in `.env.local`:

- `SUPABASE_SERVICE_ROLE_KEY`

Variables defined and used:

- `ADMIN_ACCESS_TOKEN`
- `AI_PROVIDER`
- `ANTHROPIC_API_KEY`
- `CALENDLY_URL`
- `INTERNAL_ACCESS_TOKEN`
- `NEXT_PUBLIC_DEFAULT_ORG_SLUG`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_LINKEDIN_PARTNER_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `OPENAI_API_KEY`
- `PORTAL_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `STRIPE_API_KEY`
- `SUPABASE_SECRET_KEY`

## Step 2 - Platform Admin Creation Path

Execution path:

1. UI: `app/signup/page.tsx`
2. Server Action: `app/auth-actions.ts` -> `signupAction()`
3. Service Layer: `lib/onboarding/bootstrap.ts` -> `bootstrapUser()`
4. Supabase Service Client: `lib/supabase/server.ts` -> `createServiceClient()`
5. External Provider: Supabase Auth Admin -> `auth.admin.createUser()`
6. Database: `profiles`, `organizations`, `organization_members`, `tenant_onboarding_runs`
7. Post-create routing: `/onboarding`, then role portal via `getDefaultPortalForRole()`

First-user role behavior:

- If no `profiles.role = super_admin` exists, first user becomes `super_admin`.
- First organization is marked as default through organization settings.

## Step 3 - Actual Failure Location

No local file contains a hardcoded `Invalid API key` throw.

The provider error is returned by Supabase at this callsite:

- File: `lib/onboarding/bootstrap.ts`
- Function: `bootstrapUser()`
- Callsite line: `107`
- Failure handling line: `117`
- External call: `supabase.auth.admin.createUser(...)`

Call stack:

1. `app/signup/page.tsx` renders signup form.
2. `app/auth-actions.ts` invokes `signupAction(formData)`.
3. `signupAction()` calls `bootstrapUser(...)`.
4. `bootstrapUser()` calls `createServiceClient()`.
5. `bootstrapUser()` calls `supabase.auth.admin.createUser(...)`.
6. Supabase Auth Admin returns `Invalid API key`.

## Step 4 - Supabase Client Audit

Clients:

| Client | File | Key used | Appropriate for admin creation |
| --- | --- | --- | --- |
| `createServiceClient()` | `lib/supabase/server.ts` | `SUPABASE_SERVICE_ROLE_KEY`, with JWT-like legacy fallback | Yes |
| `createServerAuthClient()` | `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No, login/reset only |
| `createBrowserClient()` | `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No |

Violation found:

- `createServiceClient()` previously preferred `SUPABASE_SECRET_KEY` over `SUPABASE_SERVICE_ROLE_KEY`.
- `.env.local` has `SUPABASE_SECRET_KEY` set to a non-JWT value.
- This made the Admin API path vulnerable to invalid-key initialization.

Fix applied:

- `createServiceClient()` now prefers `SUPABASE_SERVICE_ROLE_KEY`.
- `SUPABASE_SECRET_KEY` is accepted only if it is JWT-like.
- If no usable admin key exists, the service client returns `null` and logs masked diagnostics.

## Step 5 - Provider Audit

| Provider | Initialization file | Required key | Loaded locally |
| --- | --- | --- | --- |
| Supabase Admin | `lib/supabase/server.ts` | `SUPABASE_SERVICE_ROLE_KEY` | False |
| Supabase Browser/Auth | `lib/supabase/client.ts`, `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | True |
| OpenAI | `lib/ai/provider.ts` | `OPENAI_API_KEY` | True |
| Anthropic | `lib/ai/provider.ts` | `ANTHROPIC_API_KEY` | True |
| Resend | `lib/email.ts` | `RESEND_API_KEY` | True |
| Stripe | `lib/stripe/operations.ts` | `STRIPE_API_KEY` | True |
| Google Analytics | `app/layout.tsx`, `lib/telemetry/gtm.ts` | `NEXT_PUBLIC_GA_ID` | True |
| Vercel | none found | n/a | n/a |

## Step 6 - Temporary Diagnostics Added

Temporary boolean-only diagnostics were added before provider/client initialization:

- `SUPABASE SERVICE ROLE LOADED`
- `SUPABASE LEGACY SECRET LOADED`
- `SUPABASE ADMIN KEY USABLE`
- `ADMIN TOKEN LOADED`
- `SUPABASE PUBLIC URL LOADED`
- `SUPABASE ANON KEY LOADED`
- `SUPABASE BROWSER URL LOADED`
- `SUPABASE BROWSER ANON KEY LOADED`
- `OPENAI LOADED`
- `ANTHROPIC LOADED`
- `RESEND LOADED`
- `STRIPE LOADED`

No secret values are printed.

## Step 7 - Network Failure Trace

Platform Admin endpoint:

- Request URL: `$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users`
- Method: `POST`
- Headers: Supabase SDK-managed `apikey` and `Authorization`
- Request payload: email, password, `email_confirm`, metadata
- Failure origin: Supabase Auth Admin

The app now logs:

- provider
- function
- request URL
- method
- status
- response body/message
- safe request payload summary

## Step 8 - Vercel Audit

No `vercel.json` exists in the repository.

Deployment env comparison could not be performed from local files. Production/Preview/Development variables must be checked in the Vercel project dashboard or via Vercel CLI.

Required production variable currently missing locally:

- `SUPABASE_SERVICE_ROLE_KEY`

## Step 9 - Root Cause Analysis

Root Cause:

- `SUPABASE_SERVICE_ROLE_KEY` is missing.
- `SUPABASE_SECRET_KEY` is present but is not JWT-like.
- The service client previously preferred `SUPABASE_SECRET_KEY`, causing Supabase Auth Admin to receive an invalid credential.

Evidence:

- Masked env audit: `SUPABASE_SERVICE_ROLE_KEY=MISSING`
- Masked env audit: `SUPABASE_SECRET_KEY=SET shape=NON_JWT`
- Admin creation callsite: `lib/onboarding/bootstrap.ts:107`
- Service client key selection before fix: `env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY`

Affected files:

- `lib/supabase/server.ts`
- `lib/env.ts`
- `lib/runtime-config.ts`
- `lib/automation/registry.ts`
- `lib/onboarding/bootstrap.ts`

Risk Level:

- High for first-user bootstrap and any server-side write path that requires elevated Supabase privileges.

Fix Recommendation:

- Add the real Supabase service role JWT to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`.
- Add the same variable to Vercel Production/Preview/Development environments.
- Remove or rename the non-JWT `SUPABASE_SECRET_KEY` if it is not intended for Supabase Admin API usage.
- Remove temporary diagnostics after confirming bootstrap succeeds.

