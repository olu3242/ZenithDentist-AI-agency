# Persona Architecture

## Status

Implemented in code.

Primary source of truth:

- `lib/personas.ts`
- `components/dashboard/persona-command-center.tsx`
- `lib/navigation.ts`
- `app/dashboard/page.tsx`
- `components/dashboard/role-dashboard.tsx`

## Persona Framework

Zenith now models the application as role-specific operating surfaces instead of feature buckets.

| Persona | Default role | Command center | Primary outcome |
| --- | --- | --- | --- |
| Front Desk Operator | `staff` | Patient Access Command Center | Filled schedules, recall recovery, no-show reduction |
| Clinical Provider | `staff` | Clinical Growth Command Center | Treatment follow-up and recovered production |
| Office Manager | `staff` | Practice Operations Command Center | PMS readiness, staff throughput, workflow reliability |
| Practice Owner | `practice_owner` | Executive Command Center | Revenue recovery, retention, automation ROI |
| DSO Executive | `practice_owner`, `super_admin` | DSO Enterprise Mission Control | Location benchmarking and portfolio variance control |
| Agency Growth Operator | `agency_admin` | Growth Operations Command Center | Assessment-to-strategy-session conversion |
| Zenith Platform Operator | `super_admin` | Zenith Internal Mission Control | Multi-tenant reliability, runtime recovery, governance |

## Role-To-Persona Mapping

Implemented by:

- `defaultPersonaByRole`
- `rolePersonaOptions`
- `getPersonaForRole`

| Zenith role | Default persona | Optional persona surfaces |
| --- | --- | --- |
| `practice_owner` | Practice Owner | DSO Executive |
| `staff` | Front Desk Operator | Clinical Provider, Office Manager |
| `agency_admin` | Agency Growth Operator | Growth Operations |
| `super_admin` | Zenith Platform Operator | DSO Executive, Growth Operator, Practice Owner |

## Runtime Model

Every persona owns:

- Mission
- Operating cadence
- Outcomes
- KPIs
- ALICE recommendations
- Workflows
- Reports
- Navigation

The default `/dashboard` route now renders a persona-aware command center for the current authenticated role. Legacy role routes now render the same command center component with a fixed persona, preventing isolated dashboard behavior.

## Go-Forward Rule

New pages should be added to a persona mission domain before they are exposed in navigation. Feature-first navigation is deprecated.
