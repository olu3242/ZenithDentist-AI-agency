# Bootstrap Fix Report

Generated: 2026-06-01

## Fixes Implemented

### 1. Strict Supabase admin-key validation

File: `lib/supabase/server.ts`

`createServiceClient()` now requires the configured `SUPABASE_SERVICE_ROLE_KEY` to decode to:

```text
role = service_role
```

JWT-shaped anon keys are no longer treated as usable admin credentials.

### 2. Removed legacy secret fallback

File: `lib/supabase/server.ts`

Removed fallback from `SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SECRET_KEY`.

### 3. Runtime readiness aligned

File: `lib/env.ts`

`hasSupabaseServerEnv` now reports ready only when:

```text
NEXT_PUBLIC_SUPABASE_URL is present
SUPABASE_SERVICE_ROLE_KEY role claim is service_role
```

### 4. Diagnostics added

Files:

- `lib/env.ts`
- `lib/supabase/server.ts`
- `lib/autonomous.ts`

Diagnostics added:

```text
SUPABASE URL
SUPABASE ANON
SUPABASE SERVICE ROLE
SUPABASE_SERVICE_ROLE_KEY
SUPABASE SERVICE ROLE CLAIM
SUPABASE ADMIN KEY USABLE
JSON PARSE INPUT
```

No raw secret token values are printed.

### 5. Bootstrap messaging clarified

File: `lib/onboarding/bootstrap.ts`

Bootstrap/login/onboarding now report that a Supabase `service_role` key is required.

### 6. Environment template cleaned

File: `.env.example`

Removed `SUPABASE_SECRET_KEY` from the example template to prevent future drift.

## Validation

Commands:

```text
npm run typecheck
npm run lint
npm run build
```

Results:

- Typecheck: PASS
- Lint: PASS
- Build: PASS

Local route smoke:

- `/login`: PASS, `200`
- `/signup`: PASS, `200`
- `/dashboard`: PASS, `307` unauthenticated redirect to `/login`

## Remaining Blocker

The repository cannot synthesize the real Supabase service role key. The current configured key is an anon key.

Required action:

1. Replace `SUPABASE_SERVICE_ROLE_KEY` with the real Supabase service role key.
2. Restart local dev server or redeploy Vercel.
3. Confirm:

```text
SUPABASE SERVICE ROLE CLAIM service_role
SUPABASE ADMIN KEY USABLE true
```

## GO / NO-GO

NO-GO for account bootstrap until the actual service role key is supplied.

