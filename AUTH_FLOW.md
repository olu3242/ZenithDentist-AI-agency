# Authentication And Role Routing Audit

## Current Auth Model

The application currently uses scaffolded token-based protection in `middleware.ts`, not a full Supabase Auth login flow.

Supported credentials:

- `zenith_portal_token` cookie or `x-portal-token` header.
- `zenith_admin_token` cookie or `x-admin-token` header.
- `zenith_internal_token` cookie or `x-internal-token` header.
- Optional `zenith_role` cookie or `x-zenith-role` header for explicit role selection.

If no access token environment variables are configured, protected routes continue to pass through for local/demo development.

## Role Mapping

Role normalization lives in `lib/auth-routing.ts`.

| Input aliases | Normalized role | Default route |
| --- | --- | --- |
| `owner`, `practice_owner`, `practice_manager`, `executive_readonly` | `practice_owner` | `/portal` |
| `staff`, `front_desk`, `analyst` | `staff` | `/dashboard` |
| `admin`, `agency_admin` | `agency_admin` | `/admin` |
| `super_admin`, `internal` | `super_admin` | `/mission-control` |

## Redirect Rules

- `/portal-select` redirects to the default route for the active role.
- Authenticated users attempting to access a route outside their role are redirected to their default portal.
- Unauthenticated or invalid-token users are redirected to `/login?from=<blocked-path>&reason=auth-required` by `failedAuthResponse`.

## Access Rules

| Role | Allowed protected surfaces |
| --- | --- |
| Practice Owner | `/portal/*`, `/settings` |
| Staff | `/dashboard`, `/portal/onboarding`, `/settings` |
| Agency Admin | `/admin/*`, `/dashboard`, `/lead-operations`, `/client-operations`, `/gtm-command-center`, `/settings` |
| Super Admin | All protected routes |

## Onboarding Flow

- Practice onboarding lives at `/portal/onboarding`.
- Staff can access `/portal/onboarding` for launch support.
- Practice Owners default to `/portal`, with onboarding visible in sidebar navigation.
- Organization onboarding status is read from tenant data and displayed by `OnboardingProgress`.

## Recommended Future Hardening

- Replace scaffold tokens with Supabase Auth session validation.
- Store role claims in `user_roles` and resolve them server-side.
- Add explicit sign-in/sign-out route handlers once the production auth provider is enabled.
