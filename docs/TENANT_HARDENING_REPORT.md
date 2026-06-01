# Tenant Hardening Report — PROS Core Tables Audit

**Generated:** 2026-06-01  
**Platform:** ZenithDentist AI / Patient Revenue Operating System  
**Migration Set:** 202606010001 + 202606010002

---

## 1. Tables Audited

### Pre-existing tables (96 unique tables across migrations 040–202605310002)

| Table | organization_id | RLS Enabled |
|---|---|---|
| agent_bus_messages | yes | yes |
| agent_logs | yes | yes |
| ai_governance_records | yes | yes |
| alice_conversations | yes | yes |
| alice_enterprise_memory | yes | yes |
| alice_memory | yes | yes |
| alice_messages | yes | yes |
| analytics_events | yes | yes |
| anomaly_validations | yes | yes |
| approval_events | yes | yes |
| audits | yes | yes |
| authority_content_assets | yes | yes |
| automation_audit_runs | yes | yes |
| automation_blueprints | yes | yes |
| automation_coverage_results | yes | yes |
| automation_dead_letters | yes | yes |
| automation_events | yes | yes |
| automation_failures | yes | yes |
| automation_queue | yes | yes |
| automation_trace_events | yes | yes |
| automation_traces | yes | yes |
| autonomous_recovery_actions | yes | yes |
| benchmark_snapshots | yes | yes |
| billing_events | yes | yes |
| bookings | yes | yes |
| case_study_results | yes | yes |
| client_onboarding_playbooks | yes | yes |
| client_success_accounts | yes | yes |
| enterprise_forecasts | yes | yes |
| enterprise_playbooks | yes | yes |
| enterprise_simulations | yes | yes |
| executive_report_snapshots | yes | yes |
| faq_interactions | yes | yes |
| forecast_accuracy | yes | yes |
| gtm_prospects | yes | yes |
| healthcare_cloud_layers | yes | yes |
| infrastructure_awareness_snapshots | yes | yes |
| insight_snapshots | yes | yes |
| intelligence_runs | yes | yes |
| knowledge_graph_edges | yes | yes |
| knowledge_graph_nodes | yes | yes |
| leads | yes | yes |
| locations | yes | yes |
| normalized_healthcare_events | yes | yes |
| notifications | yes | yes |
| open_dental_sync_checkpoints | yes | yes |
| operational_agents | yes | yes |
| operational_api_keys | yes | yes |
| operational_audits_gtm | yes | yes |
| operational_digital_twins | yes | yes |
| operational_event_ledger | yes | yes |
| operational_extensions | yes | yes |
| operational_health_snapshots | yes | yes |
| operational_incident_events | yes | yes |
| operational_incidents | yes | yes |
| operational_memory_entries | yes | yes |
| operational_metrics | yes | yes |
| operational_playbooks | yes | yes |
| operational_scores | yes | yes |
| operational_simulation_runs | yes | yes |
| operational_usage_meters | yes | yes |
| orchestration_logs | yes | yes |
| organization_members | yes | yes |
| organizations | n/a (root) | yes |
| outreach_events | yes | yes |
| pms_integrations | yes | yes |
| provider_health_snapshots | yes | yes |
| queue_events | yes | yes |
| recommendation_events | yes | yes |
| recommendation_lineage | yes | yes |
| recommendations | yes | yes |
| recovery_orchestration_runs | yes | yes |
| referral_flywheel_events | yes | yes |
| replay_events | yes | yes |
| reports | yes | yes |
| revenue_orchestration_runs | yes | yes |
| roi_calculations | yes | yes |
| runtime_audit_timeline | yes | yes |
| runtime_event_fabric_events | yes | yes |
| runtime_governance_decisions | yes | yes |
| runtime_governance_policies | yes | yes |
| service_packages | yes | yes |
| subscription_entitlements | yes | yes |
| subscription_plans | yes | yes |
| swarm_consensus_runs | yes | yes |
| tenant_onboarding_runs | yes | yes |
| usage_counters | yes | yes |
| usage_metrics | yes | yes |
| user_roles | yes | yes |
| workflow_runs | yes | yes |
| **Dental Revenue OS tables (202605300001)** | | |
| practice_profiles | yes | yes |
| practice_locations | yes | yes |
| practice_metrics | yes | yes |
| revenue_recovery_events | yes | yes |
| recall_recovery_events | yes | yes |
| review_growth_events | yes | yes |
| chair_utilization_snapshots | yes | yes |
| discovery_sessions | yes | yes |
| practice_assessments | yes | yes |
| opportunity_scores | yes | yes |
| roi_projections | yes | yes |
| automation_baselines | yes | yes |
| automation_results | yes | yes |
| impact_measurements | yes | yes |

