# Tenant Reconciliation Report

Date: 2026-06-01

## Required Tenant Key

Expected canonical tenant key:

`organization_id`

## Local Evidence

From local inventory:

- Most operational tables include `organization_id`.
- `profiles` uses `default_organization_id` rather than direct `organization_id`.
- Some lead/funnel tables were created first and later altered to include `organization_id`.
- Required patient and appointment tables are absent locally.

## Remote Evidence

BLOCKED

Remote schema could not be inspected because Supabase project linking failed with an access-control error.

## Required Entity Status

| Entity | Local Tenant Evidence | Remote Tenant Evidence | Status |
| --- | --- | --- | --- |
| organizations | Tenant root | Unknown | BLOCKED |
| organization_members | `organization_id` | Unknown | BLOCKED |
| profiles | `default_organization_id` | Unknown | WARNING |
| tenant_settings | No dedicated table | Unknown | FAIL |
| patients | Missing locally | Unknown | FAIL |
| appointments | Missing locally | Unknown | FAIL |
| workflow_executions | Missing locally | Unknown | FAIL |
| workflow_events | Missing locally | Unknown | FAIL |
| analytics | `organization_id` on `operational_metrics`; other analytics surfaces vary | Unknown | WARNING |
| attribution | No dedicated table | Unknown | FAIL |

## Result

NOT RECONCILED

Tenant reconciliation cannot pass without remote schema evidence and without resolving required local entity gaps.
