# Platform Admin Fix Report

Generated: 2026-05-31

## Fixes Applied

1. Supabase service client key precedence fixed.

   - File: `lib/supabase/server.ts`
   - Before: `SUPABASE_SECRET_KEY` was preferred over `SUPABASE_SERVICE_ROLE_KEY`.
   - After: `SUPABASE_SERVICE_ROLE_KEY` is preferred, and legacy `SUPABASE_SECRET_KEY` is accepted only if JWT-like.

2. Runtime env readiness corrected.

   - File: `lib/env.ts`
   - `hasSupabaseServerEnv` now requires a JWT-like Supabase admin key.

3. Runtime diagnostics corrected.

   - File: `lib/runtime-config.ts`
   - Supabase server diagnostics now expect `SUPABASE_SERVICE_ROLE_KEY`.

4. Automation required env names corrected.

   - File: `lib/automation/registry.ts`
   - `SUPABASE_SECRET_KEY` requirements changed to `SUPABASE_SERVICE_ROLE_KEY`.

5. Platform Admin creation diagnostics added.

   - File: `lib/onboarding/bootstrap.ts`
   - Logs request URL, method, safe payload summary, response status, and response body message on failure.

6. Provider initialization diagnostics added.

   - Files:
     - `lib/supabase/server.ts`
     - `lib/supabase/client.ts`
     - `lib/ai/provider.ts`
     - `lib/email.ts`
     - `lib/stripe/operations.ts`

## Remaining Manual Configuration Required

`SUPABASE_SERVICE_ROLE_KEY` must be added to `.env.local` and deployment environments.

The key should be the Supabase service role JWT from the Supabase project API settings. Do not use the anon key, publishable key, or a non-JWT secret string for `auth.admin.createUser`.

## Expected Behavior After Configuration

When `SUPABASE_SERVICE_ROLE_KEY` is present:

1. `/signup` first-user flow calls `signupAction()`.
2. `bootstrapUser()` creates a Supabase Auth user via `auth.admin.createUser()`.
3. Profile, organization, organization membership, and onboarding run are created.
4. First user becomes `super_admin`.
5. User is routed to `/onboarding`, then `/mission-control` after onboarding completion.

When `SUPABASE_SERVICE_ROLE_KEY` is missing:

1. `createServiceClient()` returns `null`.
2. Signup returns a local configuration message instead of calling Supabase with an invalid key.
3. No misleading `Invalid API key` error should be produced by this app path.

## Validation

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS

Build-time diagnostic confirmation:

- `SUPABASE SERVICE ROLE LOADED false`
- `SUPABASE LEGACY SECRET LOADED true`
- `SUPABASE ADMIN KEY USABLE false`
- `ADMIN TOKEN LOADED true`

## Success Criteria Status

- Platform Admin creation completes successfully: BLOCKED until real `SUPABASE_SERVICE_ROLE_KEY` is provided.
- No invalid API key errors remain from wrong key precedence: FIXED.
- Environment variables validated: COMPLETE.
- Build passes cleanly: PASS.
