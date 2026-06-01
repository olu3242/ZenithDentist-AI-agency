# Event Fabric Report — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Source:** `lib/event-fabric/index.ts` + `lib/runtime/event-fabric.ts`

---

## Event Envelope Structure

Every system publishes events through a standard envelope defined in `lib/event-fabric/index.ts`:

```typescript
interface ZenithEvent<TPayload> {
  event_id: string;         // randomUUID()
  event_type: string;       // e.g. "appointment_no_show"
  event_source: EventSource; // 13 canonical sources
  correlation_id: string;   // trace correlation
  tenant_id: string;        // org-scoped isolation
  workflow_id: string;      // links to workflow registry
  timestamp: string;        // ISO 8601
  priority: EventPriority;  // "low" | "moderate" | "high" | "critical"
  payload: TPayload;        // domain-specific data
}
```

---

## Event Sources (13 Canonical)

Defined as `EventSource` in `lib/event-fabric/index.ts`:

1. `workflow_os`
2. `ai_os`
3. `runtime_kernel`
4. `recovery_engine`
5. `replay_engine`
6. `mission_control`
7. `portal`
8. `client_operations`
9. `lead_operations`
10. `gtm_command_center`
11. `observability`
12. `tenant_context`
13. *(implicit)* `sla_instrumentation` (used in runtime/event-fabric.ts)

---

## Publishing Flow

```
Caller (e.g. triggerNoShowPrevention())
  → publishEvent(opts)                          [lib/event-fabric/index.ts]
    → createEvent(opts)                         [attaches event_id + timestamp]
    → publishRuntimeFabricEvent(event)          [lib/runtime/event-fabric.ts]
      → writes to runtime_event_fabric_events   [Supabase table]
      → aggregates into RuntimeEventFabricState
```

The `publishEvent()` function in `lib/event-fabric/index.ts` is the single entry point. It:
1. Creates a typed `ZenithEvent` with UUID and timestamp
2. Calls `publishRuntimeFabricEvent()` from `lib/runtime/event-fabric.ts`
3. Maps event_source to a fabric channel via `resolveFabricChannel()`
4. Persists to `runtime_event_fabric_events` table

---

## Channel Routing

Events are routed to channels based on source and type via `resolveFabricChannel()`:

| Source | Target Channel |
|--------|---------------|
| `workflow_os` | `workflow_execution` |
| `ai_os` | `ai_inference` |
| `runtime_kernel` | `runtime_ops` |
| `recovery_engine` | `recovery` |
| `replay_engine` | `replay_queue` |
| `mission_control` | `mission_control` |
| `sla_instrumentation` | `governance` |
| All others | `platform` |

Runtime event types: `"trace" | "sla" | "provider" | "replay" | "agent" | "governance" | "tenant"`

---

## Persistence

Events are persisted to the `runtime_event_fabric_events` table (Supabase). The `RuntimeEventFabricState` interface (defined in `lib/runtime/event-fabric.ts`) structures the read model:

```typescript
interface RuntimeEventFabricState {
  events: RuntimeFabricEvent[];
  channels: Array<{ name: string; eventCount: number; pressure: number }>;
  propagationScore: number;
  liveSignalCount: number;
}
```

The `getRuntimeEventFabricState()` function aggregates from:
- `getRuntimeHealthState()` → traces (up to 8) + SLA breaches (up to 5)
- `getProviderHealth()` → degraded/down provider events
- `buildReplayCenterState()` → replay events
- `getOperationalMeshState()` → agent mesh events

---

## Integration with Workflow OS

Every `executeWorkflow()` call in `lib/workflow-os/workflow-engine.ts` publishes a `workflow_os` event via `publishEvent()`. The state machine transitions (registered → executing → completed/failed) each emit an event, creating a full audit trail.

The analytics projector (`lib/analytics/projector.ts`) reads from `runtime_event_fabric_events` to compute:
- Delivery rate (delivered / total)
- Events by type and source
- Live signal count for Mission Control

---

## Readiness Score: 82/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Envelope completeness | 95 | All 8 fields present, typed |
| Channel routing | 85 | resolveFabricChannel() implemented |
| Persistence | 90 | runtime_event_fabric_events table exists |
| Source coverage | 80 | 13 sources defined, not all emit actively |
| Analytics integration | 75 | projector reads fabric events |
| Replay support | 70 | lib/event-fabric/replay.ts exists, partial |
| Dead letter capture | 75 | routed via automation_dead_letters |

**Gap:** Event replay via `lib/event-fabric/replay.ts` is scaffolded but the replay execution path primarily routes through `lib/runtime/replay-engine.ts::replayTrace()`. The fabric-level replay module needs to be fully wired.
