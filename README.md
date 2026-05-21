# Zenith Dentist Automation

Production Next.js scaffold plus archived static HTML artifacts for the Zenith AI dental practice automation concept.

## Files

- `app/` - Next.js 14 App Router public funnel, admin CRM, API routes, SEO, error boundaries, and deployment pages.
- `components/` - reusable public, admin, provider, and UI components.
- `lib/` - Supabase clients, typed database models, validation, ROI engine, analytics, logging, and email services.
- `supabase/migrations/` - production Postgres schema for leads, ROI calculations, audits, bookings, outreach events, and FAQ interactions.
- `index.html` - archived functional local MVP from the prior phase.
- `app.css` - application styling.
- `app.js` - local data model and client-side workflows.
- `zenith-ai-landing.html` - landing page for the Patient Revenue Engine offer.
- `zenith-ai-dashboard.html` - practice dashboard and pipeline interface mockup.
- `zenith-ai-prd.html` - product requirements document for the platform.

## Production Setup

1. Copy `.env.example` to `.env.local`.
2. Fill Supabase, Resend, Calendly, analytics, and admin token values.
3. Apply the Supabase migration in `supabase/migrations/202605210001_phase4_production_schema.sql`.
4. Run `npm install`, then `npm run dev`.

The production app uses Supabase persistence instead of browser storage. Admin routes are scaffold-protected by `ADMIN_ACCESS_TOKEN` and should be replaced with Supabase Auth role claims before broader team access.
