# Persona Navigation Model

## Status

Implemented.

Primary navigation is now generated from persona definitions in `lib/personas.ts` through `navForRole` in `lib/navigation.ts`.

## Navigation Principles

1. The primary rail shows command centers and mission domains.
2. Feature pages remain available as drilldowns.
3. The first navigation item must take the user to their role-specific operating surface.
4. Settings remain available for all roles.
5. Admin, portal, and internal groups are retained as secondary drilldown groups.

## Mission Domains

| Domain | Purpose |
| --- | --- |
| Revenue | Revenue recovery, forecasting, reports, simulations |
| Patients | Patients, recall, reviews, retention |
| Operations | PMS, cloud, locations, operational readiness |
| Automation | Workflow OS, Runtime OS, Automation Center |
| Enterprise | DSO and multi-location mission control |
| Platform | Zenith internal operations, governance, runtime recovery |

## Current Persona Navigation

| Persona | Primary navigation |
| --- | --- |
| Front Desk Operator | Patient Access, Recall Recovery, Review Growth, Automation Queue, Settings |
| Clinical Provider | Clinical Growth, Production, Patients, Clinical Workflows, Settings |
| Office Manager | Practice Ops, PMS Operations, Locations, Workflow Queue, Settings |
| Practice Owner | Executive Command, Revenue, Patients, Operations, Automations, Reports, Settings |
| DSO Executive | Enterprise Mission, Locations, Forecasting, Reports, Automations, Settings |
| Agency Growth Operator | Growth Command, Funnel, Lead Ops, Client Ops, GTM Command, Automations, Settings |
| Zenith Platform Operator | Zenith Mission, Mission Control, Runtime OS, Workflow OS, Internal Ops, Automations, Settings |

## Deprecated Navigation Pattern

The old primary rail exposed unrelated feature pages such as dashboard, role dashboard, PMS ops, marketplace, runtime, and settings at the same hierarchy level. Those routes are no longer the organizing model. They are now subordinate drilldowns under persona mission domains.
