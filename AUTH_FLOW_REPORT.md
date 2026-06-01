# Auth Flow Report

## Signup

`/signup` creates Supabase auth user, profile, organization, organization membership, onboarding run, session scaffold cookies, then redirects to `/onboarding`.

## Login

`/login` now verifies email/password with Supabase Auth before resolving the Zenith profile and role cookies.

## Forgot Password

`/forgot-password` calls Supabase password reset when public auth env is configured and shows success/error feedback.

## Middleware

Public auth routes remain open. Protected routes redirect unauthenticated users to `/login`, never to `/?admin=unauthorized`.

## Session Awareness

Middleware reads role, user id, organization id, and access token cookies to authorize portal access.
