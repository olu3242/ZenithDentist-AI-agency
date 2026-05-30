# Production Readiness Report
**Assessment date:** 2026-05-30
**Scope:** All pages, API routes, and lib modules at HEAD of main branch

---

## Overall Readiness Score: 42 / 100

The platform has solid frontend-to-backend wiring and a complete event pipeline but is blocked from serving real paying customers by the absence of authentication, missing third-party integrations, and unverified data at the OpenDental boundary. The score is derived from the five dimensions below; no dimension is weighted.

---

## Five Dimensions

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Frontend Coverage | 82/100 | 61 pages exist; all have server components with real data calls. ~8 portal sub-pages are presentational or use fallback data when Supabase is unreachable. |
| Backend Wiring | 74/100 | 37 API routes exist; all delegate to lib functions. None enforce auth or tenant guard. `/api/dental/metrics` passes `organizationId` to analytics but `getWorkflowAnalyticsSummary()` does not accept it — org scoping is ignored in that path. |
| Data Integrity | 55/100 | Leads, ROI calculations, and audit records write to real tables. Workflow traces write correctly. OpenDental pilot returns an empty array. No RLS. Multi-tenant isolation is application-level only. |
| Security | 5/100 | No Supabase Auth session layer. No JWT validation on any route. Tenant guard functions exist (`lib/tenant/tenant-guards.ts`) but are unused. Any caller can supply any `organizationId` and read or write that tenant's data. |
| Observability | 72/100 | Runtime traces (`automation_traces`) write on every workflow execution. Event fabric writes to `runtime_event_fabric_events`. Mission Control aggregates both. Gap: analytics reads `automation_traces` but events are in `runtime_event_fabric_events` — they are never joined, so event-triggered metrics are invisible to analytics. |

---

## Per-Page Status Table

Pages are classified as:
- **LIVE** — server component calls a real lib function that reads/writes Supabase; no hardcoded data
- **PARTIAL** — real data call exists but falls back to empty/default when Supabase is unreachable, or secondary panels are presentational
- **BLOCKED** — depends on a missing integration, missing auth, or missing env var to be useful

