# Analytics Report

Status: VERIFIED

Canonical analytics path:

1. `runtime_event_fabric_events`
2. `automation_traces`
3. Workflow analytics
4. Automation registry metrics
5. `analyticsProjector()`
6. ALICE and executive intelligence consumers

Implemented:

- Added `lib/analytics-projector.ts`.
- `analyticsProjector()` projects platform health, event fabric health, runtime trace health, workflow health, automation coverage, and ALICE grounding confidence.
- ALICE now consumes the projected analytics path instead of recomputing from multiple operational sources.
- Enterprise cloud scoring now uses analytics projection health rather than direct portal health recomputation.

Remaining risk:

- Projection quality depends on live Supabase trace/event data availability.
- Some route-level dashboards still query domain data directly because they are UI surfaces, not analytics projectors.

Closure result:

- One analytics intelligence path exists for ALICE.
- Typecheck passes.

