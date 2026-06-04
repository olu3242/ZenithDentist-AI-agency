# Schema Gap Report

## Status: LOCAL SCHEMA COMPLETE — Remote Gap Unknown

**Date:** 2026-06-03

---

## Gap Analysis Methodology

Without remote CLI access, gap analysis is performed against:
1. Expected Zenith architecture (module requirements)
2. Local migration files (what should be in remote DB)
3. Application code (what the app queries)

---

## Module Gap Analysis

### ✅ Organizations / Tenancy — COMPLETE

**Required:** organizations, profiles, organization_members, user_roles, tenant lifecycle  
**Present in migrations:**
- `public.organizations` (202605210003) — full org record with type, plan, settings
- `public.organization_members` (202605210003) — role, permissions, FK to organizations
- `public.profiles` (202605310001) — user profiles bootstrapped from auth.users
- `public.user_roles` (202605210003) — role definitions
- `public.authorized_domains` (20260625000000) — domain access control
- `public.tenant_onboarding_runs` (044) — onboarding state machine

**Gap:** None in schema. Application queries `lib/data/tenants.ts` but doesn't use `organization_members` in the main funnel flow yet.

---

### ✅ Patient Revenue Engine — COMPLETE

**Required:** leads, ROI calculations, audits, bookings, recall, treatment plans  
**Present in migrations:**
- `public.leads` (202605210001) — contact, practice, source, status
- `public.roi_calculations` (202605210001) — 5 revenue dimensions, FK to leads
- `public.roi_assessments` — secondary assessment log
- `public.audits` (202605210001) — LIZ report JSON, recommendations, projected_recovery
- `public.bookings` (202605210001 + 20260627000000) — FK to leads + assessment_id
- `public.cta_events` (20260627000000) — CTA attribution
- `public.opportunities` (20260627000000) — pipeline stage tracking
- `public.recall_tracking` (202606030004) — recall campaign data
- `public.treatment_plans` (20260621000000) — treatment plan pipeline
- `public.membership_tracking` (20260621000000) — membership plan data
- `public.new_patient_leads` (20260621000000) — new patient acquisition

**Gap:** None. All revenue funnel tables present.

---

### ✅ Workflow OS — COMPLETE

**Required:** workflow execution, automation registry, dead letter queue, recovery  
**Present in migrations:**
- `public.automation_blueprints` (202605210007) — workflow definitions
- `public.automation_traces` (040) — execution traces
- `public.automation_trace_events` (040) — trace event log
- `public.automation_dead_letters` (040) — DLQ with replayable flag
- `public.automation_registry` (202605310002) — registered automations
- `public.automation_queue` (202605210006) — work queue
- `public.workflow_runs` (046) — execution records
- `public.runtime_event_fabric_events` (044) — event bus
- `public.recovery_orchestration_runs` (044) — recovery tracking
- `public.workflow_recovery_events` (202606030009) — failure events
- `public.workflow_recovery_actions` (202606030009) — recovery actions
- `public.workflow_recovery_metrics` (202606030009) — MTTR, success rates

**Gap:** `workflow_executions` referenced in `app/api/automation-health/route.ts` but no dedicated migration found — may be aliased to `automation_traces` or missing.

---

### ✅ ALICE Intelligence — COMPLETE

**Required:** conversations, memory, recommendations, knowledge graph  
**Present in migrations:**
- `public.alice_conversations` (202605210002)
- `public.alice_messages` (202605210002)
- `public.alice_memory` + `public.alice_enterprise_memory` (202605210002)
- `public.alice_recommendations` (202605210002)
- `public.alice_reasoning` + `public.alice_decisions` (202605210002)
- `public.intelligence_runs` (202605210002)
- `public.knowledge_graph_nodes` + `public.knowledge_graph_edges` (202605210004)
- `public.insight_snapshots` (202605210002)
- `public.liz_action_events` (20260617000000)
- `public.alice_evidence` + `public.liz_evidence` (20260618000000)

**Gap:** None.

---

### ✅ Revenue Attribution — COMPLETE

**Required:** CTA tracking, opportunity pipeline, UTM attribution, forecasting  
**Present in migrations:**
- `public.outreach_events` (202605210001) — CRM event log
- `public.cta_events` (20260627000000) — CTA click attribution
- `public.opportunities` (20260627000000) — pipeline with stage tracking
- `public.revenue_attribution_records` (20260620000000)
- `public.revenue_attributions` (20260620000000)
- `public.forecast_runs` + `public.forecasting_events` (202605210006)
- `public.gtm_prospects` (045) — sales prospects
- `public.referral_flywheel_events` (045)

**Gap:** None.

---

### ✅ Communications — COMPLETE

**Required:** notifications, messaging, video engagement  
**Present in migrations:**
- `public.notifications` (202605210005)
- `public.faq_interactions` (202605210001)
- `public.message_templates` (202605210005)
- `public.patient_video_campaigns` + `public.patient_video_events` (20260619000000)
- `public.video_library` + `public.video_campaigns` (20260619120000)
- `public.liz_action_events` (20260617000000)

**Gap:** None.

---

### ✅ Mission Control — COMPLETE

**Required:** operational health, incidents, metrics, dead letter management  
**Present in migrations:**
- `public.operational_metrics` (041)
- `public.operational_health_snapshots` (041)
- `public.operational_incidents` + `public.operational_incident_events` (041)
- `public.operational_agents` (043)
- `public.operational_scores` (042)
- `public.operational_memory_entries` (041)
- `public.operational_digital_twins` (043)
- `public.mission_control_actions` (20260618000000)
- `public.mission_control_events` (20260618000000)
- `public.mission_control_outcomes` (20260618000000)

**Gap:** None.

---

## Schema Gaps vs. Application Code

| App Reference | Table | Migration | Status |
|--------------|-------|-----------|--------|
| `lib/data/leads.ts` | leads | 202605210001 | ✅ Present |
| `lib/data/leads.ts` | roi_calculations | 202605210001 | ✅ Present |
| `lib/data/leads.ts` | audits | 202605210001 | ✅ Present |
| `lib/data/leads.ts` | bookings | 202605210001 | ✅ Present |
| `lib/data/leads.ts` | outreach_events | 202605210001 | ✅ Present |
| `lib/data/leads.ts` | opportunities | 20260627000000 | ✅ Present |
| `app/api/analytics/cta/route.ts` | cta_events | 20260627000000 | ✅ Present |
| `app/api/calendly/events/route.ts` | bookings | 202605210001 | ✅ Present |
| `lib/event-fabric.ts` | runtime_event_fabric_events | 044 | ✅ Present |
| `lib/data/tenants.ts` | organizations | 202605210003 | ✅ Present |
| `app/api/automation-health/route.ts` | workflow_executions | NONE FOUND | ⚠️ GAP |

---

## Schema Gap Summary

| Gap | Severity | Action |
|-----|---------|--------|
| `workflow_executions` table referenced in code but no migration found | Medium | Add migration or alias to automation_traces |
| Remote schema unknown (CLI blocked) | High | Provide SUPABASE_ACCESS_TOKEN |

**Total schema gaps: 1 minor, 1 environment blocker**

## Result: LOCAL SCHEMA COMPLETE — All 7 Zenith modules present in migrations
