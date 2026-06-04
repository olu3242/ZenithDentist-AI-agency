# Forward Fix Plan

Date: 2026-06-01

## Rule

No forward-fix migration may be created until remote state is discovered.

Reason:

The sprint explicitly forbids assumptions and destructive or duplicate migrations. Remote Supabase state is currently blocked by access control.

## Candidate Forward Fixes

These are candidate migrations only. They are not created yet.

| Candidate Migration | Reason | Risk | Dependencies | Rollback Strategy |
| --- | --- | --- | --- | --- |
| `20260620100000_reconcile_revenue_domain.sql` | Required local entities `patients`, `appointments`, treatment plans, reviews, referrals, and attribution are not represented locally | High | Remote schema inventory; canonical domain approval | Forward rollback migration or backup restore |
| `20260620110000_reconcile_runtime_domain.sql` | Required runtime tables `workflow_executions`, `workflow_events`, `automation_execution_logs`, and `automation_retries` are absent locally | High | Remote runtime inventory; runtime owner approval | Forward rollback migration or backup restore |
| `20260620120000_reconcile_tenant_rls.sql` | Local migrations show service-role-only policies, not tenant/member policies | Critical | Remote policy inventory; tenant model approval | Forward rollback migration or backup restore |
| `20260620130000_reconcile_event_contract.sql` | Required event names are not fully evidenced locally | Medium | Event Fabric inventory and runtime trace evidence | Forward rollback migration or backup restore |

## P0 Blocker

Remote state access must be granted before any candidate migration is implemented.

## Result

PLAN ONLY

No forward-fix migration was created because remote evidence is unavailable.
