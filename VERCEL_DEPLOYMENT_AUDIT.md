# Vercel Deployment Audit

Generated: 2026-06-01

## Scope

Audited deployed Vercel environment for:

- Every page route
- Every API route
- Automation Platform
- Runtime OS
- AI OS / ALICE
- Platform Admin
- Executive Dashboard
- Dashboard panels
- Automations
- Multi-tenant enforcement

## Deployment Discovery

GitHub deployment metadata shows Vercel deployments are present.

Production deployment:

- Environment: `Production`
- Deployment state: `success`
- Commit: `9b94f608c6b781571fb14cb26d85b592fe091462`
- URL: `https://zenithprosai.com`
- Created: `2026-06-01T00:22:27Z`

Latest discovered preview deployment:

- Environment: `Preview`
- Deployment state: `success`
- Commit: `38b7316a44093b981e164e9c5d65ae22cba48b66`
- URL: `https://zenithprosai.com`
- Created: `2026-06-01T01:28:54Z`

Important drift:

- Production is not running the latest local branch state.
- Production commit predates the latest local fixes and reports.
- Latest preview also returns the same Vercel-level `401` at `/`.

## Live Production Probe Result

All production page probes returned:

- Status: `401`
- Server: `Vercel`
- Body: empty
- App HTML: not returned

All production API probes returned:

- Status: `401`
- Server: `Vercel`
- App JSON: not returned

Interpretation:

- Requests are blocked before the Next.js application handles them.
- This is consistent with Vercel deployment protection, project access control, or an equivalent edge-level gate.
- Because `/`, `/login`, and `/signup` also return `401`, Zenith is not publicly reachable from the audited production URL.

## Page Route Audit

Result for every page route below: `DEPLOYED = UNKNOWN`, `WORKING = NO`, `CONNECTED = UNVERIFIED`, `PRODUCTION READY = NO`.

Reason: production URL returns `401` before app code for all page probes.

Routes probed:

- `/`
- `/admin`
- `/admin/analytics`
- `/admin/audits`
- `/admin/bookings`
- `/admin/leads`
- `/admin/roi`
- `/auth/callback`
- `/auth/reset-password`
- `/auth/verify`
- `/automation-center`
- `/automation-marketplace`
- `/client-operations`
- `/dashboard`
- `/forgot-password`
- `/gtm-command-center`
- `/internal`
- `/internal/accuracy`
- `/internal/ai`
- `/internal/automation-audit`
- `/internal/benchmarks`
- `/internal/cloud`
- `/internal/confidence`
- `/internal/events`
- `/internal/governance`
- `/internal/grounding`
- `/internal/health`
- `/internal/integrations`
- `/internal/intelligence`
- `/internal/mission-control`
- `/internal/operations`
- `/internal/orchestration`
- `/internal/organizations`
- `/internal/platform`
- `/internal/platform-metrics`
- `/internal/playbooks`
- `/internal/recommendations`
- `/internal/replays`
- `/internal/resilience`
- `/internal/revenue`
- `/internal/runtime-health`
- `/internal/simulations`
- `/lead-operations`
- `/login`
- `/mission-control`
- `/onboarding`
- `/portal`
- `/portal-select`
- `/portal/alice`
- `/portal/cloud`
- `/portal/command`
- `/portal/dashboard`
- `/portal/forecasting`
- `/portal/integrations`
- `/portal/knowledge`
- `/portal/locations`
- `/portal/onboarding`
- `/portal/orchestration`
- `/portal/patients`
- `/portal/recall`
- `/portal/reports`
- `/portal/revenue`
- `/portal/reviews`
- `/portal/settings`
- `/portal/simulations`
- `/runtime-os`
- `/settings`
- `/signup`
- `/workflow-os`

Page route result summary:

- Total page routes probed: 69
- `200`: 0
- `3xx`: 0
- `401`: 69
- `404`: 0 observed because Vercel protection blocked all requests first
- `500`: 0 observed because Vercel protection blocked all requests first

## API Route Audit

Result for every API route below: `DEPLOYED = UNKNOWN`, `WORKING = NO`, `CONNECTED = UNVERIFIED`, `PRODUCTION READY = NO`.

Reason: production URL returns `401` before app code for all API probes.

Routes probed:

- `GET /api/alice/alerts`
- `POST /api/alice/chat`
- `GET /api/alice/forecast`
- `GET /api/alice/insights`
- `POST /api/alice/orchestration`
- `GET /api/alice/recommendations`
- `POST /api/alice/reports`
- `POST /api/analytics/abandoned`
- `POST /api/analytics/faq`
- `POST /api/autonomous/approvals`
- `POST /api/autonomous/simulate`
- `GET /api/autonomous/state`
- `POST /api/calendly/events`
- `GET /api/enterprise/cloud`
- `GET /api/enterprise/integrations`
- `POST /api/enterprise/integrations`
- `GET /api/enterprise/orchestration`
- `POST /api/enterprise/simulate`
- `GET /api/gtm-command-center`
- `POST /api/gtm-command-center`
- `GET /api/mission-control/automation-audit`
- `GET /api/mission-control/cloud`
- `POST /api/mission-control/evaluate`
- `GET /api/mission-control/executive-report`
- `GET /api/mission-control/governance`
- `POST /api/mission-control/governance`
- `GET /api/mission-control/operational-summary`
- `GET /api/mission-control/platform`
- `POST /api/mission-control/replay`
- `GET /api/mission-control/runtime-health`
- `GET /api/mission-control/state`
- `POST /api/opendental/sync`
- `POST /api/reports/[id]`

