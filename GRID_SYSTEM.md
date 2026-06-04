# GRID SYSTEM

## Components

`components/portal/dashboard-grid.tsx` defines the shared grid system:

- `DashboardContainer`
- `DashboardGrid`
- `KpiGrid`
- `InsightGrid`
- `ActionGrid`

## DashboardContainer

The canonical page wrapper:

- `max-w-7xl`
- full width
- centered
- consistent vertical gap

## DashboardGrid

General two-column enterprise layout:

- responsive single column on small screens
- two columns on large screens
- supports explicit column overrides when a page needs weighted panels

## KpiGrid

Metric-card layout:

- one column on mobile
- two columns on tablet
- four columns on wide desktop by default

## InsightGrid

Recommendation and insight layout:

- one column on mobile
- two columns on large screens
- three columns on wide screens by default

## ActionGrid

Action and settings layout:

- one column on mobile
- two columns on tablet
- three columns on wide screens by default

## Normalized Pages

- Portal dashboard
- Executive command
- Revenue
- Patients
- Operations cloud
- Reports
- ALICE
- Forecasting
- Reviews
- Recall
- Locations
- Simulations
- Integrations
- Knowledge
- Onboarding
- Orchestration
- Settings

## Status

Implemented and typechecked.
