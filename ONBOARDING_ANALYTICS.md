# Onboarding Analytics

## Tracked Server Events

- `onboarding_step_recorded`
- `onboarding_run_write_failed`
- `onboarding_login_failed`
- `onboarding_portal_handoff`
- `password_reset_request_failed`
- `password_reset_skipped_missing_auth_env`

## Captured Context

- user id
- organization id
- role
- onboarding status
- current step
- progress
- redirect target
- failure reason

## Drop-Off Points

- Auth creation failure
- Profile write failure
- Organization write failure
- Membership write failure
- Onboarding completion write failure
- Portal handoff redirect failure
