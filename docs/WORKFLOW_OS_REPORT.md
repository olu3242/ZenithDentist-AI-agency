<<<<<<< HEAD
# Automation Platform Report — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Source:** `lib/workflow-os/`

---

## Registry

**File:** `lib/workflow-os/workflow-registry.ts`

The registry wraps the automation blueprint registry (`lib/automation/registry.ts`) and adds Automation Platform metadata.

Key functions:
- `getAllWorkflows()` — returns all registered workflows as `WorkflowDefinition[]`
- `getWorkflow(id)` — single workflow lookup
- `getWorkflowsByDomain(domain)` — filter by domain (e.g. "dental", "patient_journey")
- `getActiveWorkflows()` — returns only `status === "active"` workflows
- `assertWorkflowExists(id)` — throws `WF_NOT_FOUND` if missing

Each `WorkflowDefinition` includes:
- `id`, `name`, `domain`, `description`, `version`
- `slaMinutes` (from blueprint.slaMinutes ?? 60)
- `replayable` (from blueprint.replayRequired)
- `aiInterventionEnabled` (always true)
- `tags: [domain, "dental", "automation"]`

---

## Engine

**File:** `lib/workflow-os/workflow-engine.ts`

`executeWorkflow(req: WorkflowExecutionRequest): Promise<WorkflowExecutionResult>` is the **single authoritative entry point** for all automation execution. No direct automation execution is permitted outside this function.

Execution flow:
1. `assertWorkflowExists(req.workflowId)` — registry validation
2. State machine: `registered → executing` (internal queued transition enforced)
3. `resolveEffectiveSla(workflow)` — SLA minutes from versioning
4. Idempotency check via `idempotencyKey` (prevents duplicate execution)
5. `emitAutomationEvent()` — writes to `automation_events` table
6. `publishEvent()` — fires to Event Fabric
7. Returns `WorkflowExecutionResult` with `executionId`, `state`, `slaMinutes`, `startedAt`

```typescript
interface WorkflowExecutionRequest {
  workflowId: string;
  organizationId: string;
  triggerName: string;
  actionName: string;
  correlationId?: string;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
  initiatedBy?: "system" | "alice" | "operator" | "scheduler";
}
=======
# Automation Platform Report
**ZenithDentist AI — Automation Platform Canonical Automation Brain — Phase 12**
**Date:** 2026-06-03 | **Platform Version:** 12.0.0

---

## 1. Overview

Automation Platform is the **canonical automation brain** of the ZenithDentist AI platform. Every automated patient communication, journey orchestration, trigger evaluation, A/B test, and ROI calculation runs through Automation Platform. No other system implements its own automation engine — all automation capabilities are provided by Automation Platform.

Phase 12 extended Automation Platform with the Workflow Recovery layer (`lib/workflow-recovery/`), which adds self-healing capabilities on top of the existing `health-monitor.ts` and `recovery-engine.ts` modules.

---

## 2. Architecture

```
lib/workflow-os/ (11 files — canonical automation brain)
  ├── index.ts              ← Main entry point, journey orchestration
  ├── journey-engine.ts     ← 7 canonical patient journey implementations
  ├── health-monitor.ts     ← Workflow health scoring
  ├── recovery-engine.ts    ← Base recovery actions
  ├── event-publisher.ts    ← Event Fabric integration
  ├── metrics-collector.ts  ← Performance metrics aggregation
  ├── ab-testing.ts         ← A/B test engine for content optimization
  ├── personalization.ts    ← Patient segment personalization
  ├── analytics.ts          ← Journey analytics + reporting
  ├── automation-triggers.ts← Trigger evaluation + scheduling
  └── roi-calculator.ts     ← ROI calculation per journey type

        ↓ extended by (Phase 12)

lib/workflow-recovery/index.ts
  ← Adds recovery events, actions, metrics tables
  ← Extends health-monitor.ts with stability + reliability scoring
  ← Extends recovery-engine.ts with automated recovery actions
>>>>>>> backup/pre-consolidation
```

---

<<<<<<< HEAD
## State Machine

**File:** `lib/workflow-os/workflow-state-machine.ts`

11 lifecycle states with explicit legal transition table:

```
registered → scheduled → queued → executing → waiting → paused
                                            ↘ completed
                                            ↘ failed → replayed
                                            ↘ escalated → executing
