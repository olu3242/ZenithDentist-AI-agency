# Onboarding Audit

## Findings Before Fix

- `/login` was missing.
- `/signup` was missing.
- `/forgot-password` was missing.
- `/auth/*` routes were missing.
- `profiles` table was missing.
- Middleware did not protect those public auth routes, but only because they did not exist.
- Onboarding existed at `/portal/onboarding`, but there was no public first-user path to create the records needed to reach it.

## Implemented Onboarding Path

| Step | Status |
| --- | --- |
| Create account | Implemented through `/signup` and `bootstrapUser` |
| Verify email | Scaffolded through `/auth/verify` and `/auth/callback`; server bootstrap marks `email_verified_at` |
| Create profile | Implemented in `profiles` |
| Create organization | Implemented in `organizations` |
| Create organization membership | Implemented in `organization_members` |
| Access onboarding | Existing `/portal/onboarding` remains reachable for Practice Owner, Staff support, and Super Admin |

## Created Records

| Table | Created by bootstrap? | Notes |
| --- | --- | --- |
| `profiles` | Yes | New migration and typed table definition added |
| `organizations` | Yes | First org receives `settings.default_organization = true` |
| `organization_members` | Yes | Uses existing `organization_role` values |

## Existing Database Role Constraint

The database `organization_role` enum does not include `super_admin`, `agency_admin`, `practice_owner`, or `staff`. Those are app-level roles stored in `profiles.role`. Membership rows are translated to existing tenant roles:

| App role | Membership role |
| --- | --- |
| `super_admin` | `admin` |
| `agency_admin` | `admin` |
| `practice_owner` | `owner` |
| `staff` | `front_desk` |

## Production Gap

The pages are wired for production-facing flow, but the login action is still a scaffold resolver over `profiles` rather than a complete Supabase session exchange. The next hardening step is to use Supabase Auth session cookies in middleware and resolve `profiles`/`organization_members` from that session.
