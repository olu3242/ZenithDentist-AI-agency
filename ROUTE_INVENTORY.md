# Zenith AI Route Inventory

Source audited: `app/` (this repository does not contain `src/app`).

## UI Routes

| Route | File | Shell / Layout | Auth posture |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | Public landing | Public |
| `/admin` | `app/admin/page.tsx` | `AppShell` via `app/admin/layout.tsx` | Agency Admin / Super Admin |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | `AppShell` | Agency Admin / Super Admin |
| `/admin/audits` | `app/admin/audits/page.tsx` | `AppShell` | Agency Admin / Super Admin |
| `/admin/bookings` | `app/admin/bookings/page.tsx` | `AppShell` | Agency Admin / Super Admin |
| `/admin/leads` | `app/admin/leads/page.tsx` | `AppShell` | Agency Admin / Super Admin |
| `/admin/roi` | `app/admin/roi/page.tsx` | `AppShell` | Agency Admin / Super Admin |
| `/client-operations` | `app/client-operations/page.tsx` | Linked from `AppShell` operations nav | Agency Admin / Super Admin |
| `/dashboard` | `app/dashboard/page.tsx` | `AppShell` | Staff / Agency Admin / Super Admin |
| `/gtm-command-center` | `app/gtm-command-center/page.tsx` | Linked from `AppShell` operations nav | Agency Admin / Super Admin |
| `/internal` | `app/internal/page.tsx` | Redirects to `/internal/mission-control` | Super Admin |
| `/internal/*` | `app/internal/**/page.tsx` | `AppShell` via `app/internal/layout.tsx` | Super Admin |
| `/lead-operations` | `app/lead-operations/page.tsx` | Linked from `AppShell` operations nav | Agency Admin / Super Admin |
| `/mission-control` | `app/mission-control/page.tsx` | `AppShell` | Super Admin |
| `/portal-select` | `app/portal-select/page.tsx` | Redirect route | Authenticated role |
| `/portal` | `app/portal/page.tsx` | `AppShell` via `app/portal/layout.tsx` | Practice Owner / Super Admin |
| `/portal/*` | `app/portal/**/page.tsx` | `AppShell` | Practice Owner / Super Admin, with `/portal/onboarding` also available to Staff |
| `/runtime-os` | `app/runtime-os/page.tsx` | `AppShell` | Super Admin |
| `/settings` | `app/settings/page.tsx` | `AppShell` | All authenticated roles |
| `/workflow-os` | `app/workflow-os/page.tsx` | `AppShell` | Super Admin |

## API Routes

| Route family | Files | Notes |
| --- | --- | --- |
| `/api/alice/*` | `app/api/alice/**/route.ts` | ALICE alerts, chat, forecast, insights, orchestration, recommendations, reports |
| `/api/analytics/*` | `app/api/analytics/**/route.ts` | Abandoned funnel and FAQ analytics |
| `/api/autonomous/*` | `app/api/autonomous/**/route.ts` | Approval, simulation, and autonomous state endpoints |
| `/api/calendly/events` | `app/api/calendly/events/route.ts` | Booking webhook/event endpoint |
| `/api/enterprise/*` | `app/api/enterprise/**/route.ts` | Cloud, integrations, orchestration, simulation endpoints |
| `/api/gtm-command-center` | `app/api/gtm-command-center/route.ts` | GTM command center data |
| `/api/mission-control/*` | `app/api/mission-control/**/route.ts` | Runtime, governance, replay, cloud, platform, reporting, audit endpoints |
| `/api/opendental/sync` | `app/api/opendental/sync/route.ts` | Open Dental sync endpoint |
| `/api/reports/[id]` | `app/api/reports/[id]/route.ts` | Executive report delivery endpoint |

## Route Additions

- Added `/portal-select` for post-login/default portal routing.
- Added `/workflow-os` and `/runtime-os` as first-class Super Admin portals.
- Added `/settings` as a global authenticated settings surface.
