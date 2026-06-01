# Migration Manifest

Date: 2026-06-01

This manifest is the migration authority for PROS. Every new migration must include:

- Migration ID
- Purpose
- Dependencies
- Affected Tables
- Rollback Strategy
- Risk Level
- Owner

## Governance Rules

- Historical migrations before `20260615000000_canonical_baseline.sql` are frozen legacy history.
- Do not rename, reorder, edit, squash, or delete historical migrations.
- All new migrations after the baseline must use `YYYYMMDDHHMMSS_description.sql`.
- Every new migration must be additive unless explicitly approved with backup/restore evidence.

## Frozen Legacy History

These files are retained for historical replay only and must not be modified:

| Migration ID | Purpose | Dependencies | Affected Tables | Rollback Strategy | Risk Level | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 040_runtime_trace_system | Runtime trace legacy tables | None recorded | `automation_traces`, `automation_trace_events`, `automation_dead_letters` | Restore backup; do not edit legacy migration | High | Legacy |
| 041_operational_memory_incidents | Operational memory and incident legacy tables | `040_runtime_trace_system` | `operational_memory_entries`, `operational_incidents`, `operational_incident_events`, `provider_health_snapshots`, `executive_report_snapshots` | Restore backup; do not edit legacy migration | High | Legacy |
| 042_governance_self_healing | Governance and self-healing legacy tables | `041_operational_memory_incidents` | `runtime_governance_policies`, `runtime_governance_decisions`, `runtime_audit_timeline`, `autonomous_recovery_actions`, `operational_simulation_runs` | Restore backup; do not edit legacy migration | High | Legacy |
| 043_operational_cloud_mesh | Operational agent mesh legacy tables | `042_governance_self_healing` | `operational_agents`, `agent_bus_messages`, `swarm_consensus_runs`, `operational_digital_twins`, `infrastructure_awareness_snapshots` | Restore backup; do not edit legacy migration | High | Legacy |
| 044_gap_closure_platformization | Platformization legacy tables | `043_operational_cloud_mesh` | `runtime_event_fabric_events`, `recovery_orchestration_runs`, `tenant_onboarding_runs`, `operational_extensions`, `operational_api_keys`, `operational_usage_meters` | Restore backup; do not edit legacy migration | High | Legacy |
| 045_gtm_delivery_growth | GTM and delivery legacy tables | `044_gap_closure_platformization` | `gtm_prospects`, `operational_audits_gtm`, `client_onboarding_playbooks`, `case_study_results`, `client_success_accounts`, `referral_flywheel_events`, `service_packages`, `authority_content_assets` | Restore backup; do not edit legacy migration | High | Legacy |
| 046_production_hardening_operational_tables | Production hardening legacy tables | `organizations`, `leads`, `automation_events` | `automation_queue`, `automation_failures`, `workflow_runs`, `agent_logs`, `billing_events`, `subscription_entitlements`, `usage_counters`, `analytics_events` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210001 | Lead and public funnel schema | None recorded | `leads`, `roi_calculations`, `audits`, `bookings`, `outreach_events`, `faq_interactions` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210002 | AI operations schema | `202605210001` | `automation_events`, `operational_metrics`, `insight_snapshots`, `recommendations`, `reports`, `notifications` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210003 | Multitenant SaaS schema | `202605210001`, `202605210002` | `organizations`, `organization_members`, `locations`, `user_roles`, `subscription_plans`, `usage_metrics`, `benchmark_snapshots` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210004 | Autonomous OS legacy schema | `202605210003` | `operational_scores`, `alice_conversations`, `alice_messages`, `alice_memory`, `approval_events`, event tables | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210005 | Healthcare cloud legacy schema | `202605210003` | `pms_integrations`, `normalized_healthcare_events`, `healthcare_cloud_layers`, `revenue_orchestration_runs`, enterprise tables | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210006 | Operational stability legacy schema | `202605210005` | `open_dental_sync_checkpoints`, `operational_event_ledger`, `queue_events`, `replay_events`, intelligence tables | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210007 | E2E automation audit legacy schema | `202605210003` | `automation_blueprints`, `automation_audit_runs`, `automation_coverage_results` | Restore backup; do not edit legacy migration | Medium | Legacy |
| 202605310001 | First user bootstrap profiles | `202605210003` | `profiles` | Restore backup; do not edit legacy migration | Medium | Legacy |
| 202605310002 | Automation OS registry | `202605210003` | `automation_registry` | Restore backup; do not edit legacy migration | Medium | Legacy |

## Active Governance Baseline

Migration ID: 20260615000000

Purpose:

Establish the canonical migration governance baseline and freeze all prior mixed-number migrations as legacy history.

Dependencies:

- All frozen legacy migrations listed above.

Affected Tables:

- None. This is a no-op governance marker.

Rollback Strategy:

- No rollback required. If this marker is applied incorrectly, restore from backup and replay the approved migration chain.

Risk Level:

- Low

Owner:

- Zenith Platform Governance

## Active Forward Migrations

| Migration ID | Purpose | Dependencies | Affected Tables | Rollback Strategy | Risk Level | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 20260601150000 | Commercialize ROI calculator into FREE Revenue Opportunity Assessment storage model | `202605210001` | `roi_calculations`, `audits` | Forward rollback migration to drop added assessment columns after backup restore validation | Medium | Zenith Platform |
| 20260616000000 | Repair core tenancy bootstrap and product/runtime support tables | `20260615000000`, `202605210003`, `202605310001` | `organizations`, `profiles`, `organization_members`, `onboarding_states`, `storefronts`, `products`, `orders`, `workflow_events`, `platform_events`, `tenant_onboarding_runs` | Restore backup before migration or apply forward migration to archive/drop newly added repair tables after data export | High | Zenith Platform |

### Migration ID: 20260616000000

Purpose:

Repair deployments where the public schema cache does not contain the core tenancy bootstrap tables required by signup, onboarding, dashboard filtering, and runtime event routing.

Dependencies:

- 20260615000000
- 202605210003
- 202605310001

Affected Tables:

- `organizations`
- `profiles`
- `organization_members`
- `onboarding_states`
- `storefronts`
- `products`
- `orders`
- `workflow_events`
- `platform_events`
- `tenant_onboarding_runs`

Rollback Strategy:

Restore a pre-migration database backup if this repair is applied to the wrong project. If data is already written, export affected rows, apply a forward rollback migration, and replay validated core tenancy migrations.

Risk Level:

High

Owner:

Zenith Platform

## Future Migration Template

Migration ID: `YYYYMMDDHHMMSS`

Purpose:

Describe the single forward-only schema change.

Dependencies:

List exact migration IDs required before this migration.

Affected Tables:

List all tables created, altered, indexed, or policy-modified.

Rollback Strategy:

Describe restore path or forward rollback migration.

Risk Level:

Low / Medium / High / Critical

Owner:

Named owner.
