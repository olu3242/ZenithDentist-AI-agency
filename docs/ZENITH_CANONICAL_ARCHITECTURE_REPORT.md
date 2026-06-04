# Zenith Canonical Architecture Report

## Status: ARCHITECTURE MAPPED — Consolidation Opportunities Identified

**Date:** 2026-06-03  
**Scope:** All 10 platform domains  
**Classification:** ACTIVE | DEPRECATED | REDUNDANT | ORPHANED

---

## Executive Summary

The Zenith platform spans 10 architectural domains across ~200+ source files. This report identifies the canonical (authoritative) implementation for each domain, classifies redundant and deprecated artifacts, and recommends a consolidation path to reduce complexity without breaking functionality.

**Key findings:**
- 3 overlapping Event Fabric implementations (consolidation needed)
- 2 overlapping Workflow Registry implementations
- 3 Mission Control entry points (1 canonical, 2 secondary)
- Legacy `lib/ai/` directory shadowed by canonical `lib/ai-os/`
- LIZ and ALICE are distinct systems (not duplicates) — both required

---

## Domain 1: Authentication

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `middleware.ts` | ✅ ACTIVE | Route gate — runs on every request |
| `lib/auth-routing.ts` | ✅ ACTIVE | Auth redirect logic |
| `lib/server-auth.ts` | ✅ ACTIVE | Server-side session helpers |
| `lib/supabase/server.ts` | ✅ ACTIVE | Service client factory |
| `lib/supabase/client.ts` | ✅ ACTIVE | Browser client factory |

### Protection Gates (IP-sensitive routes)
- `/api/liz/action` — requires `ZENITH_INTERNAL_TOKEN`
- `/api/internal/certification/nightly` — requires `ZENITH_INTERNAL_TOKEN`
- `/admin/*` — requires authenticated session
- `/mission-control/*` — requires authenticated session
- `/internal/*` — requires authenticated session

### Classification
No deprecated or redundant auth artifacts found. Auth layer is clean and well-bounded.

---

## Domain 2: Organizations / Tenancy

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/tenant-context/index.ts` | ✅ ACTIVE | Tenant context provider (canonical) |
| `lib/tenant.ts` | ✅ ACTIVE | Tenant helper functions |
| `lib/data/tenants.ts` | ✅ ACTIVE | Tenant data queries |
| `lib/tenant-registry.ts` | ✅ ACTIVE | Multi-tenant registry |

### Database Tables (canonical)
- `public.organizations` — org record with type, plan, settings
- `public.organization_members` — role assignments
- `public.profiles` — user profiles from auth.users
- `public.authorized_domains` — domain access control
- `public.tenant_onboarding_runs` — onboarding state

### IP Protection Note
Organization creation is gated: no self-registration, no automatic tenant creation. Portal access requires: Contract Signed + Setup Fee Paid + Organization Approved + User Approved.

---

## Domain 3: Commerce / Billing

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/commercial-os/index.ts` | ✅ ACTIVE | Canonical commerce engine |
| `lib/billing/index.ts` | ✅ ACTIVE | Billing operations |

### Database Tables
- `public.subscription_plans` — plan catalog
- `public.commercial_packages` — package definitions (overlaps with subscription_plans)
- `public.billing_customers` — customer billing records
- `public.contracts` — signed contracts
- `public.proposals` — sales proposals

### Consolidation Opportunity
`commercial_packages` and `subscription_plans` serve overlapping purposes. Medium-priority consolidation: standardize on `subscription_plans` as the canonical pricing catalog.

---

## Domain 4: Workflow OS

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/workflow-os/index.ts` | ✅ ACTIVE (CANONICAL) | Workflow OS entry point |
| `lib/workflow-os/workflow-engine.ts` | ✅ ACTIVE (CANONICAL) | Execution engine |
| `lib/workflow-os/state-machine.ts` | ✅ ACTIVE | State transitions |
| `lib/workflow-os/registry.ts` | ✅ ACTIVE | Workflow definitions |
| `lib/workflow-os/replay.ts` | ✅ ACTIVE | Event replay |
| `lib/workflow-os/versioning.ts` | ✅ ACTIVE | Schema versioning |

### Redundant Artifacts
| Artifact | Classification | Action |
|----------|---------------|--------|
| `lib/automation/registry.ts` | ⚠️ REDUNDANT | Overlaps with lib/workflow-os/registry.ts |
| `lib/automation-os/registry.ts` | ⚠️ REDUNDANT | Second automation registry |
| `lib/automation-os/index.ts` | ⚠️ REDUNDANT | Overlaps with lib/workflow-os/ |

### Recommendation
`lib/workflow-os/` is the canonical Workflow OS. `lib/automation/` and `lib/automation-os/` are legacy paths. Phase 13 candidate: consolidate all callers to `lib/workflow-os/`, delete automation registries.

### Schema Gap
`workflow_executions` referenced in `app/api/automation-health/route.ts` — no CREATE TABLE migration found. Likely aliased to `automation_traces`. **Action:** Add alias or migration.

---

## Domain 5: Event Fabric

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/runtime/event-fabric.ts` | ✅ ACTIVE | Low-level `publishRuntimeFabricEvent()` |
| `lib/event-fabric.ts` | ✅ ACTIVE | `publishEvent()` + `publishFunnelEvent()` |
| `lib/event-fabric/index.ts` | ⚠️ REDUNDANT | Second createEvent/publishEvent path |

