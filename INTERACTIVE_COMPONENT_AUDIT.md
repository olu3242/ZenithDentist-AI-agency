# Interactive Component Audit

Date: 2026-06-01

## Scope

Audited navigation, pages, dashboards, cards, widgets, buttons, forms, tables, charts, filters, dropdowns, action menus, workflow triggers, and dashboard components through static code inspection and production build validation.

## Classification Legend

- FULLY FUNCTIONAL: Navigates/loads, has backend or server-state connection, handles loading/error states, and has a real user action.
- PARTIALLY FUNCTIONAL: Loads and displays useful data, but has limited filtering, persistence, or live verification.
- PLACEHOLDER: UI exists but depends on unavailable configuration or explicitly empty state.
- MOCK DATA: Uses sample/sandbox/demo/static registry data as a primary source.
- BROKEN: Fails typecheck, lint, or build, or has a dead action.

## Implemented During Sprint

| Area | Change | Result |
| --- | --- | --- |
| Admin tables | Upgraded `components/admin/crm-table.tsx` | Search, column filter, sorting, pagination, page-size control, mobile overflow |
| Automation Center actions | Added missing workflow validation | Bad submissions redirect to visible error state |
| Automation Center loading | Replaced static buttons with `SubmitButton` | Pending state for Execute/Pause/Resume |
| Automation Marketplace actions | Added missing workflow validation | Bad submissions redirect to visible error state |
| Automation Marketplace loading | Replaced static buttons with `SubmitButton` | Pending state for install/enable/disable/PRE deploy |

## Navigation Audit

| Navigation group | Items | Page load status | Responsive status | Classification |
| --- | --- | --- | --- | --- |
| Public landing nav | Platform, Screens, Leaks, Playbooks, ALICE, Mission Control, PMS Ops, Assessment | Anchor navigation works in-page | Responsive header uses constrained layout | PARTIALLY FUNCTIONAL |
| Admin sidebar | Command, Leads, Audits, Bookings, ROI, Analytics | Routes exist and build | Sidebar layout responsive enough for app shell | FULLY FUNCTIONAL |
| Internal sidebar | Mission Control, Runtime Health, E2E Audit, Events, Grounding, Resilience, Replays, Intelligence, Accuracy, Confidence, Sim Accuracy, Cloud, Orchestration, PMS, Governance, Platform, ALICE, Playbooks, Operations, Recommendations, Organizations, Health, Benchmarks, Revenue, Platform Metrics | Routes exist and build | Sidebar/app-shell responsive | PARTIALLY FUNCTIONAL |
| App shell role nav | Role-based portal/dashboard/settings links | Routes exist and build | Mobile top/bottom surfaces present | FULLY FUNCTIONAL |
| Portal sidebar | Dashboard, Revenue, Recall, Patients, Reports, Locations, Integrations, Reviews, Forecasting, ALICE, Command, Cloud, Orchestration, Knowledge, Settings, Simulations | Routes exist and build | Responsive portal shell | PARTIALLY FUNCTIONAL |

## Page And Dashboard Audit

| Surface | Backend connectivity | Actions | Loading/error states | Classification |
| --- | --- | --- | --- | --- |
| Landing page | Admin/ROI/runtime summary data; ROI form persists leads/audits | Assessment submit, route probe, gated strategy session | Form pending/errors; offline state | PARTIALLY FUNCTIONAL |
| Signup/Login/Auth callback/Password reset | Supabase auth and service bootstrap | Signup, login, Google OAuth, reset/update password | Redirect errors shown | FULLY FUNCTIONAL |
| Onboarding | Service bootstrap context | Complete onboarding | Page error query and redirect fallback | FULLY FUNCTIONAL |
| Admin Command | Lead/ROI/audit/booking/event data | Table exploration | Admin loading/error files exist | FULLY FUNCTIONAL |
| Admin Leads/Audits/Bookings/ROI/Analytics | `getAdminDashboardData()` | Search/sort/filter/pagination | Empty table states | FULLY FUNCTIONAL |
| Dashboard | Tenant data, scoped admin data, runtime data, automation state | Navigation/action panels | Dashboard loading/error files exist | FULLY FUNCTIONAL |
| Automation Center | Automation registry + runtime traces | Execute/Pause/Resume with persistence | Pending + success/error query states | FULLY FUNCTIONAL |
| Automation Marketplace | Automation registry + patient revenue product | Install/Enable/Disable/PRE install/deploy | Pending + success/error query states | FULLY FUNCTIONAL |
| Mission Control | Runtime, governance, provider, replay, incident, tenant modules | Many panels are read/diagnostic; selected modules persist events | Route loading/error files exist | PARTIALLY FUNCTIONAL |
| Runtime OS | Tenant/runtime modules | Mostly read-only operational dashboard | Route build verified | PARTIALLY FUNCTIONAL |
| Workflow OS | Tenant + workflow governance/registry | Governance views, limited mutation | Route build verified | PARTIALLY FUNCTIONAL |
| Portal | Tenant + portal operational data | Reports/downloads/navigation | Portal route loading/error coverage partial | PARTIALLY FUNCTIONAL |
| GTM Command Center | GTM tables + admin fallback | Create/update GTM functions exist in library; page is mostly read-only | Route build verified | PARTIALLY FUNCTIONAL |
| Internal pages | Internal aggregate data modules | Mostly read-only diagnostics | Route build verified | PARTIALLY FUNCTIONAL |

