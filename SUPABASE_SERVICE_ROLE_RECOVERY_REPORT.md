# Supabase Service Role Recovery Report

Generated: 2026-06-01

## Current Status

The application now validates Supabase service credentials before creating admin/profile clients. This prevents anon keys from being used for privileged bootstrap, profile resolution, lead persistence, and platform admin creation.

## Credential Diagnostics

Observed during `npm run build`:

| Variable | Loaded | Runtime Finding |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase URL is present. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Public password login client cannot initialize. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | JWT-like key is present, but decoded role is `anon`. |
| `SUPABASE_SECRET_KEY` | No | Legacy fallback is not active. |
| `ADMIN_ACCESS_TOKEN` | Yes | Admin route token is present. |

Safe decoded claims observed:

- Role: `anon`
- Project ref: `yjbxhlfiwqhhuvgpcrey`
- Validation result: `invalid_role`
- Key prefix: `eyJhbGci`

## Exact Login Failure Location

- File: `lib/onboarding/bootstrap.ts`
- Function: `loginBootstrapUser()`
- Line: `205`
- Guard: `const supabase = createServiceClient();`
- Failure message line: `207`

`createServiceClient()` returns `null` because `SUPABASE_SERVICE_ROLE_KEY` does not decode to `role = service_role`.

## Service Client Validation

- File: `lib/supabase/server.ts`
- Function: `createServiceClient()`
- Lines: `38-63`

Validation condition:

```ts
getSupabaseJwtDiagnostics(env.SUPABASE_SERVICE_ROLE_KEY)?.role === "service_role"
```

Current result:

```text
role = anon
validation = invalid_role
admin key usable = false
```

## Root Cause

The value installed in `SUPABASE_SERVICE_ROLE_KEY` is an anon JWT, not a Supabase service-role JWT. In addition, `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, so password login cannot initialize after the service-role issue is fixed.

## Required Manual Fix

Update `.env.local` and Vercel environment variables:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service_role secret key>
```

The service role JWT must decode to:

```json
{ "role": "service_role", "ref": "yjbxhlfiwqhhuvgpcrey" }
```

## Validation

Commands run:

- `npm run typecheck` - passed
- `npm run lint` - passed
- `npm run build` - passed after clearing stale `.next`

## Status

Code path is fixed and guarded. Runtime login/profile resolution remains blocked until the correct Supabase keys are installed.
