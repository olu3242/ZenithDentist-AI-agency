# Auth Lockout Root Cause Report

Generated: 2026-06-01

## Route Access Summary

Local dev smoke test:

| Route | Exists | Middleware Matched | Outcome | Notes |
| --- | --- | --- | --- | --- |
| `/` | Yes | No | Build verified | Public route. |
| `/login` | Yes | No | `200` | Public login page renders. |
| `/signup` | Yes | No | `200` | Public signup page renders. |
| `/forgot-password` | Yes | No | Not smoke-probed in this pass | Public by matcher. |
| `/dashboard` | Yes | Yes | `307` to `/login` | Expected for unauthenticated request. |
| `/portal` | Yes | Yes | Protected | Requires portal/internal/admin token and role. |
| `/mission-control` | Yes | Yes | Protected | Requires internal/super-admin access. |

## Middleware Findings

File: `middleware.ts`

Public routes are not in the matcher:

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/auth/*`

Protected routes are in the matcher:

- `/dashboard`
- `/portal`
- `/admin`
- `/mission-control`
- `/workflow-os`
- `/runtime-os`
- `/settings`
- `/onboarding`

Unauthenticated protected routes call `failedAuthResponse()`.

File: `lib/security-edge.ts`

`failedAuthResponse()` redirects to:

```text
/login?from=<path>&reason=auth-required
```

No local application redirect to `/?admin=unauthorized` was found in the active auth middleware path.

## Bootstrap Lockout Cause

The app is not locked out because `/login` or `/signup` are protected. They render locally.

The bootstrap lockout occurs after submitting signup/login when code needs the Supabase admin/service client:

- `signupAction()` -> `bootstrapUser()`
- `loginAction()` -> `loginBootstrapUser()`
- both call `createServiceClient()`
- `createServiceClient()` rejects the current configured key because the JWT role claim is `anon`

## First Confirmed Broken Link

```text
User -> Signup -> bootstrapUser() -> createServiceClient() -> SUPABASE_SERVICE_ROLE_KEY role claim is anon -> service client unavailable
```

## Status

Authentication pages are reachable locally. Account bootstrap is blocked by an invalid service-role credential, not by middleware protection on public routes.

