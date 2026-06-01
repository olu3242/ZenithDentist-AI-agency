# Authorization Fix Report

## Completed Fixes

- Removed the `/?admin=unauthorized` redirect path.
- Replaced failed protected-route auth redirects with `/portal-select`.
- Made `/portal-select` public to avoid self-redirect loops.
- Updated `/portal-select` so authenticated users redirect to their role-specific portal and unauthenticated users see valid portal options.
- Added scaffold debug logging in `middleware.ts` for pathname, user id, profile role, organization id, and redirect target.
- Added database role to application role mapping in `lib/auth-routing.ts`.
- Kept authenticated wrong-role users inside valid portals:
  - Practice Owner -> `/portal`
  - Staff -> `/dashboard`
  - Agency Admin -> `/admin`
  - Super Admin -> `/mission-control`

## Verification Matrix

| Scenario | Expected result | Status |
| --- | --- | --- |
| Practice Owner token/role accesses `/portal-select` | Redirects to `/portal` | Implemented |
| Staff token/role accesses `/portal-select` | Redirects to `/dashboard` | Implemented |
| Agency Admin token/role accesses `/portal-select` | Redirects to `/admin` | Implemented |
| Super Admin token/role accesses `/portal-select` | Redirects to `/mission-control` | Implemented |
| Authenticated Practice Owner accesses `/admin` | Redirects to `/portal` | Implemented |
| Authenticated Staff accesses `/portal` | Redirects to `/dashboard` except onboarding | Implemented |
| Authenticated Agency Admin accesses `/mission-control` | Redirects to `/admin` | Implemented |
| No valid token accesses protected route | Redirects to `/portal-select` | Implemented |

## Local Redirect Verification

Verified against the local dev server with configured env tokens and role headers:

| Role | Probe | Observed |
| --- | --- | --- |
| Practice Owner | `/admin` | `307 Location: /portal` |
| Staff | `/portal` | `307 Location: /dashboard` |
| Agency Admin | `/mission-control` | `307 Location: /admin` |
| Super Admin | `/mission-control` | `200 OK` |

## Validation Commands

The implementation was validated with:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Production Recommendation

This pass eliminates the redirect loops in the current token-based scaffold. The next production step is to replace scaffold token inference with Supabase Auth session validation and membership lookup against `organization_members`.
