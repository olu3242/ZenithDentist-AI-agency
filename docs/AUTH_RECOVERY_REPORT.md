# AUTH RECOVERY REPORT

Generated: 2026-06-01

Product: Zenith PROS - Patient Revenue Operating System

## Executive Decision

AUTH RECOVERY IMPLEMENTED.

No user should remain stuck between Signup, Login, and Onboarding due to partial `auth.users`, `profiles`, `organizations`, `organization_members`, or `tenant_onboarding_runs` records when the application has Supabase service-role access.

## Root Cause

The prior signup bootstrap flow checked `profiles.email` before creating the Supabase auth user. If `auth.users` already contained the email but `profiles` was missing, Supabase returned:

`A user with this email address has already been registered`

That error was sent back to `/signup` without repairing missing application records or giving the user a login/reset path.

## Entity Validation Model

| Entity | Recovery Behavior |
| --- | --- |
| `auth.users` | Signup now searches Supabase admin users by email before creating a new auth user. Duplicate create errors trigger a second lookup. |
| `profiles` | Missing profile is created from the auth user/signup payload and linked to the recovered organization. |
| `organizations` | Missing/default organization is created when the profile has no usable organization reference. |
| `organization_members` | Missing membership is inserted; existing membership is refreshed with the recovered platform role. |
| `tenant_onboarding_runs` | Incomplete onboarding records a recovery run and routes authenticated users to `/onboarding`. |

Note: the requested `onboarding_states` concept maps to the current canonical table `tenant_onboarding_runs`.

## Implemented Recovery Paths

| Scenario | Outcome |
| --- | --- |
| Existing email, correct password entered on signup | Account records are self-healed, bootstrap cookies are set, and the user resumes `/onboarding` or the correct portal. |
| Existing email, wrong/unknown password entered on signup | Records are self-healed without creating a session, then the user is redirected to `/login?reason=existing-email`. |
| Existing email with missing profile | Profile is created during signup recovery or login recovery. |
| Existing email with missing organization | Recovery organization is created and assigned to profile. |
| Existing email with missing membership | Membership is created or refreshed. |
| Existing email with incomplete onboarding | Authenticated recovery redirects to `/onboarding`. |
| Existing email with completed onboarding | Authenticated recovery redirects to the default portal for the resolved role. |

## User-Facing Changes

- `/login` now recognizes `reason=existing-email`.
- Existing-email users see clear guidance to log in or reset access.
- `/login` pre-fills the email when passed from signup recovery.
- `/forgot-password` accepts an `email` query parameter and pre-fills reset form.

## Files Changed

| File | Change |
| --- | --- |
| `lib/onboarding/bootstrap.ts` | Added auth-user lookup, duplicate-email recovery, profile/org/member/onboarding self-heal, login recovery audit logging. |
| `app/login/page.tsx` | Added existing-email guidance, reset CTA, email prefill. |
| `app/forgot-password/page.tsx` | Added email prefill support. |

## Security Posture

Signup recovery only creates a user session when the supplied password successfully authenticates the existing Supabase user.

If password verification fails, the application may self-heal server-side application records but does not set bootstrap cookies and does not route the user into onboarding. The user must log in or use password reset.

## Verification

Commands run:

- `npm run typecheck` - PASS
- `npm run build` - PASS

Live table-level row inspection was not performed in this sprint because the task was implemented against the local codebase. The code paths require valid Supabase service-role access at runtime.

## Final Outcome

The duplicate email condition no longer ends as an unrecoverable signup error. Existing users are routed into Login/Password Reset, while authenticated existing users with partial records are repaired and resumed into onboarding or the correct portal.
