# Digital Twin Architecture

## Status

Foundation implemented.

Primary modules:

- `lib/runtime/digital-twin.ts`
- `lib/runtime/simulation-engine.ts`
- `lib/autonomous.ts`

## Practice Digital Twin

The digital twin simulates:

- Revenue
- Patients
- Schedules
- Campaigns
- Workflows

## Scenario Flow

```txt
Current operating state
  -> Scenario input
  -> Simulation OS
  -> Projected impact
  -> Decision OS
  -> ALICE recommendation
```

## Enterprise Extension

The same architecture supports multi-location operations graphs, cross-practice benchmarking, portfolio health, and DSO Mission Control.
