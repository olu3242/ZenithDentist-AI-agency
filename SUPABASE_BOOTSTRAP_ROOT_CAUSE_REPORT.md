# Supabase Bootstrap Root Cause Report

Generated: 2026-06-01

## Executive Summary

Platform Admin bootstrap is failing because `SUPABASE_SERVICE_ROLE_KEY` is populated with a Supabase JWT whose decoded role claim is `anon`, not `service_role`.

The variable exists and is readable by the Next.js runtime, but it is the wrong Supabase key type for admin account creation. Supabase admin operations such as `auth.admin.createUser()` require the project service role key.

## Exact Failure Location

- File: `lib/onboarding/bootstrap.ts`
- Function: `bootstrapUser()`
- Line: 70
- Guard: `const supabase = createServiceClient();`
- Failure return: line 74
- Message after fix: `A Supabase service_role key is required before account bootstrap can run.`

`bootstrapUser()` only returns this bootstrap credential failure when `createServiceClient()` returns `null`.

## Root Cause Evidence

Environment audit:

- `.env.local` exists.
- `NEXT_PUBLIC_SUPABASE_URL` is set.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set.
- `SUPABASE_SERVICE_ROLE_KEY` is set.
- `SUPABASE_SECRET_KEY` is not set.

JWT claim audit:

- `SUPABASE_SERVICE_ROLE_KEY` is JWT-shaped.
- Project ref claim matches the Supabase URL project ref.
- Role claim is `anon`.
- Required role claim is `service_role`.

Runtime diagnostics:

- `SUPABASE_SERVICE_ROLE_KEY true`
- `SUPABASE SERVICE ROLE LOADED true`
- `SUPABASE SERVICE ROLE CLAIM anon`
- `SUPABASE ADMIN KEY USABLE false`

This proves the key is loaded, but it is not authorized for Supabase admin APIs.

## Bootstrap Execution Path

Signup:

1. `/signup`
2. `app/signup/page.tsx`
3. Form posts to `signupAction()`
4. `app/auth-actions.ts:10`
5. `bootstrapUser()`
6. `lib/onboarding/bootstrap.ts:69`
7. `createServiceClient()`
8. `lib/supabase/server.ts:26`
9. Supabase admin operation: `supabase.auth.admin.createUser()`
10. Profile write: `profiles`
11. Organization write: `organizations`
12. Membership write: `organization_members`
13. Onboarding run write: `tenant_onboarding_runs`
14. Redirect: `/onboarding`

Login:

1. `/login`
2. `app/login/page.tsx`
3. Form posts to `loginAction()`
4. `app/auth-actions.ts:29`
5. `loginBootstrapUser()`
6. `lib/onboarding/bootstrap.ts:204`
7. `createServiceClient()` resolves profile and organization context.

## Code Fixes Applied

### Service role validation

`lib/supabase/server.ts` now decodes the JWT role claim and only accepts a key with:

```text
role = service_role
```

It no longer accepts any JWT-shaped value as an admin key.

### Legacy fallback removed

`createServiceClient()` no longer falls back to `SUPABASE_SECRET_KEY`.

### Runtime readiness updated

`lib/env.ts` now marks Supabase server env as ready only when `SUPABASE_SERVICE_ROLE_KEY` has a `service_role` claim.

### Diagnostics added

Temporary diagnostics were added to confirm runtime env loading without printing secrets:

```ts
console.log("SUPABASE_SERVICE_ROLE_KEY", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

Additional service-client diagnostics log whether the key is loaded, the decoded role claim, and whether an admin key is usable.

### Error messages clarified

Bootstrap, login profile resolution, and onboarding completion now explicitly require a Supabase `service_role` key.

## Files Modified

- `lib/env.ts`
- `lib/supabase/server.ts`
- `lib/onboarding/bootstrap.ts`
- `.env.example`

## Route Smoke Test

Local dev server verification on port `3011`:

- `/login` returned `200`.
- `/signup` returned `200`.
- `/dashboard` returned `307` for unauthenticated traffic and middleware redirected to `/login`.

## Validation Commands

```text
npm run typecheck
npm run lint
npm run build
```

Results:

- Typecheck: passed.
- Lint: passed.
- Build: passed.

Build diagnostics confirmed the active blocker:

```text
SUPABASE SERVICE ROLE CLAIM anon
SUPABASE ADMIN KEY USABLE false
```

## Remaining Required Action

Replace the current `SUPABASE_SERVICE_ROLE_KEY` value in `.env.local` and production environment variables with the actual Supabase service role key from:

```text
Supabase Dashboard -> Project Settings -> API -> service_role secret
```

After replacing the key:

1. Restart the Next.js dev server or redeploy production.
2. Confirm diagnostics show:

```text
SUPABASE SERVICE ROLE CLAIM service_role
SUPABASE ADMIN KEY USABLE true
```

3. Re-run Platform Admin signup/bootstrap.

## Status

Public auth pages are reachable. The application code now correctly rejects anon keys in the service-role slot. Platform Admin bootstrap cannot complete until the real `service_role` key is supplied.

