# Event Analytics Bridge Report

Generated: 2026-06-01

## Status

PARTIAL.

## Implemented

- Canonical publisher exists: `lib/event-fabric/index.ts` -> `publishEvent()`.
- Runtime persistence exists: `lib/runtime/event-fabric.ts` writes to `runtime_event_fabric_events`.
- Analytics projection exists: `lib/analytics-projector.ts` -> `analyticsProjector()`.
- ALICE consumes analytics projector via `lib/alice.ts`.

## Current Flow

```text
publishEvent()
-> publishRuntimeFabricEvent()
-> runtime_event_fabric_events
-> getRuntimeEventFabricState()
-> analyticsProjector()
-> ALICE
```

## Gaps

- Not every event-producing path calls `publishEvent()`.
- Some runtime and workflow paths still write/read operational tables directly.
- Analytics projection is derived at read-time; no persistent analytics ingestion table was verified.

## Release Decision

PARTIAL. The bridge exists, but event publication convergence is not complete.
