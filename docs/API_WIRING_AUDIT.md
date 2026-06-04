# API Wiring Audit

Generated: 2026-06-01

## Scope

Audited frontend surfaces under `app/` and reusable components under `components/` for wiring to Supabase, server actions, API routes, Executive Dashboard, Revenue Engine, PMS, ALICE, and analytics modules.

## Summary

| Area | Classification | Evidence |
| --- | --- | --- |
| Landing hero dashboard | REAL DATA + STATIC DATA | `app/page.tsx` now passes Supabase/runtime summary stats from `getAdminDashboardData()` and `getRuntimeHealthState()`; gallery and preview modules still include static/demo copy. |
| ROI Assessment | REAL DATA | `components/public/roi-funnel-form.tsx` uses `submitFunnelAction`; `POST /api/roi-assessment` exists; storage path is `createLeadFunnel()`. |
| Public FAQ analytics | REAL DATA | `components/public/faq.tsx` posts to `/api/analytics/faq`; route writes `faq_interactions` and outreach events. |
| Dashboard | REAL DATA | `app/dashboard/page.tsx` reads `getAdminDashboardData()`, `getRuntimeHealthState()`, `getAutomationOSState()`, `getTenantData()`. |
| Portal dashboard | REAL DATA with generated fallback | `app/portal/dashboard/page.tsx` reads `getPortalData()` and `getTenantData()`; empty metrics create empty states, insights can be generated from real metrics/events. |
| Executive Dashboard | REAL DATA | `app/mission-control/page.tsx` aggregates runtime, provider, incidents, governance, replay, event fabric, tenant, ALICE, and productization modules. |
| Admin dashboards | REAL DATA | Admin pages use `getAdminDashboardData()`. |
| ALICE APIs | REAL DATA / MODULE DATA | `/api/alice/*` routes call ALICE or runtime modules; provider behavior depends on env. |
| Executive Dashboard APIs | REAL DATA / MODULE DATA | `/api/mission-control/*` routes call runtime, governance, cloud, replay, and productization modules. |
| PMS API | REAL DATA PATH EXISTS | `/api/opendental/sync` exists and routes to PMS module. Required `/dashboard/pms/*` UI routes do not exist. |
| Internal pages | REAL DATA / MODULE DATA | Internal pages generally call runtime, tenant, analytics, AI, or platform modules. |
| GTM command center | REAL DATA with derived data | Uses `getBusinessGrowthState()` from lead/client ops data. |

## Component Classification

| Component Group | Classification | Evidence |
| --- | --- | --- |
| `components/public/roi-funnel-form.tsx` | REAL DATA | Server action, Supabase, email, Executive Dashboard attribution. |
| `components/public/pros-landing.tsx` | MIXED | Hero stats are backend-fed; gallery, role workspace, and some Executive Dashboard preview copy remain static/demo. |
| `components/public/audit-preview.tsx` | STATIC DATA + REAL CTA | Uses projected value from ROI assessment but descriptive bullets are static. |
| `components/mission-control/*` | REAL DATA | Props are populated from runtime/Executive Dashboard modules in `app/mission-control/page.tsx`. |
| `components/portal/*` | REAL DATA | Props come from `getPortalData()`, `getTenantData()`, and health modules. |
| `components/admin/*` | REAL DATA | Props come from Supabase lead/ROI/audit/booking data. |
| `components/gtm/*` | REAL DATA | Props come from `getBusinessGrowthState()`. |
| `components/enterprise/*` | MODULE DATA | Props come from enterprise cloud/autonomous/productization modules; some values are derived readiness models. |
| `components/autonomous/*` | MODULE DATA | Props come from autonomous state modules; not all panels are direct Supabase reads. |
| `components/tenant/*` | REAL DATA / DERIVED | Uses tenant data, benchmarks, and health scoring. |
| `components/brand/*`, `components/branding/*` | STATIC SYSTEM COMPONENTS | Branding primitives; no backend required. |

## API Route Inventory

Key API routes found:

- `/api/roi-assessment`
- `/api/analytics/faq`
- `/api/analytics/abandoned`
- `/api/alice/alerts`
- `/api/alice/chat`
- `/api/alice/forecast`
- `/api/alice/insights`
- `/api/alice/orchestration`
- `/api/alice/recommendations`
- `/api/alice/reports`
- `/api/mission-control/automation-audit`
- `/api/mission-control/cloud`
- `/api/mission-control/evaluate`
- `/api/mission-control/executive-report`
- `/api/mission-control/governance`
- `/api/mission-control/operational-summary`
- `/api/mission-control/platform`
- `/api/mission-control/replay`
- `/api/mission-control/runtime-health`
- `/api/mission-control/state`
- `/api/opendental/sync`
- `/api/reports/[id]`

## Blockers

- Required PMS dashboard routes under `/dashboard/pms/*` are missing.
- Landing page still contains static/demo gallery and role workspace values.
- Only root `app/loading.tsx` and root `app/error.tsx` exist; route-level state coverage is incomplete.
- Some modules return generated or modeled state when Supabase has no data; this is acceptable as empty-state derivation only if labeled clearly, but not as live pilot evidence.

## Verdict

Status: PARTIALLY WIRED

The primary operational surfaces have backend modules, but not every visible widget traces to direct live data. PMS UI route coverage and landing static preview sections require remediation before pilot certification.
