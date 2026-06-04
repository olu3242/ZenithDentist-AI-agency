# Tenant Certification Report

Date: 2026-06-01

## Required Entity Certification

| Entity | Table Evidence | Tenant Key Evidence | Result |
| --- | --- | --- | --- |
| patients | No `patients` table in migrations | None | FAIL |
| appointments | No `appointments` table in migrations | None | FAIL |
| workflow_executions | No `workflow_executions` table in migrations | Equivalent `workflow_runs` exists but is orphaned from database types | FAIL |
| workflow_events | No `workflow_events` table in migrations | `automation_trace_events` depends on `trace_id`, no direct `organization_id` | FAIL |
| analytics | `operational_metrics`, `analytics_events` | `operational_metrics.organization_id`; `analytics_events.organization_id` but orphaned from database types | FAIL |
| attribution | No dedicated attribution table | `leads.attribution` and `analytics_events.attribution` JSON only | FAIL |
| alice | `alice_conversations`, `alice_messages`, `alice_memory`, `alice_enterprise_memory` | `organization_id` | PASS |
| mission_control | No dedicated `mission_control` table | `runtime_event_fabric_events.organization_id` supports updates | FAIL |
| playbooks | `automation_registry`, `operational_playbooks`, `enterprise_playbooks` | `organization_id` | PASS |
| integrations | `pms_integrations`, `normalized_healthcare_events` | `organization_id` | PASS |

## Additional Evidence

`DATABASE_INVENTORY.csv` shows only one table without a direct tenant key in its definition snippet:

- `profiles`: scoped by `default_organization_id` and organization membership behavior, not a direct required operational tenant key.

## Result

FAIL

Tenant scoping exists on many operational tables, but required patient, appointment, workflow execution, workflow event, attribution, and Mission Control entities are not certifiable from the current schema.
