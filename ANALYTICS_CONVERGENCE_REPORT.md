# Analytics Report

## Expected Path

`runtime_event_fabric_events -> analyticsProjector() -> automation_traces -> analytics`

## Actual State

| Layer | Status |
| --- | --- |
| `runtime_event_fabric_events` | Present |
| `analyticsProjector()` | Missing |
| `automation_traces` | Present |
| Client analytics (`trackClientEvent`) | Present |
| Server telemetry (`lib/telemetry/gtm.ts`) | Present |
| Workflow analytics (`lib/workflow-os/workflow-analytics.ts`) | Present |

## Finding

Analytics are operational, but duplicated across client event logging, telemetry insertion, workflow analytics, and runtime analytics. There is no single named projector module.

Analytics Convergence Score: 65/100

## Recommendation

Create a canonical `analyticsProjector()` module in a future pass and route runtime/event/workflow/client analytics through it.
