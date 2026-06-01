# Onboarding Flow Map

## Implemented Path

Landing `/`
→ Signup `/signup`
→ Auth user creation via Supabase Admin
→ Profile upsert in `profiles`
→ Organization creation in `organizations`
→ Membership creation in `organization_members`
→ Onboarding run insert in `tenant_onboarding_runs`
→ Setup workspace `/onboarding`
→ Completion writes profile/org onboarding state
→ Role portal handoff

## Role Handoff

| Role | Portal |
| --- | --- |
| `platform_owner` alias | `/mission-control` |
| `super_admin` | `/mission-control` |
| `agency_admin` | `/admin` |
| `practice_owner` | `/portal` |
| `staff` | `/dashboard` |

## Public Auth Routes

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/auth/callback`
- `/auth/verify`
- `/auth/reset-password`

## Protected Setup Route

- `/onboarding` is now a protected setup handoff route. It redirects unauthenticated visitors to `/login?reason=auth-required&from=/onboarding`.
