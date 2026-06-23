# Agent OS — Pre-Build Audit of 10 Existing Systems

**Date:** 2026-06-23
**Branch:** feature/agent-os-foundation
**Method:** Code-verified, file:line cited. Conducted before any Agent OS code was written, per governance rule: "DO NOT duplicate existing capabilities. Extend and harmonize."

---

## 1. Runtime OS (execution tracing & instrumentation)

- `lib/runtime/instrumentation.ts` — `startRuntimeTrace` (9-41), `completeRuntimeTrace` (43-50), `failRuntimeTrace` (52-59)
- `lib/runtime/trace-engine.ts` — `createTrace` (51-82), `appendTraceStage` (84-98), `classifyFailure` (37-49)
- `lib/automation/runtime.ts` — `emitAutomationEvent` (20-57), `enqueueAutomationJob` (59-80), `captureAutomationFailure` (82-103) — **zero callers**, dormant parallel path (confirmed in Patient Ops audit)

**Already present:** correlation IDs, trace lifecycle (created→stages→completed/failed), idempotency keys, failure classification (`FailureCategory`), domain-scoped tracing.

## 2. Workflow OS (orchestration, registry, routing, SLA)

- `lib/workflow-os/workflow-engine.ts` — `executeWorkflow` (55-115), `publishWorkflowEvent` (122-138)
- `lib/workflow-os/workflow-registry.ts` — `getAllWorkflows`, `getWorkflow`, `assertWorkflowExists`
- `lib/workflow-os/workflow-router.ts` — `routeWorkflow` (44-59), `TRIGGER_MAP` (23-34)
- `lib/workflow-os/workflow-scheduler.ts` — `dispatchScheduledRun`, `getDefaultSchedulePlan`
- `lib/automation/registry.ts` — 38 `AutomationBlueprint`s across 13 domains (blueprint DATA, not a runtime)

**Already present:** workflow registration, trigger→workflow routing, SLA-aware dispatch, replayability flags, AI intervention hooks (`aliceGroundingSurfaces`), dependency tracking, state machine (`assertLegalTransition`).

## 3. Mission Control (executive dashboard hub)

- `app/mission-control/page.tsx` — 34 panels, reads via `getRuntimeHealthState`, `getOperationalMemoryState`, `getGovernanceState`, `getAutonomousRecoveryState`, `getOperationalMeshState`, `getOperationalCognitionState`, `getTenantIntelligenceState`, etc.
- Existing agent-relevant panels: `OperationalAgentGrid`, `AgentCommunicationBus`, `GovernanceCenter`, `OperationalMemoryPanel`, `IncidentTimeline`, `OperationalRecoveryOrchestrator`, `AuditTimeline`.

**Already present:** agent mesh visibility, agent communication bus UI, governance/approval visibility, operational memory panel, audit timeline — but all backed by **static/derived data**, not a live agent execution substrate.

## 4. ALICE implementation (operational intelligence)

- `lib/alice.ts` — `answerOperationalQuery`, `generateAliceInsights`, `generateAliceReport`, `coordinateEnterpriseIntelligence`
- `lib/alice/knowledge/index.ts` — `aliceKnowledgeMap` (13 domains), `getAliceKnowledgeHealth` (coverage scoring, certified/partial/requires_remediation)
- `app/api/alice/recommendations/route.ts` — queries `alice_recommendations` table, playbook fallback

**Already present:** knowledge domain registry, grounding-surface mapping, certification/coverage scoring, recommendation generation with revenue impact. ALICE is NOT a generic agent executor — it is a domain-bound intelligence/reporting layer.

## 5. LIZ implementation (public conversational AI)

- `lib/liz/advisor.ts` — `getLizAdvisorResponse`, `LizIntent` (9 values), `LizAction` (navigation/assessment/workflow/sales/support/enterprise)
- `lib/liz/knowledge.ts` — `buildLizKnowledgeBase` (product/workflow/automation catalogs + FAQ)
- `lib/liz/telemetry.ts` — `trackLizTelemetry`
- `app/api/liz/action/route.ts` — workflow actions gated by `ZENITH_INTERNAL_TOKEN`, calls `executeRegisteredAutomation`

**Already present:** intent classification, action routing with types, knowledge base, telemetry, single-hop workflow execution. **Gap:** no agent-to-agent delegation — LIZ routes directly to a workflowId, not to a named agent (MAX/IVY/FINN/etc., which don't exist yet).

## 6. Automation framework (registry, detectors, queue)

- `lib/automation/registry.ts` (blueprints), `lib/automation/detectors.ts` (5 cron detectors), `lib/automation-os/registry.ts` — `executeRegisteredAutomation` (193-244, the canonical execution bridge), `recordWorkflowExecutionEvidence` (246-274), `syncAutomationRegistry`.

**Already present:** detector pattern, registry status tracking, performance metrics, execution evidence recording, SLA-aware execution. This is the canonical entry point Agent OS execution MUST route through — never re-implement.

## 7. Event bus (Event Fabric)

- `lib/event-fabric.ts` — `publishEvent` (→ `runtime_event_fabric_events`), `publishFunnelEvent` (dual-write → `outreach_events` + `runtime_event_fabric_events`)

**Already present:** correlation_id threading, tenant/workflow scoping, fire-and-forget publishing, priority levels, channel separation. Agent OS events MUST publish through this, not a new bus.

## 8. Workflow execution engine (full chain)

Canonical chain (must not be duplicated):
```
executeRegisteredAutomation(workflowId)
  → startRuntimeTrace()
  → executeWorkflow() → emitAutomationEvent() → enqueueAutomationJob() → publishWorkflowEvent()
  → completeRuntimeTrace() / failRuntimeTrace()
  → recordWorkflowExecutionEvidence()
```
Idempotency via `automation_queue.idempotency_key`. Evidence in `workflow_execution_evidence` linked by `trace_id`.

## 9. Approval framework (governance)

- `lib/runtime/governance.ts` — `GovernanceRule` (policyType, riskThreshold, `approvalRequired` boolean), `GovernanceState` (pendingApprovals, trustScore), `appendAuditEvent` → `runtime_audit_timeline`
- `lib/autonomous.ts` — playbook `approvalFlow[]` (e.g. "Manager review", "Owner approval")

**Already present:** policy-based approval gating, audit trail with severity + correlation, trust scoring, sign-off paths. **Gap:** these gate *replay/recovery* candidates and static playbooks, not individual agent actions at the granularity Batch 8 needs (per-action auto-approve vs. approval-required).

## 10. Revenue attribution engine

- `lib/roi.ts` — `calculateRevenueProjection` (9 opportunity categories), `buildAuditRecommendations`
- `lib/revenue-attribution/index.ts` — `getWorkflowAttribution`, `getOrganizationRevenueSummary`, reads `revenue_recovery_events`, `recall_recovery_events`, `review_growth_events`, writes `revenue_attribution_records`
- `lib/automation/detectors.ts:detectRevenueLeaks` — `roi_calculations.recoverable_revenue > $10,000` threshold

**Already present:** opportunity scoring, workflow-level revenue attribution, recovery event tables, organization-level rollups. **Gap:** attribution is keyed by `workflowId`, not by `agentId` — Batch 7 must extend this model to add an agent dimension, not replace it.

---

## Net Conclusion

No existing system implements: a named agent registry, an agent router with capability/intent matching, agent-scoped memory, per-agent execution tracking, or LIZ→agent delegation. All 10 systems above are healthy, extensible, and must remain the substrate the new Agent OS layer sits on top of — see `AGENT_OS_ARCHITECTURE.md` for the integration design.
