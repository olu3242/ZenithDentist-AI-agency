# Redirect Flow

## Traced Redirects

| Source | Condition | Target |
| --- | --- | --- |
| `middleware.ts` | Authenticated user visits a protected path not allowed for their role | `getDefaultPortalForRole(role)` with no query string |
| `lib/security-edge.ts` | Protected route has no valid scaffold token | `/login?from=<pathname>&reason=auth-required` |
| `app/portal-select/page.tsx` | Valid role/token can be resolved server-side | Role-specific default portal |
| `app/internal/page.tsx` | Super Admin opens `/internal` | `/internal/mission-control` |

## Role-Specific Portal Targets

| Role | Target |
| --- | --- |
| Practice Owner | `/portal` |
| Staff | `/dashboard` |
| Agency Admin | `/admin` |
| Super Admin | `/mission-control` |

## Loop Prevention

- `/portal-select` is no longer in the protected middleware matcher.
- Failed auth no longer redirects to `/`.
- Failed auth no longer adds `admin=unauthorized`.
- Authenticated wrong-role access redirects to a role-specific protected route once, not back to the attempted path.
- `/portal-select` only redirects when a valid role/token is present; otherwise it renders a selector page.

## Remaining Intentional Redirect

`/internal` redirects to `/internal/mission-control`. This is safe because `/internal` and `/internal/mission-control` share the same Super Admin authorization scope.