completed → replayed
cancelled (terminal)
```

| State | Category |
|-------|----------|
| `registered`, `scheduled`, `queued` | Pre-execution |
| `executing`, `waiting`, `paused` | Active (`isActiveState()`) |
| `completed`, `cancelled` | Terminal (`isTerminalState()`) |
| `failed`, `escalated` | Recoverable (`isRecoverableState()`) |
| `replayed` | Recovery path |

Functions:
- `isLegalTransition(from, to): boolean`
- `assertLegalTransition(from, to): void` — throws on illegal transition
- `mapAutomationStatusToLifecycle(status)` — maps DB status strings

---

## Execution Kernel (7 Modules)

**Directory:** `lib/workflow-os/execution/`

| Module | File | Responsibility |
|--------|------|---------------|
| Engine (public API) | `execution-engine.ts` | Re-exports all 6 internal modules |
| Coordinator | `execution-coordinator.ts` | Orchestrates: schedule → dispatch → observe → persist |
| Scheduler | `execution-scheduler.ts` | `scheduleWorkflow()`, ScheduleMode selection |
| Dispatcher | `execution-dispatcher.ts` | `dispatchExecution()`, routes to runtime |
| Context | `execution-context.ts` | `createExecutionContext()`, `startExecution()`, `completeExecution()` |
| Observability | `execution-observability.ts` | `emitExecutionEvent()`, `measureDuration()` |
| Persistence | `execution-persistence.ts` | `persistExecutionStart/Complete/Failure()` → `workflow_executions` table |

---

## SLA Resolution

**File:** `lib/workflow-os/workflow-versioning.ts`

`resolveEffectiveSla(workflow): number` returns the SLA in minutes for a workflow version. Default fallback is 60 minutes. SLA breaches are tracked in `lib/runtime/automation-health.ts` via `slaBreaches: AutomationTrace[]` in `RuntimeHealthState`.

---

## Replay Support

**File:** `lib/workflow-os/workflow-replay.ts`

Replay is gated by `workflow.replayable` (maps from `blueprint.replayRequired`). The execution path for replay:
1. `getReplayCenterState()` → `lib/runtime/replay-engine.ts`
2. Confidence scoring per candidate (0–1)
3. `replayTrace(traceId)` → `lib/runtime/trace-engine.ts`
4. State transition: `failed → replayed → executing`

---

## Database Tables (from migration 202606010001)

| Table | Purpose |
|-------|---------|
| `workflow_executions` | Links workflowId + organizationId + patientId + appointmentId + status |
| `workflow_events` | Step-level events per execution (execution_id FK) |
| `automation_retries` | Retry tracking: attempt_number, status, failure_reason, next_retry_at |
| `automation_execution_logs` | Structured log stream: level (debug/info/warn/error), message, context |

All 4 tables have:
- `organization_id` RLS isolation policy
- `idx_*_org` index for tenant-scoped queries
- `idx_*_created` descending index for time-range queries

---

## Readiness Score: 88/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Registry completeness | 90 | getAllWorkflows, getWorkflowsByDomain implemented |
| Engine correctness | 90 | executeWorkflow() enforces state machine |
| State machine | 95 | 11 states, all transitions explicit, assertLegalTransition() |
| Execution kernel | 85 | 7 modules, full schedule→dispatch→persist chain |
| SLA tracking | 80 | resolveEffectiveSla() + slaBreaches in RuntimeHealthState |
| Replay support | 80 | ReplayCenter + replayTrace() wired |
| DB persistence | 95 | workflow_executions + workflow_events + retries + logs |

**Gap:** The execution kernel's `persistExecutionStart/Complete/Failure()` writes to `workflow_executions`, but the `workflow_events` table is not yet written to in every step transition — step-level event granularity is partial.
=======
## 3. lib/workflow-os/ — 11-File Function Inventory

### index.ts
| Function | Purpose |
|---|---|
| initiateJourney | Starts a patient journey of specified type |
| pauseJourney | Pauses an active journey |
| resumeJourney | Resumes a paused journey |
| completeJourney | Marks journey complete, fires completion event |
| getActiveJourneys | Returns all active journeys for a practice |
| getJourneyStatus | Returns current step and status for a journey |

### journey-engine.ts
| Function | Purpose |
|---|---|
| executeAppointmentJourney | Appointment prep + post-visit follow-up |
| executePostVisitJourney | Treatment summary + next steps |
| executeReviewJourney | Personalized review request sequence |
| executeReferralJourney | Referral video + incentive delivery |
| executeRecallJourney | Recall outreach for lapsed patients |
| executeTreatmentJourney | Treatment education video series |
| executeRecoveryJourney | Post-procedure check-in sequence |
| getNextJourneyStep | Determines next step based on patient response |
| evaluateJourneyBranch | A/B test-aware branching logic |

### health-monitor.ts
| Function | Purpose |
|---|---|
| getWorkflowHealth | Returns health score (0–100) for all workflows |
| getJourneyHealthScore | Per-journey-type health score |
| detectUnhealthyWorkflows | Returns list of workflows below health threshold |
| calculateFailureRate | Failure rate over configurable time window |
| getHealthTrend | Health score trend over past N days |

### recovery-engine.ts
| Function | Purpose |
|---|---|
| triggerRecovery | Initiates recovery for a failed workflow |
| executeRecoveryAction | Executes a specific recovery action type |
| validateRecovery | Post-recovery validation check |
| getRecoveryHistory | Returns past recovery events for a workflow |

### event-publisher.ts
| Function | Purpose |
|---|---|
| publishJourneyEvent | Publishes journey step events to Event Fabric |
| publishWorkflowAlert | Publishes health alerts to Event Fabric |
| publishROIEvent | Publishes ROI milestone events |

### metrics-collector.ts
| Function | Purpose |
|---|---|
| collectJourneyMetrics | Aggregates completion rates per journey type |
| collectDeliveryMetrics | SMS/email/video delivery success rates |
| collectEngagementMetrics | Open rates, click rates, response rates |
| getMetricsSummary | Returns dashboard-ready metrics summary |

### ab-testing.ts
| Function | Purpose |
|---|---|
| createABTest | Creates new A/B test for a content variant |
| assignVariant | Assigns patient to A or B variant |
| recordVariantOutcome | Records conversion/outcome for variant |
| selectWinner | Statistically selects winner when significance reached |
| getTestResults | Returns test performance for all active tests |

### personalization.ts
| Function | Purpose |
|---|---|
| getPatientSegment | Returns patient's segment (High/Medium/Low value) |
| personalizeContent | Selects content based on segment + history |
| getPersonalizationRules | Returns active personalization rules |
| updatePersonalizationModel | Updates rules based on engagement data |

### analytics.ts
| Function | Purpose |
|---|---|
| getJourneyAnalytics | Full analytics per journey type |
| getCompletionFunnel | Step-by-step completion funnel |
| getCohortAnalysis | Cohort performance over time |
| exportAnalyticsReport | Generates shareable analytics report |

### automation-triggers.ts
| Function | Purpose |
|---|---|
| evaluateTrigger | Checks if trigger conditions are met |
| scheduleTrigger | Queues trigger for future execution |
| cancelTrigger | Cancels a scheduled trigger |
| getActiveTriggers | Returns all active triggers for a practice |
| processTriggerQueue | Runs due triggers (called by cron) |

### roi-calculator.ts
| Function | Purpose |
|---|---|
| calculateJourneyROI | ROI for a specific journey type |
| calculatePlatformROI | Combined ROI across all journeys |
| attributeRevenue | Creates revenue attribution record |
| getROISummary | Dashboard-ready ROI summary |

---

## 4. 7 Canonical Patient Journeys

| Journey Type | Trigger | Steps | Avg Duration | Key Metric |
|---|---|---|---|---|
| Appointment | Appointment booked | Prep video → reminder → post-visit → follow-up | 7 days | Rebooking rate |
| Post-Visit | Appointment completed | Summary video → treatment follow-up → review request | 14 days | Review submission rate |
| Review | 14 days post-appointment | Review request video → reminder → thank you | 21 days | Review rate |
| Referral | High-influence score patient | Referral invite video → incentive → tracking | 30 days | Referral conversion rate |
| Recall | 6+ months since last visit | Recall video → SMS → call queue → close-lost | 60 days | Rebooking rate |
| Treatment | Open treatment plan | Education video series → follow-up → acceptance nudge | 30 days | Treatment acceptance rate |
| Recovery | Procedure completed | Day 1/3/7/14 check-in videos | 14 days | Response rate |

---

## 5. Canonical Commercial Workflow

Phase 12 added a commercial workflow that maps the full client acquisition lifecycle:

```
Lead → Discovery → Assessment → Proposal → Contract → Subscription → Onboarding → Success Monitoring
```

| Stage | Automation Platform Role | Triggers |
|---|---|---|
| Lead | Log practice as opportunity | Creates lead record in commercial_proposals |
| Discovery | Schedule discovery call | Calendar invite automation |
| Assessment | Run Digital Twin simulation | simulateRevenueTwin() + ROI report generation |
| Proposal | Generate + send proposal | createProposal() + sendProposal() + email via Resend |
| Contract | Contract execution | createContract() + signContract() |
| Subscription | Activate subscription | activateSubscription() + onboarding journey trigger |
| Onboarding | Practice onboarding sequence | 14-day onboarding automation sequence |
| Success Monitoring | Ongoing health monitoring | Weekly health check + ALICE briefing generation |

---

## 6. Workflow Recovery Integration

`lib/workflow-recovery/index.ts` extends Automation Platform:

| Recovery Function | Extends | Purpose |
|---|---|---|
| detectAndRecoverWorkflows | health-monitor.detectUnhealthyWorkflows | Auto-triggers recovery for unhealthy workflows |
| executeRecoveryAction | recovery-engine.executeRecoveryAction | 6 recovery action types (see below) |
| recordRecoveryEvent | NEW | Writes to workflow_recovery_events |
| recordRecoveryAction | NEW | Writes to workflow_recovery_actions |
| updateRecoveryMetrics | NEW | Updates workflow_recovery_metrics |
| calculateStabilityScore | Extends health-monitor | 30-day rolling stability (uptime × reliability) |
| calculateReliabilityScore | Extends metrics-collector | Success rate over last 100 executions |
| calculateMTTR | NEW | Mean Time To Recovery from recovery_events |

### 6 Recovery Action Types

| Action Type | Description | Auto-Trigger |
|---|---|---|
| retry_step | Retries the failed journey step | Yes (immediate) |
| skip_step | Skips non-critical failed step | Yes (after 2 retries) |
| reschedule_delivery | Reschedules failed delivery for +1 hour | Yes (delivery failure) |
| fallback_channel | Switches from video to SMS/email | Yes (HeyGen failure) |
| pause_journey | Pauses journey pending manual review | Yes (3+ consecutive failures) |
| escalate_to_human | Creates support ticket + notifies admin | Yes (critical severity) |

---

## 7. Workflow Health Metrics

| Metric | Formula | Target |
|---|---|---|
| Workflow Health Score | (1 - failure_rate) × 100 | >85 |
| Stability Score | (uptime_pct × reliability_score) / 100 | >90 |
| Reliability Score | successful_executions / total_executions × 100 | >95 |
| MTTR (minutes) | AVG(recovery_completed_at - failure_detected_at) | <15 min |
| Journey Completion Rate | completed_journeys / initiated_journeys × 100 | >70% |
| Delivery Success Rate | delivered_count / attempted_count × 100 | >98% |

---

## 8. API + Executive Dashboard Integration

Automation Platform does not have a standalone API route. Its data surfaces through:

| Integration | Route | Data Exposed |
|---|---|---|
| Executive Dashboard Journey Panel | /api/mission-control?view=journeys | Journey completion rates, active journeys |
| Executive Dashboard Health Panel | /api/mission-control?view=health | Workflow health score, failure rates |
| Workflow Recovery API | /api/workflow-recovery | Recovery events, actions, metrics |
| Digital Twin | /api/digital-twin?view=workflow | Workflow twin snapshot |
| ALICE Executive | /api/alice/executive-briefing | Workflow health in intelligence score |

---

## 9. Automation Platform Governance

1. All automation must use Automation Platform — no ad-hoc automation in feature code
2. All journeys must be one of 7 canonical types — no custom journey types without Automation Platform extension
3. All delivery attempts must be logged via metrics-collector.ts
4. All failures must publish to Event Fabric via event-publisher.ts
5. Recovery must always attempt retry before escalation
6. A/B tests must reach statistical significance before selecting winner (p < 0.05)
>>>>>>> backup/pre-consolidation
