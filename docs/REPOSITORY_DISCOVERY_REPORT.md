# Repository Discovery Report — PROS Sprint
**Generated:** 2026-06-01  
**Codebase:** /home/user/ZenithDentist-AI-agency  

---

## Existing Systems

### Core Platform lib/ Subsystems

| Subsystem | Files | Purpose |
|-----------|-------|---------|
| `lib/workflow-os/` | workflow-registry.ts, workflow-engine.ts, workflow-state-machine.ts, workflow-analytics.ts, workflow-replay.ts, workflow-router.ts, workflow-runtime.ts, workflow-scheduler.ts, workflow-versioning.ts + execution/ (7 files) | Canonical workflow execution OS |
| `lib/runtime/` | trace-engine.ts, replay-engine.ts, automation-health.ts, autonomous-recovery.ts, event-fabric.ts, governance.ts, incident-management.ts, instrumentation.ts, observability.ts, self-healing.ts, + 14 others | Runtime kernel, tracing, replay, observability |
| `lib/event-fabric/` | index.ts, replay.ts | Canonical event envelope and publish pipeline |
| `lib/revenue-engine/` | no-show-prevention.ts, treatment-acceptance.ts, chair-fill.ts, referral-engine.ts, index.ts | 4 of 6 dental revenue engines |
| `lib/dental-revenue-os/` | recall-recovery.ts, review-growth.ts, chair-utilization.ts, dental-events.ts, patient-recovery.ts, practice-health.ts, revenue-recovery.ts, index.ts | 2 revenue engines + dental event types |
| `lib/revenue-attribution/` | index.ts | 7-bucket attribution model |
| `lib/patient-journey/` | index.ts | 10-state patient lifecycle with transition mapping |
| `lib/integrations/pms/` | adapter.ts, registry.ts, sync-health.ts, dentrix-adapter.ts, eaglesoft-adapter.ts, open-dental-adapter.ts, denticon-adapter.ts | PMS adapter framework (4 providers) |
| `lib/onboarding/` | index.ts, bootstrap.ts, client-onboarding-engine.ts | Practice signup, org provisioning, step tracking |
| `lib/alice/agents/` | revenue-analyst.ts, operations-analyst.ts, patient-journey-analyst.ts, executive-advisor.ts | 4 ALICE AI agents |
| `lib/alice/` | commercial-intelligence.ts, operational-intelligence.ts | ALICE data aggregation layer |
| `lib/analytics/` | projector.ts | Event Fabric → trace → analytics projection |
| `lib/mission-control/` | index.ts, dental-revenue-center.ts, roi-intelligence-center.ts, sales-intelligence-center.ts | Mission Control aggregator |
| `lib/errors/` | index.ts, error-codes.ts, error-types.ts, error-registry.ts, api-wrapper.ts, self-healing.ts | 40+ error codes, self-healing infrastructure |
| `lib/alerting/` | index.ts | 6 alert categories, severity evaluation |
| `lib/monitoring/` | index.ts, error-dashboard.ts | Operational health dashboard |
| `lib/tenant/` | organization-provisioning.ts, tenant-enforcement.ts, tenant-guards.ts, tenant-resolver.ts, tenant-governance.ts, enterprise-control.ts, integration-registry.ts, index.ts | Multi-tenant isolation and provisioning |
| `lib/ai/` | provider.ts, runtime.ts, agents/index.ts, evals/index.ts, memory/index.ts, orchestrator/index.ts, workflows/index.ts | AI infrastructure |
| `lib/ai-os/` | alice.ts, alice-dental.ts, agent-coordinator.ts, agent-learning.ts, agent-governance.ts, agent-memory.ts, agent-observability.ts, agent-router.ts, agent-runtime.ts | AI OS layer |
| `lib/automation/` | registry.ts, runtime.ts | Automation blueprint registry + event emission |

---

## Canonical Systems

| Concern | Canonical Source | Notes |
|---------|-----------------|-------|
| Workflow execution | `lib/workflow-os/workflow-engine.ts::executeWorkflow()` | All automations MUST enter here |
| Event publishing | `lib/event-fabric/index.ts::publishEvent()` | Wraps `lib/runtime/event-fabric.ts::publishRuntimeFabricEvent()` |
| Runtime tracing | `lib/runtime/trace-engine.ts` | createTrace, appendTraceStage, completeTrace, failTrace, replayTrace |
| Revenue attribution | `lib/revenue-attribution/index.ts` | getWorkflowAttribution, getOrganizationRevenueSummary |
| PMS integration | `lib/integrations/pms/registry.ts::getPMSAdapter()` | Routes to Dentrix, Eaglesoft, Open Dental, Denticon |
| Patient lifecycle | `lib/patient-journey/index.ts` | 10 states, LIFECYCLE_TRANSITIONS, WORKFLOW_TRIGGERS |
| AI inference | `lib/ai/provider.ts::getIntelligenceProvider()` | LocalProvider → AnthropicProvider fallback chain |
| Onboarding | `lib/onboarding/index.ts` + `lib/onboarding/bootstrap.ts` | 7-step OnboardingStep enum |
| Organization provisioning | `lib/tenant/organization-provisioning.ts::provisionOrganization()` | 5-step provisioning |
| Mission Control | `lib/mission-control/index.ts::getMissionControlState()` | 21 concurrent data sources |

