# Navigation Map

## Unified AppShell

`components/app/app-shell.tsx` now provides:

- Global navbar with organization context, portal selector, notification count, profile dropdown, and settings link.
- Sidebar navigation with role-aware groups.
- Organization switcher seeded from tenant data.
- User profile dropdown showing the active Zenith role.

## Role-Aware Menu Rendering

Navigation definitions live in `lib/navigation.ts`.

| Role | Default portal | Primary routes |
| --- | --- | --- |
| Practice Owner | `/portal` | `/portal`, `/portal/onboarding`, `/settings` plus portal modules |
| Staff | `/dashboard` | `/dashboard`, `/portal/onboarding`, `/settings` |
| Agency Admin | `/admin` | `/admin`, `/dashboard`, `/settings`, admin subroutes, lead/client/GTM ops |
| Super Admin | `/mission-control` | All major portals: `/dashboard`, `/portal`, `/admin`, `/mission-control`, `/workflow-os`, `/runtime-os`, `/internal`, `/settings` |

## Public Landing Navigation

`components/public/site-header.tsx` now links to:

- `/portal-select`
- `/dashboard`
- `#audit`
- `#faq`

The public hero secondary CTA now opens `/portal-select` instead of hard-wiring users to Admin CRM.

## Portal Coverage

All requested portals are connected:

- `/dashboard`
- `/portal`
- `/admin`
- `/mission-control`
- `/workflow-os`
- `/runtime-os`
- `/internal`
- `/settings`

## ROI Routing Cleanup

No `router.push("/roi-calculator")` or `redirect("/roi-calculator")` calls were found. ROI remains as a public landing section and Admin CRM subpage, but global CTAs no longer point exclusively to ROI-only destinations.
