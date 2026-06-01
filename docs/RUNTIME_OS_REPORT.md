# Runtime OS Report — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Source:** `lib/runtime/`

---

## Trace Engine

**File:** `lib/runtime/trace-engine.ts`

The trace engine is the observability backbone. Every workflow execution creates a trace that is persisted to `automation_traces`.

### Key Functions

| Function | Signature | Writes To |
|----------|-----------|----------|
| `createTrace(input)` | `CreateTraceInput → AutomationTrace` | `automation_traces` |
| `appendTraceStage(input)` | `TraceStageInput → void` | `automation_trace_events` |
| `completeTrace(traceId)` | `string → void` | `automation_traces.status = "completed"` |
| `failTrace(traceId, reason)` | `string, string → void` | `automation_traces.status = "failed"` |
| `replayTrace(traceId)` | `string → AutomationTrace` | New trace with `replayed_from` reference |

### Failure Classification

`classifyFailure(reason): FailureCategory` maps error messages to 9 categories:
- `infra`, `auth`, `provider`, `timeout`, `business_rule`, `validation`, `dependency`, `partial_success`, `retry_exhausted`

### Tenant Scoping

`validateOrganizationScope(organizationId)` enforces that all traces carry a valid organization_id (min 3 chars). Traces without valid org scope are rejected.

---

## Replay Engine

**File:** `lib/runtime/replay-engine.ts`

### Key Functions

- `getReplayCenterState(): Promise<ReplayCenterState>` — builds replay queue from `getRuntimeHealthState()`
- `buildReplayCenterState(runtime): ReplayCenterState` — pure function, computes from live RuntimeHealthState

### ReplayCandidate Model

```typescript
interface ReplayCandidate {
  id: string;
  traceId: string;
  workflowId: string;
  replayType: "full_trace" | "dead_letter" | "partial_stage";
  confidence: number;        // 0–1 confidence score
  rollbackSafe: boolean;
  preview: string;
  suggestedAction: string;
  operationalSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}
```

### Confidence Scoring

Confidence is computed from:
- Failure category (auth/infra failures have lower confidence than business_rule)
- SLA breach severity
- Replay type (dead_letter vs full_trace)
- rollbackSafe flag

### Replay Execution

`executeReplay(input: ReplayExecutionInput)` supports:
- `dryRun: true` — returns preview without execution
- `approved: true` — executes `replayTrace(traceId)` from trace-engine

---

## Dead Letter Handling

**File:** `lib/runtime/trace-engine.ts` (routeDeadLetter) + `lib/alerting/index.ts`

Dead letters are written to `automation_dead_letters` when:
- A trace exhausts all retry attempts (`retry_exhausted`)
- A workflow escalation cannot be resolved
- A circuit breaker opens

The alerting system (`lib/alerting/index.ts`) monitors `automation_dead_letters` in the last 24h window. Dead letter count > 0 triggers a `workflow_failure` alert at `critical` severity.

`ReplayCenterState` exposes:
- `replayableDeadLetters: number` — candidates eligible for replay
- `blockedDeadLetters: number` — candidates blocked (circuit open)

---

## Retry Tracking

**Table:** `automation_retries` (from migration 202606010001)

```sql
automation_retries (
  id uuid,
  organization_id uuid,
  trace_id uuid → automation_traces,
  execution_id uuid → workflow_executions,
  attempt_number integer,
  attempted_at timestamptz,
  status text (pending | success | failed),
  failure_reason text,
  next_retry_at timestamptz
)
```

`lib/runtime/self-healing.ts::planRetry()` computes `next_retry_at` using exponential backoff. The retry plan is used by `lib/runtime/replay-engine.ts` to suggest remediation.

---

## Execution Logs

**Table:** `automation_execution_logs` (from migration 202606010001)

```sql
automation_execution_logs (
  id uuid,
  organization_id uuid,
  execution_id uuid → workflow_executions,
  level text (debug | info | warn | error),
  message text,
  context jsonb,
  logged_at timestamptz
)
```

Both tables have RLS isolation (organization_id policy) and descending time indexes.

---

## Observability Stack

| Component | File | Coverage |
|-----------|------|---------|
| Health state | `lib/runtime/automation-health.ts::getRuntimeHealthState()` | traces, deadLetters, slaBreaches, domainHealth, scores |
| Operational health | `lib/monitoring/index.ts::getOperationalHealthDashboard()` | 6 components + workflow/runtime/billing health |
| Provider health | `lib/runtime/provider-health.ts::getProviderHealth()` | Per-provider status: healthy/degraded/down |
| Incident management | `lib/runtime/incident-management.ts` | Open incidents, critical count |
| Instrumentation | `lib/runtime/instrumentation.ts` | Latency measurement, trace stage timing |
| Governance | `lib/runtime/governance.ts::getGovernanceState()` | Trust score computation |

### Runtime Health Scores (4 Dimensions)

```typescript
interface RuntimeHealthScores {
  operationalScore: number;   // overall ops health 0-100
  reliabilityScore: number;   // success rate based
  observabilityScore: number; // trace coverage
  healingScore: number;       // recovery effectiveness
}
```

---

## Readiness Score: 85/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Trace engine | 90 | createTrace/appendStage/complete/fail/replay all implemented |
| Replay engine | 85 | Confidence scoring, dry-run, executeReplay wired |
| Dead letter routing | 80 | automation_dead_letters + alerting integration |
| Retry tracking | 85 | automation_retries table + planRetry() |
| Execution logs | 85 | automation_execution_logs table + level/context |
| Observability | 85 | 4 health scores, provider health, incident management |
| Failure classification | 90 | 9-category classifyFailure() |

**Gap:** `automation_retries` and `automation_execution_logs` tables are defined in migration 202606010001 but the explicit write paths from `lib/runtime/self-healing.ts` into `automation_retries` need to be verified as fully wired versus partially stubbed. The replay engine's `executeReplay()` delegates to `replayTrace()` which is fully implemented.
