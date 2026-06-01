# Login Profile Resolution Root Cause

Generated: 2026-06-01

## Executive Summary

Login profile resolution fails because the server-side profile resolver cannot create a Supabase service client.

Current active causes:

1. `SUPABASE_SERVICE_ROLE_KEY` is present but decodes to `role=anon`, not `role=service_role`.
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing from `.env.local`, so password login cannot initialize browser/server public auth either.

This is not a service-role validation bug. The validation is checking the intended variable and correctly rejecting an anon key in the service-role slot.

## Exact File And Line Throwing The Message

Current code path:

- File: `lib/onboarding/bootstrap.ts`
- Function: `loginBootstrapUser()`
- Line: `205`: `const supabase = createServiceClient();`
- Line: `206`: `if (!supabase) {`
- Line: `207`: returns:

```text
A Supabase service_role key is required before login can resolve a profile.
```

The older reported text:

```text
Supabase service credentials are required before login can resolve a profile.
```

is the prior version of the same guard.

## Exact Validation Condition

Service client creation:

- File: `lib/supabase/server.ts`
- Function: `getSupabaseServiceKey()`
- Line: `34`

```ts
if (getSupabaseJwtDiagnostics(env.SUPABASE_SERVICE_ROLE_KEY)?.role === "service_role") {
  return env.SUPABASE_SERVICE_ROLE_KEY;
}
```

Failure condition:

- File: `lib/supabase/server.ts`
- Function: `createServiceClient()`
- Line: `51`

```ts
if (!env.NEXT_PUBLIC_SUPABASE_URL || !serverKey) {
  return null;
}
```

`serverKey` is `undefined` because the decoded JWT role is `anon`.

## Current Decoded JWT Claims

Safe claim-only audit from `.env.local`:

```text
SUPABASE_SERVICE_ROLE_KEY source = .env.local
KEY PREFIX = eyJhbGci
ROLE = anon
PROJECT REF = yjbxhlfiwqhhuvgpcrey
ISSUER = supabase
VALIDATION RESULT = invalid_role
```

The key is JWT-like and points at the same project as `NEXT_PUBLIC_SUPABASE_URL`, but it is the anon key.

## Current Env Variable Source

Source file:

```text
.env.local
```

Current env state:

| Variable | Source | Present | Result |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | YES | Project ref `yjbxhlfiwqhhuvgpcrey` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | NO | Missing |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | YES | JWT role is `anon`, not `service_role` |

## Login Trace

```text
/login
-> app/login/page.tsx
-> form action loginAction()
-> app/auth-actions.ts:29
-> loginBootstrapUser(email, password)
-> lib/onboarding/bootstrap.ts:204
-> createServiceClient()
-> lib/supabase/server.ts:38
-> getSupabaseServiceKey()
-> lib/supabase/server.ts:33
-> SUPABASE_SERVICE_ROLE_KEY role claim is anon
-> serverKey undefined
-> createServiceClient() returns null
-> loginBootstrapUser() returns service_role required error
```

## Session To Profile Resolver

The current implementation asks for the service client before it attempts password auth:

```text
loginBootstrapUser()
-> createServiceClient()
-> createServerAuthClient()
-> signInWithPassword()
-> profiles query
```

Because `createServiceClient()` fails first, login does not reach session creation or profile lookup.

## Admin Client / Service Role Validation

The admin/service client is created in:

- File: `lib/supabase/server.ts`
- Function: `createServiceClient()`

New diagnostics added:

```text
SUPABASE ROLE
SUPABASE PROJECT REF
SUPABASE KEY PREFIX
SUPABASE VALIDATION RESULT
```

No full secret value is logged.

## Determination

### A. Wrong key still installed

`TRUE`

`SUPABASE_SERVICE_ROLE_KEY` contains an anon JWT.

### B. Correct key installed but validation failing

`FALSE`

Validation is correct. It rejects the key because the decoded role is `anon`.

### C. Different env variable being checked

`FALSE`

The service resolver checks `env.SUPABASE_SERVICE_ROLE_KEY`, sourced from `process.env.SUPABASE_SERVICE_ROLE_KEY`.

However, a second env issue exists: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, so password auth would fail immediately after the service-client guard is fixed unless the anon key is restored.

### D. Profile resolver incorrectly requires admin privileges

`PARTIAL`

The current profile resolver uses the service client to query `profiles`.

This matches the current database policy state because `profiles` has RLS enabled with only:

```sql
create policy "service_role_all_profiles"
  on public.profiles for all
  using (auth.role() = 'service_role');
```

So with the current schema, profile resolution does require service-role access. If the desired design is for signed-in users to read their own profiles without service-role access, add authenticated-user RLS policies and refactor login to query profile using the authenticated session.

## Required Fix

1. Restore `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
2. Replace `SUPABASE_SERVICE_ROLE_KEY` with the actual Supabase `service_role` key from the same project.
3. Restart the Next.js dev server.
4. Confirm diagnostics:

```text
SUPABASE ROLE service_role
SUPABASE PROJECT REF yjbxhlfiwqhhuvgpcrey
SUPABASE VALIDATION RESULT valid_service_role
SUPABASE ADMIN KEY USABLE true
SUPABASE ANON true
```

## Success Criteria Status

| Criterion | Status | Evidence |
| --- | --- | --- |
| Login resolves profile successfully | BLOCKED | Missing anon key and invalid service-role key. |
| No service-role validation errors | BLOCKED | Current role claim is `anon`. |
| Dashboard reachable after authentication | BLOCKED | Login cannot complete profile resolution. |

