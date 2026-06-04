# Self-Healing OS Report

> **Platform Maturity Sprint — June 2026**
> Source: `lib/errors/self-healing.ts`, `lib/runtime/replay-engine.ts`, `lib/autonomous.ts`

---

## Overview

The Self-Healing OS ensures that transient failures in automation workflows, API calls, and database operations are automatically recovered without operator intervention. It combines retry logic, circuit breakers, dead letter queuing, and autonomous replay into a layered resilience architecture.

---

## Layer 1: Retry Logic (`lib/errors/self-healing.ts`)

### `withRetry<T>(operation, policy)`

```typescript
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  delayMs: 500,              // Initial delay
  backoffMultiplier: 2,      // Exponential: 500ms → 1000ms → 2000ms
  retryableCategories: [
    "API_ERROR",
    "NETWORK_ERROR",
    "RUNTIME_ERROR",
    "DATABASE_ERROR",
  ],
};
```

**Retry sequence:**
```
Attempt 1 (immediate)
  ↓ [failure]
Wait 500ms
Attempt 2
  ↓ [failure]
Wait 1000ms
Attempt 3
  ↓ [failure]
Error classified → circuit breaker updated → dead letter created
```

**Error classification** via `lib/errors/error-registry.ts`:
- Maps error codes to categories (`API_ERROR`, `NETWORK_ERROR`, etc.)
- Non-retryable errors: `AUTH_ERROR`, `VALIDATION_ERROR`, `NOT_FOUND` (fail fast)

---

## Layer 2: Circuit Breaker (`lib/errors/self-healing.ts`)

### States

```
CLOSED (normal operation)
    ↓ [5 consecutive failures]
OPEN (blocking all requests to service)
    ↓ [60 seconds elapsed]
HALF-OPEN (probe mode: allow 1 request)
    ↓ [success]        ↓ [failure]
CLOSED               OPEN (reset timer)
```

### Implementation

```typescript
const CIRCUIT_THRESHOLD = 5;    // Failures before opening
const CIRCUIT_RESET_MS = 60_000; // 60 seconds before half-open probe

// State stored in in-memory registry (per process)
const circuitRegistry = new Map<string, CircuitBreakerState>();
```

### Key Functions

| Function | Description |
|----------|-------------|
| `getCircuitState(service)` | Returns current state for a named service |
| `recordCircuitSuccess(service)` | Logs success; closes circuit if half-open with 2+ successes |
| `recordCircuitFailure(service)` | Increments failure count; opens circuit at threshold |
| `isCircuitOpen(service)` | Returns true if circuit is OPEN (probe timer not expired) |

### Services Protected

| Service Key | Description |
|-------------|-------------|
| `supabase_db` | Database operations |
| `n8n_webhook` | n8n automation delivery |
| `anthropic_api` | ALICE LLM inference |
| `pms_sync` | PMS adapter calls |
| `email_provider` | Email delivery |
| `sms_provider` | SMS delivery |

---

## Layer 3: `automation_retries` Table

Created in migration `202606010001_pros_core_tables.sql`:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK |
| `execution_id` | `uuid` | FK → `workflow_executions.id` |
| `attempt_number` | `integer` | 1, 2, or 3 |
| `error_code` | `text` | Classified error code |
| `error_category` | `text` | `API_ERROR`, `NETWORK_ERROR`, etc. |
| `attempted_at` | `timestamptz` | When retry was attempted |
| `succeeded` | `boolean` | Whether this attempt succeeded |
| `delay_ms` | `integer` | Delay before this attempt |

---

## Layer 4: `automation_dead_letters` Table

Created in migration `040_runtime_trace_system.sql`:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK |
| `trace_id` | `uuid` | FK → trace (indexed) |
| `workflow_id` | `text` | Which workflow failed |
| `payload` | `jsonb` | Original event payload |
| `error_detail` | `jsonb` | Full error context |
| `failed_at` | `timestamptz` | When final failure occurred |
| `replayed_at` | `timestamptz` | Null until replayed |
| `replay_count` | `integer` | Number of replay attempts |
| `created_at` | `timestamptz` | Record creation |

---

## Layer 5: Replay Engine (`lib/runtime/replay-engine.ts`)

`getReplayCenterState()` scans dead letters and scores them:

```typescript
export interface ReplayCenterState {
  candidates: ReplayCandidate[];
  replayableDeadLetters: number;    // Ready for immediate replay
  blockedDeadLetters: number;       // Blocked (circuit open or manual hold)
  averageConfidence: number;        // Avg confidence across all candidates
}
```

Replay execution:
```typescript
// Dry-run mode: preview what will happen
replayExecution({ traceId, dryRun: true })

// Live replay with approval
replayExecution({ traceId, dryRun: false, approved: true, reason: "Manual operator approval" })
```

Replay writes back to `workflow_executions` with `status = 'replayed'` and links to original via execution context.

---

## Layer 6: Autonomous Recovery (`lib/autonomous.ts`)

Autonomous recovery runs on a timer and self-heals without operator input:

**Autonomous actions:**
1. Detects circuits in OPEN state for > 5 minutes
2. Attempts probe request to diagnose root cause
3. If root cause resolved: resets circuit and replays top-priority dead letters
4. If root cause persists: creates Executive Dashboard alert with `operationalSeverity = CRITICAL`

Governed by `lib/runtime/autonomous-recovery.ts` (full implementation in `lib/runtime/`).

---

## Health Endpoint: `GET /api/health`

Checks 6 services and reports circuit states:

```json
{
  "status": "healthy",
  "services": {
    "supabase_db": { "state": "closed", "failures": 0 },
    "n8n_webhook": { "state": "closed", "failures": 1 },
    "anthropic_api": { "state": "closed", "failures": 0 },
    "pms_sync": { "state": "closed", "failures": 0 },
    "email_provider": { "state": "closed", "failures": 0 },
    "sms_provider": { "state": "closed", "failures": 0 }
  },
  "deadLetters": { "replayable": 2, "blocked": 0 },
  "timestamp": "2026-06-02T09:15:00Z"
}
```

---

## Self-Healing OS Status

| Component | Status |
|-----------|--------|
| `withRetry()` (3 attempts, exp backoff) | ✅ Production |
| Circuit breaker (5-failure threshold, 60s reset) | ✅ Production |
| `automation_retries` table | ✅ Created in migration |
| `automation_dead_letters` table | ✅ Created in migration |
| Replay engine with confidence scoring | ✅ Production |
| `getReplayCenterState()` | ✅ Production |
| Autonomous recovery | ✅ Production |
| Health endpoint (6 services) | ✅ Production |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
