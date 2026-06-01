# Middleware Audit

## Files Audited

- `middleware.ts`
- `lib/auth-routing.ts`
- `lib/security-edge.ts`
- `lib/server-auth.ts`
- `supabase/migrations/202605210003_phase6_multitenant_saas.sql`
- `lib/database.types.ts`

## Search Results

| Search term | Findings |
| --- | --- |
| `admin=unauthorized` | Removed. No active redirect now emits this query string. |
| `unauthorized` | Only categorization text remains in `lib/runtime/trace-engine.ts`; no landing-page unauthorized redirect remains. |
| `redirect(` | `app/portal-select/page.tsx`, `app/internal/page.tsx`; both traced below. |
| `NextResponse.redirect` | `middleware.ts` role redirect; `lib/security-edge.ts` auth-required redirect. |

## Middleware Lookup Audit

| Lookup | Current implementation | Production assessment |
| --- | --- | --- |
| User lookup | Reads `zenith_user_id` cookie or `x-zenith-user-id` header for debug only | No Supabase Auth user/session lookup yet |
| Profile lookup | Reads `zenith_role` cookie or `x-zenith-role` header for role derivation | No profile table lookup exists in current schema |
| Organization lookup | Reads `zenith_organization_id` cookie or `x-zenith-organization-id` header for debug only | No organization/member lookup in middleware yet |
| Role lookup | Maps explicit role cookie/header, then token scope fallback | Works for scaffold tokens; not a full database-backed auth policy |
| Role routing | Centralized in `lib/auth-routing.ts` | Good scaffold boundary; ready to replace internals with Supabase Auth claims |

## Current Middleware Flow

1. Rate limit request.
2. Skip public paths.
3. Compare request cookies/headers with configured `INTERNAL_ACCESS_TOKEN`, `ADMIN_ACCESS_TOKEN`, and `PORTAL_ACCESS_TOKEN`.
4. Resolve role from `zenith_role`/`x-zenith-role`, falling back to token scope.
5. If role cannot access a protected path, redirect to the role default portal.
6. If no valid token is present, redirect to `/login?from=<pathname>&reason=auth-required`.

## Temporary Debug Logging

`middleware.ts` now emits `[zenith-auth-debug]` with:

- `pathname`
- `userId`
- `profileRole`
- `organizationId`
- `redirectTarget`

These values come from the scaffold cookies/headers until Supabase Auth is wired into middleware.

## Fixed Risk

The previous `failedAuthResponse` sent users to `/?admin=unauthorized`. That behavior is removed. Auth failures now go to `/login`, and authenticated users with a resolved role are routed to their valid portal instead of the public homepage.
