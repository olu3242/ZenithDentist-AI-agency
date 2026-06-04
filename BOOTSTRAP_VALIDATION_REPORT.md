# Bootstrap Validation Report

Generated: 2026-06-01

## Bootstrap Recovery Status

Status: `BLOCKED`

The current `SUPABASE_SERVICE_ROLE_KEY` is present and JWT-like, but it decodes to:

```json
{
  "role": "anon"
}
```

Required:

```json
{
  "role": "service_role"
}
```

## Credential Verification

| Check | Result |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` exists | PASS |
| Runtime can read key | PASS |
| JWT format valid | PASS |
| Project ref matches Supabase URL | PASS |
| Role claim is `service_role` | FAIL |
| Admin key usable | FAIL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists | FAIL |

## Bootstrap Test Matrix

| Flow | Status | Evidence |
| --- | --- | --- |
| Signup page loads | PASS | Prior local smoke returned `200`. |
| Login page loads | PASS | Prior local smoke returned `200`. |
| Platform Admin creation | BLOCKED | Requires Supabase `service_role` key. |
| User created | BLOCKED | `auth.admin.createUser()` cannot be safely run with anon key. |
| Profile created | BLOCKED | Depends on successful admin bootstrap. |
| Organization created | BLOCKED | Depends on successful admin bootstrap. |
| Membership created | BLOCKED | Depends on successful admin bootstrap. |

## Tables Required

- `profiles`
- `organizations`
- `organization_members`
- `tenant_onboarding_runs`

## Exact Broken Link

```text
signupAction()
-> bootstrapUser()
-> createServiceClient()
-> SUPABASE_SERVICE_ROLE_KEY role claim is anon
-> service client unavailable
```

## Required Action

Restore `NEXT_PUBLIC_SUPABASE_ANON_KEY`, replace `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel with the actual Supabase service role key, then restart `npm run dev`.

Expected diagnostics:

```text
SUPABASE SERVICE ROLE CLAIM service_role
SUPABASE ADMIN KEY USABLE true
SUPABASE ANON true
```