---

## Duplicate Systems

| Concern | Duplicate Files | Resolution |
|---------|----------------|-----------|
| Analytics projector | `lib/analytics-projector.ts` AND `lib/analytics/projector.ts` | `lib/analytics/projector.ts` is canonical (newer, server-only) |
| ALICE entry point | `lib/alice.ts` AND `lib/ai-os/alice.ts` AND `lib/ai-os/alice-dental.ts` | `lib/alice/agents/` directory is canonical for PROS sprint |
| Event replay | `lib/events/replay.ts` AND `lib/event-fabric/replay.ts` AND `lib/runtime/replay-engine.ts` | `lib/runtime/replay-engine.ts` is canonical |
| Automation runtime | `lib/automation/runtime.ts` AND `lib/workflow-os/workflow-engine.ts` | Both are used; workflow-engine wraps automation runtime |
| Revenue engine | `lib/revenue-engine/` AND `lib/dental-revenue-os/` | Both are active — recall-recovery and review-growth live in dental-revenue-os; no-show, chair-fill, treatment, referral in revenue-engine |

---

## Dead Code

- `lib/events/bus.ts`, `lib/events/contracts.ts`, `lib/events/emit.ts`, `lib/events/subscribe.ts` — superseded by `lib/event-fabric/`
- `lib/analytics-projector.ts` — superseded by `lib/analytics/projector.ts`
- `lib/alice.ts` — replaced by `lib/alice/agents/` directory
- `lib/roi.ts` — superseded by `lib/roi-os/`
- `lib/reports.ts` — superseded by agent-based reporting in `lib/alice/agents/`
- `lib/autonomous.ts` — replaced by `lib/runtime/autonomous-recovery.ts`

---

## Missing Systems (Added This Sprint)

The following systems were **added in the PROS sprint** (migration 202606010001 and 202606010002):

1. **patients table** — canonical patient master data with PMS sync linkage
2. **appointments table** — canonical appointment records with status tracking
3. **workflow_executions table** — links workflow runs to patients/appointments
4. **workflow_events table** — step-level event log per execution
5. **automation_retries table** — retry tracking with attempt counts and next-retry scheduling
6. **automation_execution_logs table** — structured log stream per execution
7. **workflow_revenue_attribution view** — end-to-end attribution: workflow → execution → revenue
8. **lib/revenue-attribution/index.ts** — getWorkflowAttribution() and getOrganizationRevenueSummary()
9. **lib/patient-journey/index.ts** — 10-state lifecycle with WORKFLOW_TRIGGERS mapping
10. **lib/integrations/pms/** — 4-provider adapter framework with sync health
11. **lib/onboarding/index.ts** — 7-step onboarding state machine
12. **lib/alice/agents/** — 4 specialized ALICE agents
13. **app/api/dental/** — 8 dental-specific API routes

---

## Recommended Canonical Systems

| Platform Concern | Canonical Module | Function |
|-----------------|-----------------|---------|
| Workflow execution | `lib/workflow-os/workflow-engine.ts` | `executeWorkflow()` |
| Event publishing | `lib/event-fabric/index.ts` | `publishEvent()` |
| Revenue attribution | `lib/revenue-attribution/index.ts` | `getWorkflowAttribution()` |
| Runtime tracing | `lib/runtime/trace-engine.ts` | `createTrace()` |
| PMS sync | `lib/integrations/pms/registry.ts` | `getPMSAdapter()` |
| AI inference | `lib/ai/provider.ts` | `getIntelligenceProvider()` |
| Patient lifecycle | `lib/patient-journey/index.ts` | `transitionPatientState()` |
| Mission Control | `lib/mission-control/index.ts` | `getMissionControlState()` |
| Tenant isolation | `lib/tenant/tenant-enforcement.ts` | RLS + guard enforcement |
| Observability | `lib/monitoring/index.ts` | `getOperationalHealthDashboard()` |