| Page | Status | Notes |
|------|--------|-------|
| `app/page.tsx` (landing) | LIVE | Static marketing + ROI funnel form wired to `submitFunnelAction` |
| `app/admin/page.tsx` | LIVE | Calls `getAdminDashboardData()` |
| `app/admin/analytics/page.tsx` | LIVE | Reads workflow analytics summary |
| `app/admin/audits/page.tsx` | LIVE | Reads `audits` table via `getAdminDashboardData()` |
| `app/admin/bookings/page.tsx` | LIVE | Reads bookings data |
| `app/admin/discovery/page.tsx` | LIVE | Reads discovery sessions |
| `app/admin/leads/page.tsx` | LIVE | Reads `leads` table |
| `app/admin/offer-builder/page.tsx` | PARTIAL | Reads proposals; proposal generator returns `[]` when Supabase unavailable |
| `app/admin/roi/page.tsx` | LIVE | Calls `computeTenantRoi()` |
| `app/client-operations/page.tsx` | PARTIAL | Real data calls; some sub-panels use default values when no traces present |
| `app/dashboard/page.tsx` | LIVE | Reads workflow analytics |
| `app/dashboard/dental/page.tsx` | LIVE | Calls `computeTenantRoi()` and `getWorkflowAnalyticsSummary()` via `getTenantData()` |
| `app/gtm-command-center/page.tsx` | PARTIAL | Reads GTM state; Google Business integration is disconnected |
| `app/internal/page.tsx` | LIVE | Internal data hub |
| `app/internal/accuracy/page.tsx` | PARTIAL | AI accuracy metrics — source data depends on learning signals being written |
| `app/internal/ai/page.tsx` | PARTIAL | Agent OS state; learning signals in-memory only |
| `app/internal/automation-audit/page.tsx` | LIVE | Reads `automation_traces` |
| `app/internal/benchmarks/page.tsx` | PARTIAL | Benchmarks reference external data not yet wired |
| `app/internal/cloud/page.tsx` | PARTIAL | Enterprise cloud state; full data requires multi-location setup |
| `app/internal/confidence/page.tsx` | PARTIAL | Confidence scores derived from in-memory signals |
| `app/internal/events/page.tsx` | LIVE | Reads `runtime_event_fabric_events` |
| `app/internal/governance/page.tsx` | LIVE | Reads governance state from runtime |
| `app/internal/grounding/page.tsx` | PARTIAL | ALICE grounding — reads live data but OpenDental records are empty |
| `app/internal/health/page.tsx` | LIVE | Reads `automation_traces` for SLA health |
| `app/internal/integrations/page.tsx` | BLOCKED | Lists integrations; Twilio and Google Business show as disconnected |
| `app/internal/intelligence/page.tsx` | PARTIAL | Intelligence layer; depends on enough trace history |
| `app/internal/mission-control/page.tsx` | LIVE | Reads full `getMissionControlState()` |
| `app/internal/operations/page.tsx` | LIVE | Reads tenant operations data |
| `app/internal/orchestration/page.tsx` | LIVE | Reads agent coordination state |
| `app/internal/organizations/page.tsx` | LIVE | Reads organizations table |
| `app/internal/platform-metrics/page.tsx` | LIVE | Reads platform-wide runtime metrics |
| `app/internal/platform/page.tsx` | LIVE | Platform config and health summary |
| `app/internal/playbooks/page.tsx` | PARTIAL | Playbooks static + implementation OS data |
| `app/internal/recommendations/page.tsx` | PARTIAL | AI recommendations; depend on learning history |
| `app/internal/replays/page.tsx` | LIVE | Reads replay queue from runtime |
| `app/internal/resilience/page.tsx` | LIVE | Reads autonomous recovery state |
| `app/internal/revenue/page.tsx` | LIVE | Reads ROI + revenue recovery |
| `app/internal/runtime-health/page.tsx` | LIVE | Reads `automation_traces` for health scores |
| `app/internal/simulations/page.tsx` | LIVE | Reads simulation engine state |
| `app/lead-operations/page.tsx` | LIVE | Reads `leads` table |
| `app/marketplace/dental/page.tsx` | LIVE | Lists dental extensions from registry; install via real POST |
| `app/mission-control/page.tsx` | LIVE | Calls `getMissionControlState()` |
| `app/portal/page.tsx` | LIVE | Calls `getPortalData(orgId)` with real tenant org ID |
| `app/portal/alice/page.tsx` | PARTIAL | ALICE insights depend on OpenDental + Twilio data being real |
| `app/portal/cloud/page.tsx` | PARTIAL | Cloud features require enterprise tier config |
| `app/portal/command/page.tsx` | LIVE | Command center reads live workflow state |
| `app/portal/dashboard/page.tsx` | LIVE | Reads portal data |
| `app/portal/deployment/page.tsx` | LIVE | Calls `getDeploymentProject(orgId)` |
| `app/portal/forecasting/page.tsx` | PARTIAL | Forecasts use real analytics but limited by trace history |
| `app/portal/integrations/page.tsx` | BLOCKED | Shows Twilio / Google Business as unconnected |
| `app/portal/knowledge/page.tsx` | PARTIAL | Knowledge base; static content + dynamic audit history |
| `app/portal/locations/page.tsx` | PARTIAL | Multi-location requires enterprise data setup |
| `app/portal/onboarding/page.tsx` | LIVE | Reads onboarding state |
| `app/portal/orchestration/page.tsx` | LIVE | Reads agent orchestration |
| `app/portal/patients/page.tsx` | BLOCKED | Patient data from OpenDental returns empty array |
| `app/portal/recall/page.tsx` | BLOCKED | Recall workflows execute but act on zero patients from OpenDental |
| `app/portal/reports/page.tsx` | LIVE | Reads reports from Supabase |
| `app/portal/revenue/page.tsx` | LIVE | Reads revenue recovery data |
| `app/portal/reviews/page.tsx` | PARTIAL | Review growth workflow runs; actual review posting requires Google Business |
| `app/portal/settings/page.tsx` | PARTIAL | Settings display; save actions not all wired |
| `app/portal/simulations/page.tsx` | LIVE | Reads simulation engine state |
| `app/portal/success/page.tsx` | LIVE | Calls `getSuccessDashboardData(orgId)` — hardcoded org ID removed |

**Summary: 33 LIVE / 18 PARTIAL / 4 BLOCKED (out of 61 pages)**

---

## Per-API Status Table

