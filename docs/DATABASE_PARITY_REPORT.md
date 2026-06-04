# Database Parity Report

## Status: LOCAL CERTIFIED — Remote Parity Blocked

**Date:** 2026-06-03  
**Project Ref:** `yjbxhlfiwqhhuvgpcrey`

---

## Parity Assessment

| Dimension | Local | Remote | Delta |
|-----------|-------|--------|-------|
| Migration files | 39 | UNKNOWN (CLI blocked) | UNKNOWN |
| Tables defined | 248 | UNKNOWN | UNKNOWN |
| RLS policies | 290+ | UNKNOWN | UNKNOWN |
| Indexes | 308 | UNKNOWN | UNKNOWN |

---

## Local Schema — Full Table Inventory (248 tables)

### Organizations / Tenancy (8 tables)
```
public.authorized_domains
public.organization_members
public.organizations
public.profiles
public.provider_video_profiles
public.tenant_onboarding_runs
public.user_roles
public.conversion_profiles
```

### Revenue Recovery System (12 tables)
```
public.appointment_attributions
public.audits
public.bookings
public.leads
public.roi_calculations
public.treatment_acceptances
public.treatment_attributions
public.treatment_declines
public.treatment_estimates
public.treatment_plans
public.patient_journey_evidence
public.operational_audits_gtm
```

### Automation Platform (12 tables)
```
public.automation_audit_runs
public.automation_blueprints
public.automation_dead_letters
public.automation_events
public.automation_queue
public.automation_registry
public.automation_trace_events
public.automation_traces
public.recovery_orchestration_runs
public.replay_events
public.runtime_event_fabric_events
public.workflow_runs
```

### ALICE Intelligence (22 tables)
```
public.alice_change_events
public.alice_confidence
public.alice_conversations
public.alice_decisions
public.alice_enterprise_memory
public.alice_evidence
public.alice_memory
public.alice_messages
public.alice_outcomes
public.alice_platform_observations
public.alice_reasoning
public.alice_recommendation_traces
public.alice_recommendations
public.alice_refresh_events
public.insight_snapshots
public.intelligence_runs
public.knowledge_graph_edges
public.knowledge_graph_nodes
public.recommendation_events
public.recommendation_lineage
public.recommendation_outcome_events
public.recommendations
```

### Revenue Attribution (11 tables)
```
public.cta_events
public.enterprise_forecasts
public.forecast_accuracy
public.forecast_runs
public.forecasting_events
public.gtm_prospects
public.opportunities
public.outreach_events
public.referral_flywheel_events
public.revenue_attribution_records
public.revenue_attributions
```

### Communications / Video (15 tables)
```
public.faq_interactions
public.liz_action_events
public.message_templates
public.notifications
public.patient_video_campaigns
public.patient_video_events
public.patient_video_scores
public.provider_video_profiles
public.video_attribution_records
public.video_attributions
public.video_campaigns
public.video_categories
public.video_deliveries
public.video_engagement_events
public.video_library
```

### Executive Dashboard (12 tables)
```
public.automation_dead_letters
public.mission_control_actions
public.mission_control_events
public.mission_control_outcomes
public.operational_agents
public.operational_digital_twins
public.operational_health_snapshots
public.operational_incident_events
public.operational_incidents
public.operational_memory_entries
public.operational_metrics
public.operational_scores
```

### Operational OS (additional)
```
public.operational_api_keys
public.operational_audits_gtm
public.operational_event_ledger
public.operational_extensions
public.operational_memory_entries
public.operational_playbooks
public.operational_risk_events
public.operational_simulation_runs
public.operational_usage_meters
public.infrastructure_awareness_snapshots
public.operational_agents
public.swarm_consensus_runs
public.agent_bus_messages
```

### Recovery / DLQ
```
public.workflow_recovery_actions
public.workflow_recovery_events
public.workflow_recovery_metrics
public.recovery_orchestration_runs
public.autonomous_recovery_actions
```

### GTM / Sales
```
public.gtm_prospects
public.sales_pipeline (no schema prefix in migration)
public.sales_activities
public.practice_benchmarks
public.pilot_scorecards
public.pilot_roi_reports
public.pilot_daily_metrics
public.pilot_health_events
public.pilot_journey_performance
```

### Client Success
```
public.client_success_accounts
public.client_onboarding_playbooks
public.client_health_scores
public.implementation_projects
public.implementation_tasks
public.implementation_milestones
```

---

## Known Parity Risk

Migration files without `config.toml` and without remote access token verification means **zero confirmed parity** with the production database. The remote database may be:

1. **Ahead** — if migrations were applied directly via Supabase dashboard (unlikely)
2. **Behind** — most likely scenario: 5-25 recent migrations pending
3. **Divergent** — if schema was edited directly in the dashboard without corresponding migrations

**Action required:** Run `supabase migration list` with auth to establish baseline.

---

## Estimated Parity Gap

Based on migration timestamps vs. last known remote state:

| Migration | Status |
|-----------|--------|
| 040–046 (legacy) | Likely Applied |
| 2026-05-21 phases | Likely Applied |
| 2026-05-31 onward | LIKELY PENDING |
| 2026-06-03+ | LIKELY PENDING |

**Estimated pending:** 15–20 migrations
