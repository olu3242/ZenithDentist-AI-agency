# Database Onboarding Audit

## Required Writes

| Table | Status | Writer |
| --- | --- | --- |
| `profiles` | Implemented | `bootstrapUser`, `completeOnboarding` |
| `organizations` | Implemented | `ensureOrganization`, `completeOnboarding` |
| `organization_members` | Implemented | `bootstrapUser` |
| `tenant_onboarding_runs` | Implemented | `ensureOnboardingRun` |

## Behavior

- First user becomes `super_admin` when no platform admin exists.
- First organization is marked as default in `organizations.settings`.
- Signup records onboarding run with `status = in_progress`.
- Completion records onboarding run with `status = completed`.
- Completion updates `profiles.onboarding_completed_at` and `organizations.onboarding_status = live`.

## RLS

All required tables have service-role policies in migrations, so server-side service actions can perform bootstrap writes.
