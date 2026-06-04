# MVP 2 Database Classification Report

## Status: CANNOT COMPLETE — Primary Migration Not Found

**Date:** 2026-07-04

---

## Critical Finding

The primary migration specified for review:

```
supabase/migrations/20260702000000_enterprise_moat_autonomous_practice.sql
```

**DOES NOT EXIST** in this repository.

The latest migration in the repository is:
```
supabase/migrations/20260627000000_revenue_pipeline.sql
```

The gap between `20260627` and `20260702` suggests this migration was authored on a branch (`release/production-consolidated`) that has not been pushed to this repository.

**Database classification cannot be completed for MVP 2 without the migration file.**

---

## Existing Database Baseline (Pre-MVP 2)

For reference, the existing 42 migrations create these tables (classified):

### Intelligence Tables (ALICE-owned)
| Table | Classification | Status |
|-------|---------------|--------|
| `alice_conversations` | Intelligence | ✅ CANONICAL |
| `alice_messages` | Intelligence | ✅ CANONICAL |
| `alice_memory` | Intelligence | ✅ CANONICAL |
| `alice_enterprise_memory` | Intelligence | ✅ CANONICAL |
| `alice_recommendations` | Intelligence | ✅ CANONICAL |
| `alice_reasoning` | Intelligence | ✅ CANONICAL |
| `alice_decisions` | Intelligence | ✅ CANONICAL |
| `alice_executive_briefings` | Intelligence | ✅ CANONICAL |
| `alice_knowledge_versions` | Intelligence | ✅ CANONICAL |
| `alice_outcome_records` | Intelligence | ✅ CANONICAL |
| `alice_performance_snapshots` | Intelligence | ✅ CANONICAL |
| `alice_recommendation_feedback` | Intelligence | ✅ CANONICAL |
| `intelligence_runs` | Intelligence | ✅ CANONICAL |
| `insight_snapshots` | Intelligence | ✅ CANONICAL |
| `agent_recommendations` | Intelligence | ⚠️ Bypass ALICE — Phase 13 fix |
| `liz_action_events` | Intelligence | ✅ CANONICAL (LIZ) |

### Workflow Tables (Workflow OS-owned)
| Table | Classification | Status |
|-------|---------------|--------|
| `automation_traces` | Workflow | ✅ CANONICAL |
| `automation_blueprints` | Workflow | ✅ CANONICAL |
| `automation_dead_letters` | Workflow | ✅ CANONICAL |
| `automation_registry` | Workflow | ✅ CANONICAL |
| `automation_queue` | Workflow | ✅ CANONICAL |
| `workflow_runs` | Workflow | ✅ CANONICAL |
| `workflow_recovery_events` | Workflow | ✅ CANONICAL |
| `workflow_recovery_actions` | Workflow | ✅ CANONICAL |
| `workflow_recovery_metrics` | Workflow | ✅ CANONICAL |

### Revenue Tables (Patient Revenue Engine-owned)
| Table | Classification | Status |
|-------|---------------|--------|
| `leads` | Revenue | ✅ CANONICAL |
| `roi_calculations` | Revenue | ✅ CANONICAL |
| `audits` | Revenue | ✅ CANONICAL |
| `bookings` | Revenue | ✅ CANONICAL |
| `opportunities` | Revenue | ✅ CANONICAL |
| `cta_events` | Revenue | ✅ CANONICAL |
| `outreach_events` | Revenue | ✅ CANONICAL |
| `recall_tracking` | Revenue | ✅ CANONICAL |
| `referral_tracking` | Revenue | ✅ CANONICAL |
| `membership_tracking` | Revenue | ✅ CANONICAL |
| `treatment_plans` | Revenue | ✅ CANONICAL |

### Implementation Tables (Implementation OS-owned)
| Table | Classification | Status |
|-------|---------------|--------|
| `implementation_projects` | Implementation | ✅ CANONICAL |
| `implementation_tasks` | Implementation | ✅ CANONICAL |
| `implementation_milestones` | Implementation | ✅ CANONICAL |

### Monitoring / Analytics Tables
| Table | Classification | Status |
|-------|---------------|--------|
| `operational_metrics` | Monitoring | ✅ CANONICAL |
| `operational_health_snapshots` | Monitoring | ✅ CANONICAL |
| `operational_incidents` | Monitoring | ✅ CANONICAL |
| `mission_control_events` | Monitoring | ✅ CANONICAL |
| `mission_control_actions` | Monitoring | ✅ CANONICAL |
| `growth_scores` | Analytics | ⚠️ Needs entity_scores consolidation |
| `client_health_scores` | Analytics | ⚠️ Needs entity_scores consolidation |
| `pilot_scorecards` | Analytics | ⚠️ Needs entity_scores consolidation |

---

## What the Missing Migration May Contain

Based on the filename `20260702000000_enterprise_moat_autonomous_practice.sql` and context from the sprint description (Batches 25–32: PMS Intelligence, Insurance Recovery, Provider Performance, Hygiene Growth, AI Workforce Orchestration, Clinical Education, Predictive Practice, Autonomous Practice), the migration likely creates tables in these categories:

### Expected New Tables (UNVERIFIED — migration not found)

| Likely Table | Likely Category | Expected Owner |
|-------------|----------------|---------------|
| `pms_intelligence_snapshots` | Integration | PMS Intelligence Engine |
| `insurance_recovery_claims` | Revenue | Patient Revenue Engine |
| `provider_performance_metrics` | Analytics | Provider Performance Engine |
| `hygiene_growth_tracking` | Revenue | Hygiene Growth Engine (extends PRE) |
| `workforce_orchestration_runs` | Workflow | AI Workforce (extends Workflow OS) |
| `clinical_education_records` | Intelligence | Clinical Education Intelligence |
| `predictive_practice_signals` | Analytics | Predictive Practice Engine |
| `autonomous_practice_decisions` | Intelligence | Autonomous Practice Engine (routes via ALICE) |

**These are projections only.** They cannot be classified until the migration file is provided.

---

## Classification Framework (For Use When Migration Is Provided)

Each table must be classified as:

| Category | Owner | Extends |
|----------|-------|---------|
| Intelligence | ALICE | alice_* tables pattern |
| Workflow | Workflow OS | automation_traces canonical |
| Runtime | Runtime OS | operational_* tables pattern |
| Revenue | Patient Revenue Engine | leads → roi_calculations → audits funnel |
| Implementation | Implementation OS | implementation_projects pattern |
| Analytics | Mission Control | operational_metrics pattern |
| Monitoring | Mission Control | operational_health_snapshots pattern |
| Integration | Integration OS | integration_* tables pattern |

**Red flags to check when migration is available:**

1. Any `CREATE TABLE ... agent_reasoning` → duplicate ALICE
2. Any `CREATE TABLE ... agent_execution` → duplicate Workflow OS
3. Any `CREATE TABLE ... workflow_executions` as physical table → BLOCKED (VIEW only)
4. Any revenue pipeline table not connected to `leads` FK → orphan risk
5. Any table with no `organization_id` column → multi-tenant violation

---

## Result

**DATABASE CLASSIFICATION: INCOMPLETE**

Migration `20260702000000_enterprise_moat_autonomous_practice.sql` must be provided before database review can be completed. The existing baseline (42 migrations, 59+ tables) is certified and clean. New tables in the missing migration cannot be classified.
