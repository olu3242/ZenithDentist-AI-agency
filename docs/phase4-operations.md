# Phase 4 Operations Runbook

## Production Stack

- Next.js 14 App Router with TypeScript
- Supabase Postgres with service-role server access
- Client portal AI operations layer with realtime-ready dashboards
- Zod validation and React Hook Form
- Resend transactional email
- Calendly booking handoff and webhook endpoint
- Google Analytics, Meta Pixel, and LinkedIn event hooks
- TailwindCSS with shadcn-style primitives

## Environment

Copy `.env.example` to `.env.local` and configure every production secret in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_LINKEDIN_PARTNER_ID`
- `CALENDLY_URL`
- `ADMIN_ACCESS_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

## Supabase

Apply `supabase/migrations/202605210001_phase4_production_schema.sql`.

The schema creates:

- `leads`
- `roi_calculations`
- `audits`
- `bookings`
- `outreach_events`
- `faq_interactions`
- `automation_events`
- `operational_metrics`
- `insight_snapshots`
- `recommendations`
- `reports`
- `notifications`

RLS is enabled on all tables. Current policies only allow service-role access, which is correct for the server-action architecture. Before multi-user admin access, add Supabase Auth role claims and tenant-aware policies.

## Deployment

1. Push to GitHub.
2. Import the repository in Vercel.
3. Set production environment variables.
4. Run the Supabase migration.
5. Deploy.
6. Configure Calendly webhook to `https://YOUR_DOMAIN/api/calendly/webhook`.

## Validation

Run before deployment:

```bash
npm run lint
npm run typecheck
npm run build
npm run smoke
```

## Security Notes

Admin protection is currently scaffolded with `ADMIN_ACCESS_TOKEN` via middleware. This is intentionally minimal for Phase 4 and should be replaced with Supabase Auth, role claims, and audit logging before broader team access.

Portal protection is scaffolded with `PORTAL_ACCESS_TOKEN`. Before real client rollout, replace this with Supabase Auth, practice membership checks, role claims for practice managers/staff/executives, and tenant-aware RLS policies.

`npm audit --omit=dev` reports active advisories for Next.js 14 even at `14.2.35`. The requested stack was Next.js 14; npm recommends a breaking upgrade path to Next.js 16 for full advisory remediation. Treat that as the next security decision before production traffic.
