# ALICE Report

## Current Inputs

ALICE consumes:

- `getPortalData()`
- `getTenantData()`
- `getAutomationOSState()`
- `getWorkflowAnalyticsSummary()` in AI OS modules
- `getRuntimeHealthState()` in AI OS modules

## Finding

ALICE is grounded in live tenant, automation, workflow, and runtime data, but it still performs direct operational data reads through higher-level data loaders rather than consuming only analytics + event fabric + workflow traces.

## Status

ALICE intelligence path: PARTIAL

ALICE Convergence Score: 76/100

## Recommendation

After analytics projector convergence, route ALICE grounding through analytics/event/trace views only.
