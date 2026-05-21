# Phase 4 Operations Runbook

## Production Stack

- Next.js 14 App Router with TypeScript
- Supabase Postgres with service-role server access
- Client portal AI operations layer with realtime-ready dashboards
- Zod validation and React Hook Form
- Resend transactional email
- Calendly booking handoff and event receiver endpoint
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
6. Configure Calendly event delivery to `https://YOUR_DOMAIN/api/calendly/events`.

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

Internal platform routes are scaffolded with `INTERNAL_ACCESS_TOKEN` and are intended for Zenith operators only.

Phase 6 adds multi-tenant tables for organizations, memberships, locations, subscription plans, usage metrics, and benchmark snapshots. Existing operational tables now include organization scope so RLS policies can evolve from service-role-only access to tenant-aware membership checks.

## Phase 6 SaaS Evolution

New protected surfaces:

- `/portal/locations`
- `/portal/onboarding`
- `/internal/organizations`
- `/internal/health`
- `/internal/benchmarks`
- `/internal/revenue`
- `/internal/platform-metrics`
- `/portal/alice`
- `/portal/command`
- `/portal/simulations`
- `/internal/platform`
- `/internal/ai`
- `/internal/playbooks`
- `/internal/operations`
- `/internal/recommendations`
- `/portal/cloud`
- `/portal/orchestration`
- `/portal/knowledge`
- `/portal/forecasting`
- `/portal/integrations`
- `/internal/cloud`
- `/internal/orchestration`
- `/internal/integrations`
- `/internal/governance`

Subscription architecture follows Stripe Billing best practices: use Billing APIs with Checkout Sessions in `subscription` mode and Stripe Customer Portal for self-service plan management. The current implementation stores plan metadata and optional `stripe_price_id` values without creating live Stripe objects yet.

Tenant isolation rules:

- Resolve organization context before querying tenant records.
- Scope operational metrics, automation events, reports, recommendations, notifications, usage, and benchmarks by `organization_id`.
- Add `location_id` where location comparison or health scoring needs branch-level visibility.
- Replace token scaffolds with Supabase Auth membership checks before production client access.

## Phase 7 and Phase 8 Autonomous OS

ALICE is implemented as a provider-abstracted operational intelligence layer with deterministic local behavior and future provider routing through `AI_PROVIDER`.

New APIs:

- `/api/alice/chat`
- `/api/alice/insights`
- `/api/alice/recommendations`
- `/api/alice/reports`
- `/api/alice/forecast`
- `/api/alice/alerts`
- `/api/autonomous/state`
- `/api/autonomous/simulate`
- `/api/autonomous/approvals`

Safety model:

- Autonomous recommendations do not self-apply.
- Every proposed optimization is represented in an approval queue.
- Playbooks include trigger conditions, goals, expected outcomes, rollback logic, and review flow.
- Memory tables are tenant-scoped and ready for semantic retrieval references without exposing cross-tenant context.

## Phase 10 and Phase 11 Enterprise Healthcare Cloud

The enterprise cloud layer adds PMS abstraction, normalized healthcare events, revenue orchestration, knowledge graph storage, enterprise forecasts, simulation records, and governance controls.

New APIs:

- `/api/enterprise/cloud`
- `/api/enterprise/orchestration`
- `/api/enterprise/integrations`
- `/api/enterprise/simulate`
- `/api/alice/orchestration`

New Supabase tables:

- `pms_integrations`
- `normalized_healthcare_events`
- `healthcare_cloud_layers`
- `revenue_orchestration_runs`
- `knowledge_graph_nodes`
- `knowledge_graph_edges`
- `enterprise_forecasts`
- `enterprise_playbooks`
- `alice_enterprise_memory`
- `enterprise_simulations`
- `ai_governance_records`
- `orchestration_events`
- `enterprise_events`
- `intelligence_events`
- `benchmark_events`
- `operational_risk_events`
- `forecasting_events`

Governance model:

- PMS data is normalized into forecasting-ready and benchmark-ready event structures.
- ALICE enterprise mode is grounded with operational metrics, benchmark snapshots, historical recommendations, forecasting outcomes, optimization effectiveness, and event history.
- Revenue orchestration proposes recovery priorities but remains approval-gated.
- Governance records store approval chains, risk controls, rollback plans, and audit notes.
- Realtime subscriptions now include enterprise events, intelligence events, benchmark events, operational risk events, and forecasting events.

`npm audit --omit=dev` reports active advisories for Next.js 14 even at `14.2.35`. The requested stack was Next.js 14; npm recommends a breaking upgrade path to Next.js 16 for full advisory remediation. Treat that as the next security decision before production traffic.
