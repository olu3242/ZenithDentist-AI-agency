# Migration Drift Matrix

Date: 2026-06-01

## Evidence Boundary

Remote state is blocked by Supabase access control. Rows below distinguish local evidence from remote unknowns.

| Entity | Local State | Remote State | Canonical State | Status |
| --- | --- | --- | --- | --- |
| organizations | Exists in local migrations | Unknown | CORE | P0 Remote Unknown |
| organization_members | Exists in local migrations | Unknown | CORE | P0 Remote Unknown |
| profiles | Exists in local migrations | Unknown | CORE | P0 Remote Unknown |
| tenant_settings | Not found as dedicated table | Unknown | CORE expected | P1 Local Gap |
| patients | Not found | Unknown | REVENUE expected | P0 Local Gap |
| appointments | Not found | Unknown | REVENUE expected | P0 Local Gap |
| treatment_plans | Not found | Unknown | REVENUE expected | P0 Local Gap |
| reviews | Not found as patient-domain table | Unknown | REVENUE expected | P0 Local Gap |
| referrals | Not found as patient-domain table | Unknown | REVENUE expected | P0 Local Gap |
| attribution | JSON fields only; no dedicated table | Unknown | REVENUE expected | P0 Local Gap |
| workflows | Code registry exists; no canonical table | Unknown | WORKFLOW expected | P1 Local Gap |
| workflow_versions | Code governance exists; no confirmed table | Unknown | WORKFLOW expected | P1 Local Gap |
| workflow_executions | Not found; `workflow_runs` exists as orphaned local table | Unknown | WORKFLOW expected | P0 Local Gap |
| workflow_events | Not found; `automation_trace_events` exists | Unknown | WORKFLOW expected | P0 Local Gap |
| automation_execution_logs | Not found | Unknown | RUNTIME expected | P0 Local Gap |
| automation_retries | Not found | Unknown | RUNTIME expected | P0 Local Gap |
| automation_dead_letters | Exists locally | Unknown | RUNTIME | P0 Remote Unknown |
| analytics_metrics | `operational_metrics` exists locally | Unknown | ANALYTICS | P0 Remote Unknown |
| analytics_projections | No dedicated table | Unknown | ANALYTICS expected | P1 Local Gap |
| alice_agents | No dedicated table | Unknown | AI expected | P1 Local Gap |
| alice_insights | `insight_snapshots` and ALICE memory exist locally | Unknown | AI | P0 Remote Unknown |
| mission_control_metrics | No dedicated table; runtime fabric and analytics used | Unknown | MISSION_CONTROL expected | P1 Local Gap |

## Result

P0 REMOTE DRIFT UNKNOWN

Remote state must be discovered before drift can be eliminated.
