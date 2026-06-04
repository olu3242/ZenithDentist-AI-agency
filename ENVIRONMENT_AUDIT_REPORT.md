# Zenith Environment Audit Report

Date: June 2, 2026

## Summary

The local environment is populated, but the linked Vercel project has no configured environment variables. This prevents staging from behaving like production.

No secret values are recorded in this report.

## Vercel

Command: `vercel env ls`

Result: No Environment Variables found for `eduradiusllc/zenith-dentist-automation`.

Required before staging certification:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase service role/server key variable expected by the app
- Google OAuth client ID and client secret
- Email provider configuration
- Calendly/strategy session URL
- Any workflow, telemetry, PMS, and AI provider credentials used by production routes

Observed impact:

- Vercel build logs reported Supabase client/service variables unavailable.
- Deployed HTML uses `http://localhost:3000` metadata.
- Backend routes cannot persist organizations, onboarding, assessments, LIZ events, ALICE traces, reports, or workflow telemetry.

## Supabase

Local Supabase migration files are present and pass manifest validation.

Remote status: NOT VERIFIED

The linked database rejected the provided database password for remote migration listing. Until this is corrected, migration drift and schema cache state cannot be certified.

Required before cutover:

1. Repair Supabase CLI database authentication.
2. Run `supabase migration list`.
3. Apply pending staging migrations.
4. Run remote database lint.
5. Refresh generated types.

## OAuth

Local code includes authentication routes and Google sign-in UI. Vercel OAuth variables were not present in the linked project, so Google OAuth is not certified in staging.

Required before cutover:

- Configure Google OAuth credentials in Vercel.
- Configure allowed redirect URLs in Google Cloud and Supabase Auth.
- Validate auth callback and dashboard redirect on the staging URL.

## DNS

The generated Vercel preview URL is reachable through protected Vercel access. Custom staging or production DNS was not certified in this sprint.

Required before cutover:

- Assign intended staging domain.
- Configure production domain.
- Validate HTTPS, canonical URL, redirects, and OAuth callback URLs.

## Storage And Functions

Storage buckets and Supabase Edge Functions were not certified remotely because Supabase remote access is blocked.

## Environment Decision

Status: NO-GO for production cutover.

The Vercel project needs environment variables before backend-connected staging validation can pass.