### Three-Layer Architecture (Current)
```
Application code
      │
      ├── lib/event-fabric.ts         publishFunnelEvent() → outreach_events
      │                               publishEvent()       → dual-write
      │
      ├── lib/event-fabric/index.ts   createEvent()        → calls publishRuntimeFabricEvent()
      │
      └── lib/runtime/event-fabric.ts publishRuntimeFabricEvent() → runtime_event_fabric_events
```

### Consolidation Opportunity (HIGH PRIORITY)
Three overlapping implementations create confusion and risk of divergence. Recommended canonical hierarchy:

```
Application code
      │
      ├── lib/event-fabric.ts   publishFunnelEvent() → outreach_events (CRM)
      │                         publishEvent()       → runtime_event_fabric_events (telemetry)
      │
      └── (delete lib/event-fabric/index.ts — merge any unique logic into lib/event-fabric.ts)
```

`lib/runtime/event-fabric.ts` is the low-level write path and should remain. `lib/event-fabric/index.ts` should be merged into `lib/event-fabric.ts`.

### Published Events (all wired)
1. `assessment_started` — app/actions.ts (fire-and-forget)
2. `assessment_completed` — lib/data/leads.ts:createLeadFunnel
3. `audit_generated` — lib/data/leads.ts:createLeadFunnel
4. `opportunity_created` — lib/data/leads.ts:createLeadFunnel
5. `booking_created` — app/api/calendly/events/route.ts
6. `cta_clicked` — app/api/analytics/cta/route.ts
7. `faq_interaction` — app/api/analytics/faq/route.ts

---

