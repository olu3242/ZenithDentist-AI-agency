# Workflow Outcome Tracking

## Status

Partially implemented with runtime traces and derived outcome metrics.

Primary files:

- `lib/action-engine.ts`
- `lib/automation-os/registry.ts`
- `lib/runtime/automation-health.ts`
- `lib/workflow-os/workflow-engine.ts`

## Telemetry States

Automation Platform and runtime tracing support:

- Started
- Running
- Paused
- Completed
- Failed
- Recovered

## Outcome Metrics

Every workflow catalog item declares measurable outcomes:

- Revenue Generated
- Revenue Recovered
- Patients Recovered
- Reviews Generated
- Hours Saved

## Current Calculation

`calculateWorkflowOutcomes` derives executive totals from:

- ROI calculations
- outreach and review events
- automation executions

## Required Persistence Follow-Up

Add a `workflow_outcomes` table to store per-execution outcomes with direct links to:

- organization
- workflow id
- execution id
- patient id or lead id
- revenue generated
- revenue recovered
- patients recovered
- reviews generated
- hours saved
- ALICE recommendation id
