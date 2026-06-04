# Duplication Analysis Report

## Status: NO DUPLICATES FOUND IN REVIEWED FILES

**Date:** 2026-07-04

---

## Scope

Files reviewed: 5 of 8 specified (3 not found — see MVP2_ARCHITECTURE_CERTIFICATION.md)

---

## Intelligence Layer Duplication Check

### lib/alice/knowledge/index.ts

**Verdict: CLEAN ALICE EXTENSION** ✅

This file adds a knowledge registry to ALICE — it does not create a competing intelligence layer.

| Pattern | Present | Verdict |
|---------|---------|---------|
| New `ai_agents` table | ❌ | CLEAN |
| New AI chat/inference route | ❌ | CLEAN |
| New standalone recommendation engine | ❌ | CLEAN |
| Competing executive briefing system | ❌ | CLEAN |

The `aliceKnowledgeMap` maps 7 domains to existing canonical sources:
- `platform` → `lib/analytics-projector.ts`, `lib/patient-revenue-engine.ts`
- `mission_control` → `app/mission-control/page.tsx`
- `revenue` → `lib/roi.ts`, `lib/revenue-playbooks/index.ts`
- `workflow_governance` → `lib/workflow-os/*`
- `pms_operations` → `lib/pms-operations.ts`
- `rbac` → `middleware.ts`, `lib/auth-routing.ts`
- `tenant_isolation` → `lib/tenant/index.ts`

Every pointer is back to an existing canonical system. ALICE's knowledge is being enriched, not duplicated.

**Two domains marked `partial`:** `rbac` and `tenant_isolation` — these are correctly identified as requiring live environment validation before commercial launch. Honest certification status.

---

## Orchestration Layer Duplication Check

### lib/automation/registry.ts

**Verdict: BLUEPRINT CONFIG — NOT A RUNTIME** ⚠️ LEGACY FLAG

This file contains workflow blueprint definitions (`AutomationBlueprint[]`). It is **data, not an engine**.

| Pattern | Present | Verdict |
|---------|---------|---------|
| New execution engine | ❌ | CLEAN |
| New scheduler | ❌ | CLEAN |
| New retry mechanism | ❌ | CLEAN |
| New DLQ writer | ❌ | CLEAN |
| Competing `automation_traces` writer | ❌ | CLEAN |

**However:** This registry duplicates the intent of `lib/workflow-os/workflow-registry.ts` (canonical). Both define workflow blueprints. The `lib/automation/registry.ts` file:
- Was flagged as LEGACY in the Enterprise Convergence Report
- Has no confirmed active production callers
- Should be migrated to `lib/workflow-os/` in Phase 14

**Classification:** REDUNDANT (pre-existing finding, not a new MVP 2 introduction)

**Key observation:** Every blueprint in this registry includes `aliceGroundingSurfaces` — intelligence is correctly routed through ALICE, not a competing layer. The blueprints themselves are well-architected and extend canonical Patient Revenue Engine domains.

### types/automation.ts

**Verdict: CLEAN TYPE DEFINITIONS** ✅

Pure TypeScript types. `AutomationDomain` includes `"ai"` as a domain — this is appropriate since ALICE revenue and growth agents (`alice_revenue_opportunity_agent`, `alice_practice_health_agent`, `alice_growth_agent`) live in that domain. No runtime code. No competing system.

---

## Dashboard / Command Center Duplication Check

### components/internal/client-implementation-center.tsx

**Verdict: CLEAN INTERNAL PANEL** ✅

| Pattern | Present | Verdict |
|---------|---------|---------|
| New top-level app route | ❌ | CLEAN |
| New executive hub | ❌ | CLEAN |
| Competing Mission Control | ❌ | CLEAN |
| Standalone monitoring layer | ❌ | CLEAN |

Located in `components/internal/` — correctly placed as an internal operational panel. Sources exclusively from canonical `lib/client-implementation-os.ts`. Renders implementation pipeline data: in-progress count, average days to go-live, blocked clients, capacity, go-live success rate. This belongs in Mission Control and does not compete with it.

---

## Implementation OS Duplication Check

### lib/client-implementation-os.ts

**Verdict: CANONICAL — NO DUPLICATE** ✅

This IS the canonical Implementation OS. It defines:
- `ImplementationPhase` type (8 stages)
- `implementationBlueprints` (3 packages: revenue_recovery, ai_growth, managed_ai_operations)
- `implementationChecklistTemplates` (multi-phase checklists)
- `OperatingPlaybookTemplate` structures

No competing implementation OS was found in any other module.

---

## Revenue Engine Duplication Check

Blueprint domains in `lib/automation/registry.ts`:

| Domain | Extends Which Canonical System |
|--------|-------------------------------|
| `recall` | Patient Revenue Engine — recall_engine |
| `scheduling` | Patient Revenue Engine — no-show prevention |
| `billing` | Patient Revenue Engine — revenue recovery |
| `patient_followup` | Patient Revenue Engine — treatment acceptance |
| `reputation` | Patient Revenue Engine — review engine |
| `marketing` | Patient Revenue Engine — referral engine |
| `patient_influence` | Patient Revenue Engine — video journeys |
| `ai` | ALICE — revenue/growth/health agents |
| `mission_control` | Mission Control — ALICE follow-up |

**All domains extend existing canonical systems.** No competing revenue engine.

---

## Summary

| Layer | Duplicates Found | Notes |
|-------|-----------------|-------|
| Intelligence | ❌ NONE | ALICE knowledge extension only |
| Orchestration | ❌ NONE | Blueprint config, not runtime |
| Dashboard | ❌ NONE | Internal panel, not a hub |
| Revenue Engine | ❌ NONE | All domains extend PRE |
| Implementation | ❌ NONE | Canonical OS confirmed |
| Runtime | ⚠️ UNVERIFIED | Migration not found |

**Pre-existing legacy flag:** `lib/automation/registry.ts` is redundant alongside `lib/workflow-os/workflow-registry.ts` — Phase 14 consolidation item, not a new duplication introduced by MVP 2.
