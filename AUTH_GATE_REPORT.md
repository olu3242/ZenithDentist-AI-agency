# Auth Gate Report

## Public Routes

Middleware does not protect:

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/auth/callback`
- `/auth/verify`
- `/auth/reset-password`
- `/portal-select`

`/portal-select` remains public so it cannot redirect-loop. It only redirects when a valid role/token can be resolved; otherwise it renders portal options.

## Protected Routes

Protected route prefixes remain centralized in `lib/auth-routing.ts`:

- `/admin`
- `/portal`
- `/internal`
- `/dashboard`
- `/mission-control`
- `/workflow-os`
- `/runtime-os`
- `/settings`
- `/lead-operations`
- `/client-operations`
- `/gtm-command-center`

## Unauthenticated Redirects

Unauthenticated or invalid-token users are redirected only to:

- `/login?from=<path>&reason=auth-required`

No executable code redirects unauthenticated users to:

- `/`
- `/?admin=unauthorized`

## Authenticated Routing

After a valid scaffold token or role cookie exists:

| Role | Route |
| --- | --- |
| `super_admin` | `/mission-control` |
| `agency_admin` | `/admin` |
| `practice_owner` | `/portal` |
| `staff` | `/dashboard` |

## Search Verification

`admin=unauthorized` remains only in audit/report documentation describing the removed behavior. It is not emitted by middleware or security helpers.
