# Dashboard Consolidation Report

## Status

Implemented for the primary dashboard and role dashboard routes.

## Consolidated Routes

| Route | Previous behavior | Current behavior |
| --- | --- | --- |
| `/dashboard` | Generic executive/agency KPI board | Persona-specific command center based on current role |
| `/dashboard/front-desk` | Separate role dashboard | Patient Access persona command center |
| `/dashboard/provider` | Separate role dashboard | Clinical Growth persona command center |
| `/dashboard/office-manager` | Separate role dashboard | Practice Operations persona command center |
| `/dashboard/practice-owner` | Separate role dashboard | Executive Command Center |

## Eliminated Patterns

- Generic dashboard as default login surface
- Separate role dashboard implementation
- Primary navigation as a flat feature list
- Isolated KPI cards without persona mission context

## Retained Drilldowns

The following remain as drilldown experiences:

- Portal revenue, patients, reviews, recall, reports, forecasting, simulations
- PMS operations
- Automation Center
- Automation Platform
- Runtime OS
- Executive Dashboard
- Internal operations

## Remaining Risk

Some retained drilldown routes may still contain legacy copy or page-local framing. They are no longer primary navigation, but future UX hardening should continue converting each drilldown to the mission-domain language.