## Tables

| Table/component | Sorting | Filtering | Pagination | Search | Classification |
| --- | --- | --- | --- | --- | --- |
| `CRMTable` | Implemented | Implemented by column | Implemented | Implemented | FULLY FUNCTIONAL |
| Admin Leads | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | FULLY FUNCTIONAL |
| Admin Audits | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | FULLY FUNCTIONAL |
| Admin Bookings | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | FULLY FUNCTIONAL |
| Admin ROI | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | Inherits `CRMTable` | FULLY FUNCTIONAL |
| Mission-control custom tables | Some panels use mapped rows without generic controls | Limited | Limited | Limited | PARTIALLY FUNCTIONAL |

## Forms And Actions

| Form/action | Validation | Save/update/delete | Persistence | Loading/error | Classification |
| --- | --- | --- | --- | --- | --- |
| ROI assessment | Zod schema | Save lead, ROI, audit, assessment | Supabase | Pending and result state | FULLY FUNCTIONAL |
| Signup | Server validation + bootstrap checks | Create auth/profile/org/member/onboarding | Supabase Auth + DB | Redirect errors | FULLY FUNCTIONAL |
| Login | Supabase password auth | Session/bootstrap cookies | Supabase Auth + cookies | Redirect errors | FULLY FUNCTIONAL |
| Google OAuth | Supabase OAuth | Session/bootstrap recovery | Supabase Auth + DB | Redirect errors | FULLY FUNCTIONAL |
| Password reset | Basic password validation | Update password | Supabase Auth | Redirect errors | FULLY FUNCTIONAL |
| Complete onboarding | Context validation | Update profile/org/onboarding run | Supabase | Redirect errors | FULLY FUNCTIONAL |
| Automation execute/pause/resume | Workflow ID validation | Registry/runtime updates | Supabase | Pending + query status/error | FULLY FUNCTIONAL |
| Marketplace install/enable/disable | Workflow ID validation | Registry updates | Supabase | Pending + query status/error | FULLY FUNCTIONAL |
| FAQ interaction | Click tracking | Analytics insert | Supabase route | Non-blocking | PARTIALLY FUNCTIONAL |
| Route Probe | Fetches API routes | No persistence | Browser fetch | Inline response JSON/error | FULLY FUNCTIONAL |

## Charts And Widgets

| Component group | Data source | Classification |
| --- | --- | --- |
| Admin charts | Lead/ROI/event rows | FULLY FUNCTIONAL |
| Revenue dashboard metrics | Lead/ROI/booking aggregates | FULLY FUNCTIONAL |
| Portal scorecards/charts | `getPortalData()` live/fallback data | PARTIALLY FUNCTIONAL |
| Mission Control runtime widgets | Runtime modules and derived state | PARTIALLY FUNCTIONAL |
| Landing gallery/hero preview | Explicit sandbox/demo sample data | MOCK DATA |
| Product/marketplace registry cards | Static automation registry + persisted status | PARTIALLY FUNCTIONAL |

## Placeholder And Mock Inventory

| Item | Current classification | Remediation status |
| --- | --- | --- |
| Public landing gallery modes `demo/sandbox/live` | MOCK DATA | Left as product demo; labeled in audit |
| Some Mission Control panels | PARTIALLY FUNCTIONAL | Backend modules exist, but not every panel has mutation/drilldown |
| Portal empty states | PLACEHOLDER when Supabase unavailable or tenant missing | Valid fallback; not removed |
| Automation registry empty state | PLACEHOLDER when Supabase/org unavailable | Valid fallback; action requires tenant migration |
| GTM Command Center | PARTIALLY FUNCTIONAL | Backend functions exist; page lacks full mutation UI |

## Broken Items

No typecheck, lint, or production-build-broken components remain after this sprint.

## Residual Gaps Against 100% Goal

- A true 100% clickable certification requires browser automation across authenticated roles and a linked Supabase project with seed data.
- Several diagnostic dashboards are intentionally read-only and therefore do not have save/update/delete actions.
- Not every custom Mission Control table has generic sorting/filtering/pagination.
- Public product demo sections still contain explicit sandbox/sample content.