**Pre-existing total: ~109 tables**

---

### New tables added in 202606010001 (6 tables)

| Table | Purpose |
|---|---|
| **patients** | Patient master record synced from PMS (Dentrix, Eaglesoft, Open Dental, Denticon). Central entity for all patient-centric workflows. |
| **appointments** | Appointment records synced from PMS. Tracks scheduled, confirmed, completed, cancelled, and no-show states with production value. |
| **workflow_executions** | Canonical execution record linking a workflow definition to its runtime outcome. References automation_traces, patients, and appointments for full traceability. |
| **workflow_events** | Step-level event log within a workflow execution. Captures individual step transitions, payloads, and timing. |
| **automation_retries** | Retry tracking for failed automation traces and workflow executions. Records attempt history, failure reasons, and next retry schedule. |
| **automation_execution_logs** | Verbose execution logging with log levels (debug/info/warn/error). Supports structured context for observability and debugging. |

**Grand total: ~115 tables**

---

## 2. RLS Policies

All 6 new tables use the `{table}_org_isolation` policy pattern:

```sql
FOR ALL USING (
  organization_id IN (
    SELECT unnest(ARRAY(
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
    ))
  )
)
```

This pattern supports multi-organization membership (a user belonging to multiple orgs) and is consistent with the broader platform RLS approach introduced in `202605300002_rls_tenant_isolation.sql`.

All new tables: `ENABLE ROW LEVEL SECURITY` confirmed.

---

## 3. Attribution Linkage (202606010002)

The revenue attribution migration connects workflow execution records to revenue outcomes via foreign keys and a unified view.

### Columns added

| Table | Column Added | Purpose |
|---|---|---|
| revenue_recovery_events | workflow_execution_id | Trace recovered revenue to triggering workflow |
| recall_recovery_events | workflow_execution_id | Trace recall appointment booking to workflow |
| recall_recovery_events | patient_id | Link recall events directly to patient record |
| review_growth_events | workflow_execution_id | Trace review conversion to workflow |
| chair_utilization_snapshots | workflow_execution_id | Correlate utilization changes to workflow activity |

### View: workflow_revenue_attribution

Provides a denormalized, query-friendly attribution surface:

```
execution_id → organization_id, workflow_id, patient_id, trigger_name,
               execution_status, started_at, completed_at,
               revenue_recovered, recovery_type,
               recall_booked (0/1), review_generated (0/1)
```

---

## 4. Index Coverage

### New table indexes

| Table | Indexes |
|---|---|
| patients | organization_id, created_at DESC |
| appointments | organization_id, created_at DESC, patient_id, scheduled_at, status |
| workflow_executions | organization_id, created_at DESC, workflow_id, patient_id, status |
| workflow_events | organization_id, occurred_at DESC, execution_id |
| automation_retries | organization_id, created_at DESC |
| automation_execution_logs | organization_id, logged_at DESC |

### Attribution indexes (partial, WHERE IS NOT NULL)

- `idx_revenue_recovery_execution` on revenue_recovery_events(workflow_execution_id)
- `idx_recall_recovery_execution` on recall_recovery_events(workflow_execution_id)
- `idx_recall_recovery_patient` on recall_recovery_events(patient_id)
- `idx_review_growth_execution` on review_growth_events(workflow_execution_id)

Partial indexes reduce index size and improve lookup performance for sparse FK columns.

---

## 5. Production Recommendations

1. **PMS sync jobs** should populate `patients.pms_source` and `patients.external_id` to ensure deduplication across Dentrix / Eaglesoft / Open Dental / Denticon sources.

2. **workflow_executions.status** should be kept updated in real time. The `running` status must transition to `completed` or `failed` within a configurable TTL; add a cron job to mark stale `running` executions as `failed`.

3. **automation_execution_logs** will grow rapidly. Implement a retention policy (e.g., partition by month or delete logs older than 90 days for `debug`/`info` levels).

4. **patients.lifetime_value** should be recalculated nightly from completed appointment `production_value` totals rather than stored as a mutable field, to avoid write contention.

5. **workflow_revenue_attribution view** uses LEFT JOINs; if a workflow execution has multiple matched revenue events (e.g., multiple recall bookings), rows will fan out. Callers should aggregate with `SUM`/`MAX` as appropriate.

6. **RBAC**: The current RLS policies allow any organization member to read/write all six new tables. Consider adding role-gated policies (staff vs. admin) once `202605310001_rbac_roles.sql` is fully enforced across all tenants.
