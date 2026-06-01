# Mission Control Live Report

## Live Ops Sources

- Runtime health: `automation_traces`, `automation_dead_letters`
- Workflow health: Workflow OS runtime state
- Event fabric: `runtime_event_fabric_events`
- Automation health: `automation_registry`, traces, events
- Tenant health: organization-scoped data from `getTenantData`
- AI health: provider and ALICE operational context

## Changes

- Automation Marketplace and Automation Center are now connected to role-aware navigation and middleware.
- Dashboard and Workflow OS now surface persisted automation registry state.

## Remaining Gap

Mission Control command widgets are still mostly read/observe oriented. Additional command APIs are needed for full recovery orchestration from the UI.
