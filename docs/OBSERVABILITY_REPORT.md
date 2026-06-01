# Observability Report — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Sources:** `lib/monitoring/index.ts`, `lib/alerting/index.ts`, `lib/errors/`, `lib/runtime/`

---

## Health Endpoint

**Route:** `/api/health`

The health endpoint checks 6 platform services and returns a structured health response. Services checked:
1. Supabase connectivity (database ping)
2. Runtime kernel (automation_traces query)
3. Workflow OS (automation registry reachability)
4. Event Fabric (runtime_event_fabric_events table)
5. AI provider (env.ANTHROPIC_API_KEY presence)
6. Tenant context (organization_members query)

Each service returns `status: "healthy" | "degraded" | "unknown"` and `latencyMs`.

---

## Error Infrastructure

**Directory:** `lib/errors/`

### Error Codes (`lib/errors/error-codes.ts`)

43 error codes across 9 categories:

| Category | Codes | Examples |
|----------|-------|---------|
| Auth | AUTH_001–004 | SESSION_EXPIRED, INSUFFICIENT_ROLE, TENANT_MISMATCH |
| Database | DB_001–007 | TABLE_MISSING, RLS_VIOLATION, FK_VIOLATION, NULL_TENANT |
| API | API_001–005 | ROUTE_NOT_FOUND, RATE_LIMITED, TIMEOUT, UPSTREAM_FAILED |
| Network | NET_001–003 | TIMEOUT, DNS_FAILED, CONNECTION_REFUSED |
| Runtime | RT_001–005 | WORKFLOW_FAILED, EXECUTION_TIMEOUT, DEAD_LETTER, EVENT_FABRIC_DOWN, REPLAY_FAILED |
| Workflow | WF_001–004 | NOT_FOUND, INVALID_INPUT, STEP_FAILED, QUEUE_FULL |
| AI | AI_001–004 | INFERENCE_FAILED, TOKEN_LIMIT, MODEL_UNAVAILABLE, CONTEXT_OVERFLOW |
| Config | CFG_001–003 | ENV_MISSING, INVALID_VALUE, FEATURE_DISABLED |
| Validation | VAL_001–003 | INVALID_INPUT, MISSING_FIELD, SCHEMA_MISMATCH |

### Error Types (`lib/errors/error-types.ts`)

`ZenithError` extends `Error` with:
- `code: ErrorCode`
- `category: string`
- `metadata: Record<string, unknown>`
- `selfHealable: boolean`

### Error Registry (`lib/errors/error-registry.ts`)

Maps error codes to remediation strategies and self-healing actions.

### API Wrapper (`lib/errors/api-wrapper.ts`)

`withApiErrorHandling(handler)` — wraps Next.js route handlers to catch all errors, classify via `ErrorCode`, return structured JSON error responses.

### Self-Healing (`lib/errors/self-healing.ts`)

`selfHeal(error: ZenithError)` — attempts automated recovery for `selfHealable: true` errors:
- `DB_TABLE_MISSING` → log + alert, queue migration check
- `RT_DEAD_LETTER` → route to dead letter queue + schedule replay
- `AI_INFERENCE_FAILED` → fallback to LocalProvider

---

## Circuit Breaker

**File:** `lib/runtime/self-healing.ts`

- `withRetry(fn, options)` — wraps async functions with exponential backoff
- `isCircuitOpen(workflowId)` — checks if a workflow's circuit breaker is open
- `planRetry(traceId, failureReason)` — computes next retry using `automation_retries` table

Circuit breaker opens when a workflow exceeds the failure threshold within a time window. Open circuits prevent new executions and route to `blockedDeadLetters` in ReplayCenterState.

---

## Monitoring

**File:** `lib/monitoring/index.ts`

`getOperationalHealthDashboard(organizationId): Promise<OperationalHealthDashboard>`

```typescript
interface OperationalHealthDashboard {
  overallStatus: "healthy" | "degraded" | "critical" | "unknown";
  components: ComponentHealth[];    // per-component status
  workflowHealth: {
    totalRuns: number;
    successRate: number;
    avgLatencyMs: number;
    deadLetterCount: number;
  };
  runtimeHealth: {
    openIncidents: number;
    criticalIncidents: number;
    providerDegradations: number;
  };
  billingHealth: {
    stripeConnected: boolean;
    failedEvents: number;
  };
}
```