## Domain 6: ALICE Intelligence

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/ai-os/alice.ts` | ✅ ACTIVE (CANONICAL) | ALICE OS entry point |
| `lib/alice.ts` | ✅ ACTIVE | ALICE core functions |
| `lib/alice/executive-briefing.ts` | ✅ ACTIVE | Executive briefings |
| `lib/alice/knowledge-evolution.ts` | ✅ ACTIVE | Knowledge versioning |
| `app/api/alice/*` | ✅ ACTIVE | 10 ALICE API routes |

### Redundant Artifacts
| Artifact | Classification | Action |
|----------|---------------|--------|
| `lib/ai/` directory | ⚠️ DEPRECATED | Legacy AI layer; `lib/ai-os/` is canonical |

### Recommendation
`lib/ai/` is the legacy AI implementation. `lib/ai-os/` is the canonical AI OS. Audit all imports of `lib/ai/*` and migrate to `lib/ai-os/`. Delete `lib/ai/` in Phase 13.

### LIZ vs ALICE Distinction (IMPORTANT)
These are NOT duplicates — they serve different concerns:

| System | Layer | Purpose | Visibility |
|--------|-------|---------|-----------|
| **ALICE** | Internal operational AI | Intelligence, recommendations, memory, decisions | Internal only (never public-facing) |
| **LIZ** | Customer-facing advisor | Marketing widget, patient engagement, public chat | Public (marketing tool) |

Both systems are required. LIZ is the public face; ALICE is the operational brain.

---

## Domain 7: Revenue Engine / Patient Revenue

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/roi.ts` | ✅ ACTIVE | ROI calculation engine |
| `lib/data/leads.ts` | ✅ ACTIVE | Lead/funnel data layer |
| `app/actions.ts` | ✅ ACTIVE | Assessment server action |
| `app/api/roi-assessment/route.ts` | ✅ ACTIVE | Assessment API endpoint |
| `app/api/calendly/events/route.ts` | ✅ ACTIVE | Booking webhook |
| `app/api/audit/[id]/download/route.ts` | ✅ ACTIVE | Audit download |

### Revenue Funnel (end-to-end)
```
CTA click
  → POST /api/analytics/cta → cta_events
  → Assessment form → app/actions.ts → assessment_started event
  → createLeadFunnel() → leads + roi_calculations + audits + outreach_events + opportunities
  → Calendly webhook → bookings → leads.status = "booked" → opportunities.stage = "booking_created"
  → Admin dashboard → 9 metrics from real Supabase queries
```

### Database Tables (canonical)
- `public.leads` — contact + practice + source + status
- `public.roi_calculations` — 5 revenue dimensions
- `public.audits` — LIZ report JSON + recommendations
- `public.bookings` — linked to lead_id + assessment_id
- `public.cta_events` — CTA attribution
- `public.opportunities` — pipeline stage tracking
- `public.outreach_events` — CRM event log

---

## Domain 8: PMS / Integration OS

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/pms.ts` | ✅ ACTIVE | PMS core adapter |
| `lib/integration-os/pms-intelligence.ts` | ✅ ACTIVE | PMS intelligence layer |
| `lib/integration-os/index.ts` | ✅ ACTIVE | Integration OS entry |
| `lib/adapters/` | ✅ ACTIVE | PMS system adapters |

### IP Protection Note
PMS Translation Layer, Integration Catalogs, Schema Mapping, and Database Structures are proprietary IP and must never be exposed publicly.

---

## Domain 9: Communications

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `lib/email.ts` | ✅ ACTIVE | Email delivery (Resend) |
| `lib/communication-hub/index.ts` | ✅ ACTIVE | Unified communications |
| `lib/adapters/` | ✅ ACTIVE | Channel adapters (email, SMS, video) |
| `lib/video-engagement-os.ts` | ✅ ACTIVE | Video journey engine |
| `lib/video-intelligence.ts` | ✅ ACTIVE | Video personalization |

### Database Tables
- `public.notifications` — all outbound notifications
- `public.message_templates` — templated messages
- `public.patient_video_campaigns` — video campaigns
- `public.video_library` + `public.video_campaigns` — video assets

---

## Domain 10: Mission Control

### Canonical Sources
| Artifact | Classification | Role |
|----------|---------------|------|
| `app/mission-control/page.tsx` | ✅ ACTIVE (CANONICAL) | Primary — 30+ operational panels |
| `app/admin/page.tsx` | ✅ ACTIVE (SEPARATE) | CRM/revenue focus — different concern |

### Secondary Entry Points (review needed)
| Artifact | Classification | Action |
|----------|---------------|--------|
| `app/dashboard/mission-control/` | ⚠️ REVIEW | Potential duplicate of app/mission-control/ |
| `app/internal/mission-control/` | ⚠️ REVIEW | Potential duplicate of app/mission-control/ |

### Recommendation
Audit whether `app/dashboard/mission-control/` and `app/internal/mission-control/` render the same content as `app/mission-control/`. If so, redirect to canonical URL and mark as DEPRECATED.

### Admin vs Mission Control Distinction
These serve different audiences and are NOT duplicates:

| Panel | Audience | Content |
|-------|---------|--------|
| `/admin` | CRM operators | Leads, revenue, bookings, pipeline |
| `/mission-control` | Platform operators | Operational health, incidents, workflow, ALICE |

---

## Canonical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC SURFACE                                │
│  Landing page  │  ROI Assessment  │  LIZ Widget (marketing)     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ (no IP exposed)
┌──────────────────────────▼──────────────────────────────────────┐
│                    MIDDLEWARE GATE                               │
│  middleware.ts → lib/auth-routing.ts → lib/server-auth.ts       │
│  ZENITH_INTERNAL_TOKEN (LIZ action + nightly cert)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                  │
│  Revenue Funnel          │  Internal Ops                         │
│  ─────────────────       │  ──────────────────────────────────  │
│  app/actions.ts          │  app/admin/page.tsx (CRM)            │
│  /api/roi-assessment     │  app/mission-control/ (OPS)          │
│  /api/calendly/events    │  app/api/alice/*                     │
│  /api/audit/[id]/dl      │  app/api/automation-health           │
│  /api/analytics/cta      │  app/api/liz/action (internal token) │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    LIBRARY LAYER (CANONICAL)                     │
│                                                                  │
│  lib/roi.ts              Revenue calculations                    │
│  lib/data/leads.ts       Lead funnel data layer                  │
│  lib/event-fabric.ts     Event publishing (CRM + telemetry)      │
│  lib/workflow-os/        Workflow execution engine               │
│  lib/ai-os/alice.ts      ALICE intelligence OS                   │
│  lib/commercial-os/      Commerce + billing                      │
│  lib/digital-twin/       Digital twin simulations                │
│  lib/communication-hub/  Unified communications                  │
│  lib/video-engagement-os Smart video journeys                    │
│  lib/tenant-context/     Multi-tenancy                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    DATA LAYER (Supabase)                         │
│                                                                  │
│  Revenue: leads, roi_calculations, audits, bookings              │
│           cta_events, opportunities, outreach_events             │
│  Workflow: automation_traces, automation_blueprints, DLQ         │
│  ALICE:   alice_conversations, alice_memory, liz_action_events   │
│  Org:     organizations, profiles, organization_members          │
│  Ops:     operational_metrics, mission_control_events            │
│  Video:   patient_video_campaigns, video_library                 │
│                                                                  │
│  RLS: service_role_all on all operational tables                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Artifact Classification Summary

### ✅ ACTIVE (Canonical — do not modify without review)
- `middleware.ts`, `lib/auth-routing.ts`, `lib/server-auth.ts`
- `lib/workflow-os/` (all 6 modules)
- `lib/event-fabric.ts` + `lib/runtime/event-fabric.ts`
- `lib/ai-os/alice.ts`, `lib/alice.ts`
- `lib/roi.ts`, `lib/data/leads.ts`, `app/actions.ts`
- `lib/tenant-context/`, `lib/tenant.ts`
- `lib/commercial-os/`, `lib/digital-twin/`
- `app/mission-control/page.tsx`
- `app/admin/page.tsx`
- All 39 migration files in `supabase/migrations/`

### ⚠️ REDUNDANT (functional but overlapping — consolidation candidates)
- `lib/event-fabric/index.ts` — merge into `lib/event-fabric.ts`
- `lib/automation/registry.ts` — consolidate into `lib/workflow-os/registry.ts`
- `lib/automation-os/registry.ts` — consolidate into `lib/workflow-os/registry.ts`
- `lib/automation-os/index.ts` — consolidate into `lib/workflow-os/`
- `commercial_packages` DB table — consider merging with `subscription_plans`
- `app/dashboard/mission-control/` — review vs. `app/mission-control/`
- `app/internal/mission-control/` — review vs. `app/mission-control/`

### ❌ DEPRECATED (legacy — Phase 13 removal candidates)
- `lib/ai/` directory — fully superseded by `lib/ai-os/`

### ❓ ORPHANED (gap — needs resolution)
- `workflow_executions` table reference in `app/api/automation-health/route.ts` — no migration found; likely alias to `automation_traces`

---

## Consolidation Roadmap

### Phase 13 — High Priority
1. **Event Fabric unification** — merge `lib/event-fabric/index.ts` into `lib/event-fabric.ts`; update all imports
2. **Workflow registry consolidation** — migrate `lib/automation/registry.ts` callers to `lib/workflow-os/registry.ts`; delete legacy files
3. **Legacy AI removal** — audit all `lib/ai/` imports; migrate to `lib/ai-os/`; delete `lib/ai/`

### Phase 13 — Medium Priority
4. **workflow_executions gap** — add `CREATE TABLE IF NOT EXISTS public.workflow_executions` migration or update `automation-health` route
5. **Mission Control route audit** — verify dashboard/internal mission-control routes; redirect duplicates
6. **Commerce table consolidation** — merge `commercial_packages` into `subscription_plans`

### Phase 14 — Low Priority
7. **Automation-os directory cleanup** — remove `lib/automation-os/` after callers migrated
8. **`lib/automation/` directory cleanup** — remove after registry migration

---

## IP Protection Architecture

The following domains are proprietary and must never be exposed via public routes or rendered in public pages:

| Domain | Protected Artifacts | Enforcement |
|--------|-------------------|-------------|
| Workflow OS | lib/workflow-os/, DLQ, recovery | Auth gate on all /internal routes |
| Event Fabric | lib/event-fabric.ts, runtime_event_fabric_events | Server-side only, never in client bundles |
| ALICE | lib/ai-os/, lib/alice/, alice_* tables | /api/alice/* routes require auth |
| PMS Translation | lib/pms.ts, lib/integration-os/ | Never rendered client-side |
| Automation Blueprints | automation_blueprints, automation_traces | Service role only |
| Internal Governance | /api/internal/*, /api/liz/action | ZENITH_INTERNAL_TOKEN required |

---

## Result: ARCHITECTURE MAPPED

- **10 domains documented** with canonical source identified
- **3 redundancy clusters** identified for consolidation
- **1 deprecated directory** (`lib/ai/`) flagged for removal
- **1 schema gap** (`workflow_executions`) documented
- **IP protection boundaries** confirmed across all domains
- **LIZ/ALICE distinction** preserved — both systems required

**Next:** Implement Phase 13 consolidations to reduce technical debt without breaking production functionality.
