# Bootstrap Root Cause Report

Generated: 2026-06-01

## Final Answer

The first confirmed local bootstrap root cause is:

- File: `.env.local`
- Line: `SUPABASE_SERVICE_ROLE_KEY=...`
- Function impacted: `createServiceClient()`
- Rejecting code path: `lib/supabase/server.ts`
- Reason: The configured value decodes to Supabase JWT role claim `anon`, not `service_role`.

## Call Stack

```text
/signup
-> app/signup/page.tsx
-> app/auth-actions.ts signupAction()
-> lib/onboarding/bootstrap.ts bootstrapUser()
-> lib/supabase/server.ts createServiceClient()
-> getSupabaseServiceKey()
-> decoded JWT role claim is anon
-> service client unavailable
-> bootstrap returns service_role key required error
```

Login/profile resolution path:

```text
/login
-> app/login/page.tsx
-> app/auth-actions.ts loginAction()
-> lib/onboarding/bootstrap.ts loginBootstrapUser()
-> lib/supabase/server.ts createServiceClient()
-> decoded JWT role claim is anon
-> profile resolution cannot run
```

## Evidence

Decoded key audit:

```text
SERVICE_ROLE_KEY_PRESENT=True
SERVICE_ROLE_KEY_JWT_LIKE=True
SERVICE_ROLE_KEY_PROJECT_REF=yjbxhlfiwqhhuvgpcrey
SERVICE_ROLE_KEY_ROLE_CLAIM=anon
SUPABASE_URL_PROJECT_REF=yjbxhlfiwqhhuvgpcrey
```

Runtime diagnostics:

```text
SUPABASE SERVICE ROLE LOADED true
SUPABASE SERVICE ROLE CLAIM anon
SUPABASE ADMIN KEY USABLE false
```

Build diagnostics:

```text
SUPABASE SERVICE ROLE CLAIM anon
SUPABASE ADMIN KEY USABLE false
```

## What Was Not Reproduced Locally

- `ChunkLoadError` for `app/layout`
- `Unexpected end of JSON input`
- Public route lockout for `/login` or `/signup`

Local route smoke:

- `/login`: `200`
- `/signup`: `200`
- `/dashboard`: `307` unauthenticated redirect to `/login`

## Fix Applied In Code

The app now rejects incorrect admin credentials explicitly:

- `lib/supabase/server.ts` decodes the Supabase JWT role claim.
- `createServiceClient()` only accepts `role = service_role`.
- The legacy `SUPABASE_SECRET_KEY` fallback was removed from service-client selection.
- `lib/env.ts` only marks server Supabase env ready when `SUPABASE_SERVICE_ROLE_KEY` has `role = service_role`.
- Bootstrap error messages now name the required key type.
- Temporary diagnostics were added for Supabase env presence and JSON parse inputs.

## Required Secret Fix

Replace `.env.local` and Vercel production `SUPABASE_SERVICE_ROLE_KEY` with the actual Supabase service role key:

```text
Supabase Dashboard -> Project Settings -> API -> service_role secret
```

Expected diagnostics after replacement:

```text
SUPABASE SERVICE ROLE CLAIM service_role
SUPABASE ADMIN KEY USABLE true
```

## Status

The code path is fixed to fail closed and report the real cause. Bootstrap cannot fully succeed until the correct Supabase service role key is supplied.

