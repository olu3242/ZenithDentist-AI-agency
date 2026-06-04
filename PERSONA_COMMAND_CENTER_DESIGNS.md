# Persona Command Center Designs

## Status

Implemented as a shared command center component:

- `components/dashboard/persona-command-center.tsx`

## Shared Layout

Every command center has:

- Persona label and mission
- Operating cadence
- Four persona-specific KPIs
- Revenue priority recommendation
- Mission-domain drilldowns
- Persona workflow queue
- Embedded ALICE recommendation list
- Persona report links

## Persona KPI Designs

| Persona | KPI set |
| --- | --- |
| Front Desk Operator | Appointments, Patient Recovery, Workflow Health, Review Velocity |
| Clinical Provider | Recovered Revenue, Treatment Follow-up, Booked Visits, Automation Reliability |
| Office Manager | Workflow Health, Appointments, Locations, Exceptions |
| Practice Owner | Revenue Recovery, Patient Recovery, Automation ROI, Locations |
| DSO Executive | Locations, Portfolio Recovery, Automation Adoption, Retention Risk |
| Agency Growth Operator | Assessments, Strategy Sessions, Pipeline Value, Delivery Health |
| Zenith Platform Operator | Platform Health, SLA Breaches, Organizations, Executions |

## Live Data Sources

| UI area | Source |
| --- | --- |
| Revenue recovery | `roi_calculations.recoverable_revenue` |
| Patient recovery | `roi_calculations.recall_opportunity` |
| Assessments | `leads` |
| Strategy sessions | `bookings` |
| Workflow health | runtime health scores |
| SLA breaches | runtime SLA breach list |
| Automation executions | automation registry performance |
| Locations | tenant location data |

## Consolidation Decision

`/dashboard/front-desk`, `/dashboard/provider`, `/dashboard/office-manager`, and `/dashboard/practice-owner` now reuse the shared persona command center instead of maintaining separate dashboard implementations.
