# Runtime Convergence Report
**Branch:** claude/determined-ramanujan-BsncJ  
**Date:** 2026-05-31  
**Scope:** Workflow execution event flow, dual-table write verification, analytics read alignment

---

## 1. Execution Event Flow — Write Path

### Flow A: automation_traces (Analytics Source)

```
executeWorkflow(WorkflowExecutionRequest)          [workflow-engine.ts:55]
  └─► emitAutomationEvent({                        [workflow-engine.ts:75]
        organizationId, workflowId,
        triggerName, actionName,
        idempotencyKey, correlationId, payload
      })
        └─► lib/automation/runtime.ts
              └─► writes to: automation_traces
                  (idempotency check, queuing, persistence)
```

### Flow B: runtime_event_fabric_events (Mission Control Source)

```
executeWorkflow(WorkflowExecutionRequest)          [workflow-engine.ts:55]
  └─► publishWorkflowEvent({                       [workflow-engine.ts:91]
        eventType: "workflow.execution.started",
        workflowId, organizationId,
        correlationId, payload
      })
        └─► publishRuntimeFabricEvent({            [workflow-engine.ts:123]
              eventKey, eventType: "trace",
              sourceSystem: "workflow_os",
              targetChannel: "mission_control",
              summary, priority, payload
            })
              └─► lib/runtime/event-fabric.ts
                    └─► writes to: runtime_event_fabric_events
```

### Both Flows Triggered on Every Execution

Both `emitAutomationEvent()` and `publishWorkflowEvent()` are called sequentially within `executeWorkflow()` on every invocation (`workflow-engine.ts:75-103`). Neither call is conditional. Both are `await`-ed before the function returns, so a failure in either write will propagate as an exception.

---

## 2. Read Path — Analytics

```
GET /api/dental/metrics
  └─► getWorkflowAnalyticsSummary()               [workflow-analytics.ts:47]
        └─► getRuntimeHealthState()               [workflow-analytics.ts:48]
              └─► lib/runtime/automation-health.ts:46
                    └─► supabase
                          .from("automation_traces")
                          .select("*")
                          .eq("organization_id", organizationId)
                          .order("started_at", { ascending: false })
                          .limit(200)
```

Analytics data derives exclusively from `automation_traces`. This table captures the full execution record including idempotency state, timing, and workflow identity.

---

## 3. Read Path — Mission Control Event Panel

```
GET /api/mission-control/state
  └─► runtime event fabric state reader
        └─► lib/runtime/automation-health.ts:113
              └─► supabase
                    .from("runtime_event_fabric_events")
                    (reads event stream for Mission Control panel)
```

Mission Control's live event panel derives from `runtime_event_fabric_events`. This table captures lightweight event signals with structured metadata (`eventKey`, `sourceSystem`, `targetChannel`, `priority`, `summary`).

---

## 4. Two-Table Architecture — Purpose and Distinction

| Dimension | `automation_traces` | `runtime_event_fabric_events` |
|-----------|---------------------|-------------------------------|
| Written by | `emitAutomationEvent()` via automation runtime | `publishRuntimeFabricEvent()` via event fabric |
| Read by | Analytics (`getWorkflowAnalyticsSummary`) | Mission Control event panel |
| Schema focus | Full execution record: workflow, trigger, action, idempotency, timing | Lightweight event signal: key, type, source, channel, priority, summary, payload |
| Purpose | Durable execution log for analytics aggregation | Real-time event bus for Mission Control observability |
| Relationship | One record per workflow execution attempt | One record per workflow lifecycle event emitted |
| Are they duplicates? | NO | NO |

The two tables are complementary. `automation_traces` is the persistent execution ledger; `runtime_event_fabric_events` is the observable event stream. Both are written on every `executeWorkflow()` call.

---

## 5. Convergence Verdict

**VERDICT: CONVERGED — Both tables are written on every execution.**

Evidence:
- `workflow-engine.ts:75` — `await emitAutomationEvent(...)` — writes `automation_traces`
- `workflow-engine.ts:91-103` — `await publishWorkflowEvent(...)` → `publishRuntimeFabricEvent(...)` — writes `runtime_event_fabric_events`
- Both calls are unconditional within `executeWorkflow()`
- Both calls are `await`-ed — no fire-and-forget; failures surface as exceptions
- No conditional branching between the two writes

The architecture is sound: a single `executeWorkflow()` entry point guarantees both tables receive a write on every execution. There is no code path through which one table is written without the other.

---

## 6. Remaining Gap: No Cross-Table Reconciliation

**Gap:** Analytics (`getWorkflowAnalyticsSummary`) reads only `automation_traces`. Mission Control reads only `runtime_event_fabric_events`. There is no reconciliation query that joins or compares counts across the two tables.

**Scenario where counts diverge:**
1. `emitAutomationEvent()` succeeds (writes `automation_traces`)
2. `publishWorkflowEvent()` throws an exception (DB write to `runtime_event_fabric_events` fails)
3. `executeWorkflow()` propagates the exception — the caller sees a failure
4. But `automation_traces` already has the record (write is not rolled back in a transaction with event fabric)
5. Analytics shows an execution that Mission Control does not

**Probability:** Low — both are Supabase writes and should succeed or fail together in normal operation. No transactional guarantee spans both tables.

**Recommendation:** Add a periodic reconciliation check (or a scheduled job) that compares `automation_traces` execution counts against `runtime_event_fabric_events` counts per organization per time window. Alert on divergence >1%.

**Alternative:** Wrap both writes in a database transaction or compensating saga pattern if strict consistency is required.

---

## 7. Other Event Emission Sites

`publishWorkflowEvent()` and `publishRuntimeFabricEvent()` are also called from:

| File | Context |
|------|---------|
| `lib/runtime/event-fabric.ts` | Core fabric publisher |
| `lib/runtime/kernel/index.ts` | Runtime kernel lifecycle events |
| `lib/dental-revenue-os/review-growth.ts` | Dental OS domain events |
| `lib/dental-revenue-os/recall-recovery.ts` | Recall domain events |
| `lib/dental-revenue-os/patient-recovery.ts` | Patient recovery domain events |
| `lib/automation/runtime.ts` | Automation runtime events |
| `lib/ai-os/agent-observability.ts` | ALICE agent observability |
| `lib/workflow-os/workflow-scheduler.ts` | Scheduler lifecycle |
| `lib/workflow-os/workflow-replay.ts` | Replay events |
| `lib/workflow-os/workflow-router.ts` | Router events |
| `lib/workflow-os/execution/execution-dispatcher.ts` | Dispatcher events |
| `lib/event-fabric/index.ts` | Event fabric index |

These additional emission sites write only to `runtime_event_fabric_events` (event bus signals). Only `executeWorkflow()` is responsible for writing `automation_traces` via `emitAutomationEvent()`. Domain-level events from `dental-revenue-os` modules emit to the event fabric but do not independently create `automation_traces` records — they should trigger `executeWorkflow()` as their entry point.