API route result summary:

- Total API route probes: 30 route files probed using their primary method
- `200`: 0
- `401`: 30
- `404`: 0 observed because Vercel protection blocked all requests first
- `500`: 0 observed because Vercel protection blocked all requests first

## Feature Readiness Matrix

| Feature | Deployed | Working | Connected | Production Ready | Evidence |
| --- | --- | --- | --- | --- | --- |
| Landing page | UNKNOWN | NO | UNVERIFIED | NO | `/` returns Vercel `401` |
| Login | UNKNOWN | NO | UNVERIFIED | NO | `/login` returns Vercel `401` |
| Signup / Platform Admin | UNKNOWN | NO | UNVERIFIED | NO | `/signup` returns Vercel `401`; app cannot reach bootstrap UI |
| Portal | UNKNOWN | NO | UNVERIFIED | NO | `/portal` returns Vercel `401` |
| Dashboard | UNKNOWN | NO | UNVERIFIED | NO | `/dashboard` returns Vercel `401` |
| Admin | UNKNOWN | NO | UNVERIFIED | NO | `/admin` returns Vercel `401` |
| Internal | UNKNOWN | NO | UNVERIFIED | NO | `/internal` returns Vercel `401` |
| Executive Dashboard | UNKNOWN | NO | UNVERIFIED | NO | `/mission-control` returns Vercel `401` |
| Automation Platform | UNKNOWN | NO | UNVERIFIED | NO | `/workflow-os` returns Vercel `401` |
| Runtime OS | UNKNOWN | NO | UNVERIFIED | NO | `/runtime-os` returns Vercel `401` |
| AI OS / ALICE | UNKNOWN | NO | UNVERIFIED | NO | `/portal/alice` and `/api/alice/*` return Vercel `401` |
| Automation Marketplace | UNKNOWN | NO | UNVERIFIED | NO | `/automation-marketplace` returns Vercel `401` |
| Automation Center | UNKNOWN | NO | UNVERIFIED | NO | `/automation-center` returns Vercel `401` |
| Runtime health APIs | UNKNOWN | NO | UNVERIFIED | NO | `/api/mission-control/runtime-health` returns Vercel `401` |
| Workflow/automation APIs | UNKNOWN | NO | UNVERIFIED | NO | API probes return Vercel `401` |
| Multi-tenant enforcement | UNKNOWN | UNVERIFIED | UNVERIFIED | NO | App middleware is not reached by probes |

## Dashboard Panel Audit

Production status: blocked.

Dashboard panels cannot be verified live because `/dashboard` returns `401` before app render.

Local code indicates dashboard surfaces exist, but production readiness requires a live rendered page and live API/data verification.

## Executive Dashboard Panel Audit

Production status: blocked.

Executive Dashboard panels cannot be verified live because `/mission-control` and `/api/mission-control/*` return `401` before app code.

## Workflow Audit

Production status: blocked.

Automation Platform cannot be verified live because `/workflow-os` and supporting APIs are inaccessible.

Local code contains Automation Platform routes and `executeWorkflow()` infrastructure, but production execution was not reachable through Vercel.

## Automation Audit

Production status: blocked.

Automation Marketplace and Automation Center cannot be verified live because both return `401`.

Local code contains automation registry and marketplace/center routes, but production install/enable/execute flows were not reachable through Vercel.

## Runtime OS Audit

Production status: blocked.

Runtime OS cannot be verified live because `/runtime-os` and runtime health APIs return `401`.

## AI OS / ALICE Audit

Production status: blocked.

ALICE UI and API routes cannot be verified live because `/portal/alice` and `/api/alice/*` return `401`.

Local validation after the AI provider fix showed `AI_PROVIDER=local` boots and local build succeeds, but the deployed production URL is blocked before app runtime.

## Environment Audit Findings

Live Vercel environment variables cannot be read without Vercel project access.

Observable deployment evidence:

- Vercel deployment exists and is marked `success`.
- Production URL returns `401` at the Vercel layer.
- `NEXT_PUBLIC_SITE_URL` in local `.env.local` points at Supabase, not the Vercel app URL. If mirrored in Vercel, callbacks and canonical URLs are likely misconfigured.
- Production deployment commit is older than the latest local branch state and may not include the latest fixes.

Potential missing or misconfigured production env vars:

- `NEXT_PUBLIC_SITE_URL`
- `AI_PROVIDER`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_ACCESS_TOKEN`
- `PORTAL_ACCESS_TOKEN`
- `INTERNAL_ACCESS_TOKEN`
- Provider keys as needed: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`

## 404 / 500 / Broken API Findings

No application-level `404` or `500` could be observed because every request was blocked by Vercel `401` first.

This is not a pass. It means app-level functionality is unreachable from the audited production URL.

## Mock / Placeholder Finding

Live production mock/static placeholder status: unverified due Vercel `401`.

Local repo risk:

- Several historical mock/static audit reports exist.
- Live data convergence cannot be confirmed from deployed production until Vercel access is opened or a valid bypass token is provided.

## Final Deployment Verdict

Production deployment exists, but it is not usable by real dental practices from the audited URL.

Verdict: NO.

Primary blocker:

- Vercel production URL returns `401` for public, protected, and API routes before the Next.js app responds.

Secondary blockers:

- Production is not on the latest audited branch.
- Vercel env values cannot be verified.
- Public routes such as `/`, `/login`, and `/signup` are inaccessible.

