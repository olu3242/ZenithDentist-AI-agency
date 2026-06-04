# Pilot Operations Report

Date: 2026-06-01

## Monitoring Scope

Implemented in `getPilotOperationsCenter` in `lib/pilot-operations.ts`.

Tracks:

- Organizations
- Active users
- Connected PMS
- Playbook status
- Workflow health
- Revenue attribution

## Source Systems

- Organizations: `organizations`
- Active users: `profiles` and `organization_members`
- Connected PMS: `pms_integrations`
- Playbook status: `automation_registry`
- Workflow health: `analyticsProjector.workflow`
- Revenue attribution: automation execution count and playbook attribution rules

## Status

Pilot monitoring is ready through existing Mission Control and analytics surfaces.
