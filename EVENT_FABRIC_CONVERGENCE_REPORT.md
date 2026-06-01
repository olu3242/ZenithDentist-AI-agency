# Event Fabric Convergence Report

## Expected Canonical Path

`publishEvent()` should be the public event publication path.

## Actual Paths

| Publisher | Usage | Classification |
| --- | --- | --- |
| `lib/event-fabric/index.ts::publishEvent()` | High-level typed event publisher | CANONICAL |
| `lib/runtime/event-fabric.ts::publishRuntimeFabricEvent()` | Low-level runtime fabric persistence | CANONICAL LOW-LEVEL |
| `workflow-engine.ts` | Calls low-level publisher directly | DUPLICATE PATH |
| `agent-observability.ts` | Calls low-level publisher directly | DUPLICATE PATH |
| `extension-runtime.ts` | Calls `publishEvent()` | CANONICAL |
| `tenant-context/index.ts` | Calls `publishEvent()` | CANONICAL |

## Result

Event persistence is real and centralized at `runtime_event_fabric_events`, but publication is not fully converged through `publishEvent()`.

Event Fabric Score: 78/100

## Recommendation

Refactor Workflow OS and AI observability to call `publishEvent()` and reserve `publishRuntimeFabricEvent()` as internal-only.