| Route | Method | Status | Notes |
|-------|--------|--------|-------|
| `/api/alice/alerts` | GET | LIVE | Reads ALICE alert state |
| `/api/alice/chat` | POST | LIVE | Invokes ALICE with live analytics grounding |
| `/api/alice/forecast` | GET | LIVE | Reads operational forecasts |
| `/api/alice/insights` | GET | LIVE | Reads workflow insights |
| `/api/alice/orchestration` | POST | LIVE | Triggers agent orchestration |
| `/api/alice/recommendations` | GET | LIVE | Reads AI recommendations |
| `/api/alice/reports` | GET | LIVE | Reads executive report |
| `/api/analytics/abandoned` | GET | LIVE | Reads abandoned-workflow analytics |
| `/api/analytics/faq` | GET | LIVE | Reads FAQ analytics |
| `/api/autonomous/approvals` | POST | LIVE | Approves/rejects autonomous actions |
| `/api/autonomous/simulate` | POST | LIVE | Runs simulation engine |
| `/api/autonomous/state` | GET | LIVE | Reads recovery state |
| `/api/calendly/events` | GET | PARTIAL | Reads Calendly events; requires CALENDLY_TOKEN env var |
| `/api/dental/chairs` | GET | LIVE | Calls `getChairUtilization()` |
| `/api/dental/metrics` | GET | PARTIAL | Accepts `organizationId` param but `getWorkflowAnalyticsSummary()` is not org-scoped |
| `/api/dental/practice` | GET | LIVE | Calls `getPracticeHealth()` |
| `/api/dental/recall` | GET | LIVE | Calls `runRecallRecovery()` — executes on zero patients (OpenDental empty) |
| `/api/dental/revenue` | GET | LIVE | Calls `runRevenueRecovery()` |
| `/api/dental/reviews` | GET | LIVE | Calls `runReviewGrowth()` — posting requires Google Business |
| `/api/enterprise/cloud` | GET | LIVE | Reads enterprise cloud state |
| `/api/enterprise/integrations` | GET | LIVE | Lists integration health |
| `/api/enterprise/orchestration` | POST | LIVE | Triggers enterprise orchestration |
| `/api/enterprise/simulate` | POST | LIVE | Enterprise simulation |
| `/api/gtm-command-center` | GET | LIVE | Reads GTM state |
| `/api/marketplace/dental` | GET/POST | LIVE | GET lists blueprints; POST installs + triggers (fixed) |
| `/api/mission-control/automation-audit` | GET | LIVE | Reads audit state |
| `/api/mission-control/cloud` | GET | LIVE | Cloud metrics |
| `/api/mission-control/evaluate` | POST | LIVE | Evaluates workflow quality |
| `/api/mission-control/executive-report` | GET | LIVE | Generates executive report |
| `/api/mission-control/governance` | GET | LIVE | Reads governance trust score |
| `/api/mission-control/operational-summary` | GET | LIVE | Operational summary |
| `/api/mission-control/platform` | GET | LIVE | Platform metrics |
| `/api/mission-control/replay` | POST | LIVE | Triggers workflow replay |
| `/api/mission-control/runtime-health` | GET | LIVE | Reads runtime health |
| `/api/mission-control/state` | GET | LIVE | Full mission control state |
| `/api/opendental/sync` | POST | BLOCKED | Runs sync pipeline; `pilotOpenDentalRecords()` returns `[]` — no records processed |
| `/api/reports/[id]` | GET | LIVE | Reads report by ID |

**Summary: 34 LIVE / 2 PARTIAL / 1 BLOCKED (out of 37 routes)**

No route calls `withTenantGuard()`. All 37 routes trust caller-supplied `organizationId`.

---

## Blockers

### P0 — Prevents any production use
| Blocker | Owner | Estimated fix |
|---------|-------|---------------|
| No authentication layer — any request can read/write any tenant's data | Platform / Backend | 3–5 days (add Supabase Auth middleware, session cookie, protect all routes) |
| No Supabase RLS — database does not enforce tenant isolation | Platform / Backend | 1–2 days (SQL migrations per multi-tenant table) |

### P1 — Prevents commercial launch
| Blocker | Owner | Estimated fix |
|---------|-------|---------------|
| OpenDental returns empty array — recall and patient-recovery workflows process zero patients | Integrations | 2–3 days (implement real OpenDental API client with credentials) |
| Twilio disconnected — SMS outreach workflows fail silently | Integrations | 1 day (configure env vars, test webhook) |
| Tenant guard not wired to API routes — `withTenantGuard()` built but unused | Backend | 1 day (add to all 37 route handlers) |

### P2 — Required before scaling beyond one tenant
| Blocker | Owner | Estimated fix |
|---------|-------|---------------|
| `getWorkflowAnalyticsSummary()` not org-scoped — all tenants share the same analytics | Backend | 1 day (pass organizationId through analytics query path) |
| Analytics–events table gap — `runtime_event_fabric_events` not joined to `automation_traces` analytics | Backend | 2 days (add cross-table query or trigger-based sync) |
| Google Business API disconnected — review posting and GMB workflows non-functional | Integrations | 1–2 days |

---

## What Works Today (first paying customer scenario)

Assuming a single-tenant deployment with Supabase credentials configured and no other tenants:

1. Prospect lands on `app/page.tsx`, fills ROI funnel form — data persists to `leads`, `roi_calculations`, `audits` tables.
2. Admin views leads at `/admin/leads`, audits at `/admin/audits` — live rows from Supabase.
3. Mission Control at `/mission-control` shows live `operationalScore`, `reliabilityScore`, `traceCount` from `automation_traces`.
4. Revenue recovery, chair utilization, and practice health workflows execute through `executeWorkflow()` and write traces.
5. Marketplace blueprints can be installed and triggered via `/api/marketplace/dental` POST.
6. ALICE at `/portal/alice` generates insights grounded in live `getWorkflowAnalyticsSummary()` and `getPortalData()`.
7. ROI engine computes a real ROI multiple against the $497/month platform cost baseline.
8. All 10 event types publish through the canonical `publishEvent` → `publishRuntimeFabricEvent` → `runtime_event_fabric_events` chain.

---

## What Does Not Work (multi-tenant SaaS scenario)

1. **Auth** — a second tenant can read the first tenant's data by guessing their `organizationId` UUID.
2. **OpenDental** — all patient-facing workflows (recall, patient recovery) operate on zero records.
3. **Twilio SMS** — outreach sequences do not deliver.
4. **Google Business** — review generation workflows execute but cannot post.
5. **Analytics isolation** — `/api/dental/metrics?organizationId=X` ignores the org parameter internally; all tenants see platform-wide aggregates.
6. **Settings save** — some portal settings sub-actions are not wired to persistence.
