# Live Dashboard Report

## Activated Live Sources

| Metric Family | Source |
| --- | --- |
| Organizations | `organizations`, scoped by current session organization id |
| Users | `profiles`, `organization_members` through onboarding/bootstrap flows |
| Leads | `leads` via `getAdminDashboardData` |
| Revenue/conversions | `roi_calculations`, `bookings`, `outreach_events` |
| Automations | `automation_registry` via `getAutomationOSState` |
| Workflow runs | `automation_events`, Workflow OS runtime |
| Runtime executions | `automation_traces`, `automation_dead_letters` |
| Reviews/patients/appointments | Existing portal operational tables/adapters where configured |

## Changes

- Dashboard now includes Automation OS live counts and execution totals.
- Tenant resolution now prefers the authenticated `zenith_organization_id` cookie before the default slug.
- Workflow OS now displays persisted automation registry status where available.

## Remaining Gap

Some dental clinical entities depend on connected PMS/Open Dental sync data; without that feed, their live counts correctly show empty-state values.
