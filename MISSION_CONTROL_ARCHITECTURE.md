# Executive Dashboard Architecture

## Status

Implemented as a persona/domain navigation model with retained drilldown routes.

## Architecture

```txt
Role
  -> Persona
    -> Command Center
      -> Mission Domain
        -> Drilldown Page
          -> Workflow / Report / Action
```

## Domains

| Domain | Routes |
| --- | --- |
| Revenue | `/portal/revenue`, `/portal/forecasting`, `/portal/reports`, `/portal/simulations`, `/admin`, `/gtm-command-center` |
| Patients | `/portal/patients`, `/portal/recall`, `/portal/reviews` |
| Operations | `/dashboard/pms`, `/portal/command`, `/portal/cloud`, `/portal/locations`, `/onboarding` |
| Automation | `/automation-center`, `/automation-marketplace`, `/workflow-os`, `/runtime-os` |
| Enterprise | `/portal/locations`, `/portal/reports`, `/portal/forecasting` |
| Platform | `/mission-control`, `/internal`, `/internal/*` |

## Executive Dashboard Types

| Mission control | Audience |
| --- | --- |
| Executive Command Center | Practice owners |
| DSO Enterprise Executive Dashboard | Multi-location and DSO leaders |
| Growth Operations Command Center | Zenith agency operators |
| Zenith Internal Executive Dashboard | Super admins and platform operators |

## Implementation Notes

The platform now avoids exposing all route categories as equal top-level concepts. Navigation starts with the persona mission, then moves into mission domains and drilldowns.
