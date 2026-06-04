# Security Audit Report

## Status: PASS ✅

**Date:** 2026-06-03

---

## Middleware Protection

**File:** `middleware.ts`

All authenticated routes are protected by middleware before any page renders.

### Protected UI Routes

```
/admin, /portal, /internal, /dashboard, /mission-control,
/workflow-os, /runtime-os, /automation-marketplace,
/automation-center, /settings, /onboarding,
/lead-operations, /client-operations, /gtm-command-center
```

### Protected API Routes

```
/api/alice/*, /api/autonomous/*, /api/enterprise/*,
/api/gtm-command-center/*, /api/mission-control/*, /api/opendental/*
```

### Authentication Gates (in order)

1. **Token validation** — `ZENITH_INTERNAL_TOKEN`, `ZENITH_PORTAL_TOKEN`, `ZENITH_ADMIN_TOKEN` checked via cookie or header
2. **Role-based access** — User role validated against allowed roles for route
3. **Client approval gating** — `zenith_client_approved` + `zenith_subscription_active` cookies required for client-facing routes
4. **Redirect:** Unapproved users → `/access-pending`

---

## Internal API Protection

| Route | Protection | Method |
|-------|-----------|--------|
| `/api/liz/action` | ✅ ZENITH_INTERNAL_TOKEN | Header check at line 47-50 |
| `/api/internal/certification/nightly` | ✅ ZENITH_INTERNAL_TOKEN | `isAuthorized()` function |
| `/api/internal/*` | ✅ Middleware | All internal routes gated |

---

## Row-Level Security

**Pattern:** All operational tables use `service_role_all` policy — only service role key (server-side) can access data. Client-side queries without service role key are rejected by Postgres.

**Tables with RLS enabled:**
- automation_traces, automation_trace_events, automation_dead_letters
- automation_blueprints, automation_audit_runs, automation_coverage_results
- operational_agents, agent_bus_messages, swarm_consensus_runs
- operational_digital_twins, infrastructure_awareness_snapshots
- runtime_event_fabric_events, recovery_orchestration_runs, tenant_onboarding_runs
- workflow_recovery_events, workflow_recovery_actions, workflow_recovery_metrics
- pms_integrations, organizations, organization_members
- opportunities, cta_events (Migration 20260627000000)

---

## IP Protection

The following internal systems are NOT exposed on the public website:
- ✅ Workflow OS — requires authentication, /workflow-os protected
- ✅ Event Fabric — no public API exposure
- ✅ Recovery Orchestrator — internal only
- ✅ Automation Registry — protected routes only
- ✅ Agent Architecture — no public exposure
- ✅ Database structure — no schema endpoints exposed publicly
- ✅ PMS Translation Layer — /api/opendental/* gated
- ✅ Internal AI Architecture — /api/alice/* protected

---

## Public Routes (No Auth Required)

These routes are intentionally public:

```
/ (homepage)
/api/analytics/cta (CTA tracking — anonymous)
/api/analytics/faq (FAQ tracking — anonymous)
/api/roi-assessment (assessment submission — anonymous lead capture)
/api/calendly/events (Calendly webhook — Calendly server calls this)
```

---

## No Self-Registration

The platform enforces:
- No automatic organization creation
- No automatic tenant creation
- No self-service signup flow that activates platform access
- Portal access requires: Contract Signed + Setup Fee Paid + Organization Approved + User Approved

---

## Result: PASS — All protected routes gated, RLS enabled on all operational tables, internal APIs token-protected, IP protection enforced
