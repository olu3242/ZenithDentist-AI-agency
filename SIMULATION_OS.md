# Simulation OS

## Status

Foundation implemented.

Primary modules:

- `lib/runtime/simulation-engine.ts`
- `lib/runtime/digital-twin.ts`
- `lib/autonomous.ts`
- `components/autonomous/operational-simulator.tsx`

## Purpose

Simulation OS runs scenarios before execution so workflows and ALICE recommendations can be tested against a digital twin.

## Simulation Targets

- Revenue
- Patients
- Schedules
- Campaigns
- Workflows
- Provider capacity
- Recovery plans

## Outputs

- Projected impact
- Confidence
- SLA risk
- Reliability delta
- Recommended playbook

## Reusability

Each product supplies domain variables; the simulation contract remains platform-level.