Data sources: `automation_traces` (last 24h), `operational_incidents`, Stripe events.

**Error Dashboard:** `lib/monitoring/error-dashboard.ts` — aggregates error frequency by code and category.

---

## Alerting

**File:** `lib/alerting/index.ts`

`evaluateAlerts(organizationId): Promise<AlertEvaluation>`

### 6 Alert Categories

| Category | Trigger | Severity |
|----------|---------|---------|
| `workflow_failure` | dead_letters in last 24h | critical |
| `automation_failure` | automation_traces.status=failed count > threshold | warning/critical |
| `integration_failure` | provider_health status=degraded or down | warning |
| `billing_failure` | Stripe webhook events failed | critical |
| `runtime_failure` | operational_incidents open | critical |
| `alice_failure` | AI inference errors in last 24h | warning |

Each `Alert` includes: id, category, severity, title, description, count, firstSeenAt, lastSeenAt, resolved, metadata.

### Incident Runbooks

**workflow_failure (critical):**
1. Check `dead-letter-explorer.tsx` in Mission Control for failing workflow IDs
2. Navigate to `replay-center.tsx` — identify replay candidates with `confidence > 0.7`
3. Execute dry-run first: `executeReplay({ traceId, dryRun: true })`
4. If rollbackSafe, execute: `executeReplay({ traceId, approved: true })`
5. Monitor `sla-breach-panel.tsx` for recurrence

**automation_failure (warning/critical):**
1. Open `runtime-trace-viewer.tsx` — filter by status=failed
2. Review `classifyFailure(reason)` category (infra/auth/provider/timeout)
3. For `infra`: check Supabase status, environment variables
4. For `auth`: verify service role key in `SUPABASE_SERVICE_ROLE_KEY`
5. For `provider`: check `provider-health-panel.tsx` for degraded APIs
6. For `timeout`: increase `slaMinutes` in workflow definition or optimize action

**integration_failure (warning):**
1. Check `provider-health-panel.tsx` — identify degraded provider
2. Review `lib/runtime/provider-health.ts` status details
3. If PMS adapter: run `adapter.testConnection()` via admin console
4. If Stripe: check Stripe dashboard for API errors
5. Enable fallback mode via feature flag if available

**billing_failure (critical):**
1. Check Stripe webhook delivery log
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check `/api/stripe/webhook` route logs
4. Manually replay failed webhooks from Stripe dashboard

**runtime_failure (critical):**
1. Check `operational_incidents` table for open incidents
2. Navigate to `incident-timeline.tsx` in Mission Control
3. Review `autonomous-recovery-center.tsx` for active recovery plans
4. If healing score < 50: manually trigger `replayTrace()` for affected traces
5. Escalate to engineering if `operationalScore < 30`

**alice_failure (warning):**
1. Verify `ANTHROPIC_API_KEY` is set and valid
2. Check Anthropic API status at status.anthropic.com
3. ALICE automatically falls back to LocalProvider — no user-facing outage
4. LocalProvider returns structural content (not LLM inference) — sufficient for dashboards
5. Set `AI_PROVIDER=anthropic` and rotate API key if needed

---

## Execution Logs

**Table:** `automation_execution_logs`

```sql
(id, organization_id, execution_id, level, message, context jsonb, logged_at)
```

Levels: `debug | info | warn | error`

Used to trace step-level execution details per workflow_execution. Queryable by execution_id for deep-dive debugging.

---

## Readiness Score: 83/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Health endpoint | 85 | 6 services checked |
| Error codes | 90 | 43 codes, 9 categories |
| Self-healing | 80 | selfHeal() for key error types |
| Circuit breaker | 80 | withRetry + isCircuitOpen + planRetry |
| Monitoring dashboard | 85 | getOperationalHealthDashboard() |
| Alerting | 85 | 6 alert categories, evaluateAlerts() |
| Execution logs | 80 | Table defined, log writes need verification |
| Runbooks | 75 | Defined above, not yet in-product |

**Gap:** Incident runbooks exist as documentation but are not yet surfaced in-product (no runbook viewer in Mission Control panels). The `operational_incidents` table exists but automated incident creation from alert evaluation is partial.
