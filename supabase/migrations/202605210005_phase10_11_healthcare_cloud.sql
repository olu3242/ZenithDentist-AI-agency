create type pms_provider_key as enum ('dentrix', 'eaglesoft', 'open_dental', 'carestream', 'future_provider');
create type integration_status as enum ('configured', 'syncing', 'degraded', 'paused', 'failed');
create type cloud_layer_key as enum (
  'operational_intelligence',
  'revenue_orchestration',
  'patient_engagement',
  'benchmark_intelligence',
  'autonomous_optimization',
  'ai_recommendation',
  'enterprise_governance',
  'healthcare_api',
  'operational_memory',
  'simulation_intelligence'
);
create type alice_operational_mode as enum (
  'executive_intelligence',
  'forecasting',
  'benchmark_analysis',
  'enterprise_coordination',
  'autonomous_recommendation',
  'operational_risk_analysis'
);
create type governance_status as enum ('draft', 'review_required', 'approved', 'rejected', 'active', 'rolled_back');

create table public.pms_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  provider pms_provider_key not null,
  status integration_status not null default 'configured',
  display_name text not null,
  sync_cursor text,
  last_sync_at timestamptz,
  last_success_at timestamptz,
  failover_provider pms_provider_key,
  configuration jsonb not null default '{}'::jsonb,
  health_score numeric(5,2) not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.normalized_healthcare_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  integration_id uuid references public.pms_integrations(id) on delete set null,
  source_provider pms_provider_key not null,
  event_type text not null,
  occurred_at timestamptz not null,
  patient_ref text,
  provider_ref text,
  appointment_ref text,
  normalized_payload jsonb not null default '{}'::jsonb,
  forecast_features jsonb not null default '{}'::jsonb,
  benchmark_features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.healthcare_cloud_layers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  layer_key cloud_layer_key not null,
  status integration_status not null default 'configured',
  confidence numeric(5,2) not null default 0.85,
  throughput_score numeric(5,2) not null default 90,
  coordination_score numeric(5,2) not null default 90,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (organization_id, layer_key)
);

create table public.revenue_orchestration_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_at timestamptz not null default now(),
  leakage_detected numeric(12,2) not null default 0,
  recovery_prioritized numeric(12,2) not null default 0,
  chair_utilization numeric(5,2) not null default 0,
  hygiene_retention numeric(5,2) not null default 0,
  bottlenecks jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  confidence numeric(5,2) not null default 0.85
);

create table public.knowledge_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  node_type text not null,
  label text not null,
  properties jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) not null default 0.80,
  created_at timestamptz not null default now()
);

create table public.knowledge_graph_edges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  source_node_id uuid not null references public.knowledge_graph_nodes(id) on delete cascade,
  target_node_id uuid not null references public.knowledge_graph_nodes(id) on delete cascade,
  relationship_type text not null,
  weight numeric(6,3) not null default 1,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.enterprise_forecasts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  forecast_type text not null,
  forecast_window text not null,
  probability numeric(5,2) not null,
  projected_impact jsonb not null default '{}'::jsonb,
  drivers jsonb not null default '[]'::jsonb,
  recommended_response jsonb not null default '[]'::jsonb,
  confidence numeric(5,2) not null default 0.80,
  generated_at timestamptz not null default now()
);

create table public.enterprise_playbooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  trigger_logic jsonb not null default '{}'::jsonb,
  escalation_paths jsonb not null default '[]'::jsonb,
  optimization_recommendations jsonb not null default '[]'::jsonb,
  rollback_logic jsonb not null default '{}'::jsonb,
  generated_adaptations jsonb not null default '[]'::jsonb,
  outcome_tracking jsonb not null default '{}'::jsonb,
  status playbook_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.alice_enterprise_memory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  mode alice_operational_mode not null,
  memory_title text not null,
  memory_body text not null,
  semantic_ref text,
  lineage jsonb not null default '{}'::jsonb,
  benchmark_context jsonb not null default '{}'::jsonb,
  effectiveness_score numeric(5,2),
  created_at timestamptz not null default now()
);

create table public.enterprise_simulations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_name text not null,
  scenario_inputs jsonb not null default '{}'::jsonb,
  projected_enterprise_impact jsonb not null default '{}'::jsonb,
  staffing_pressure numeric(5,2) not null default 0,
  retention_trajectory numeric(5,2) not null default 0,
  operational_resilience numeric(5,2) not null default 0,
  revenue_recovery_projection numeric(12,2) not null default 0,
  benchmark_movement jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) not null default 0.80,
  created_at timestamptz not null default now()
);

create table public.ai_governance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  governed_object_type text not null,
  governed_object_id uuid,
  status governance_status not null default 'review_required',
  approval_chain jsonb not null default '[]'::jsonb,
  risk_controls jsonb not null default '[]'::jsonb,
  rollback_plan jsonb not null default '{}'::jsonb,
  audit_notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.orchestration_events (like public.recommendation_events including all);
alter table public.orchestration_events alter column event_type set default 'orchestration';

create table public.enterprise_events (like public.recommendation_events including all);
alter table public.enterprise_events alter column event_type set default 'enterprise';

create table public.intelligence_events (like public.recommendation_events including all);
alter table public.intelligence_events alter column event_type set default 'intelligence';

create table public.benchmark_events (like public.recommendation_events including all);
alter table public.benchmark_events alter column event_type set default 'benchmark';

create table public.operational_risk_events (like public.recommendation_events including all);
alter table public.operational_risk_events alter column event_type set default 'operational_risk';

create table public.forecasting_events (like public.recommendation_events including all);
alter table public.forecasting_events alter column event_type set default 'forecasting';

create index idx_pms_integrations_org_status on public.pms_integrations(organization_id, status);
create index idx_healthcare_events_org_type on public.normalized_healthcare_events(organization_id, event_type, occurred_at desc);
create index idx_cloud_layers_org_key on public.healthcare_cloud_layers(organization_id, layer_key);
create index idx_revenue_orchestration_org_run on public.revenue_orchestration_runs(organization_id, run_at desc);
create index idx_graph_nodes_org_type on public.knowledge_graph_nodes(organization_id, node_type);
create index idx_graph_edges_org_relationship on public.knowledge_graph_edges(organization_id, relationship_type);
create index idx_enterprise_forecasts_org_type on public.enterprise_forecasts(organization_id, forecast_type, generated_at desc);
create index idx_enterprise_playbooks_org_category on public.enterprise_playbooks(organization_id, category);
create index idx_alice_enterprise_memory_org_mode on public.alice_enterprise_memory(organization_id, mode);
create index idx_enterprise_simulations_org on public.enterprise_simulations(organization_id, created_at desc);
create index idx_ai_governance_org_status on public.ai_governance_records(organization_id, status);
create index idx_orchestration_events_org on public.orchestration_events(organization_id, created_at desc);
create index idx_enterprise_events_org on public.enterprise_events(organization_id, created_at desc);
create index idx_intelligence_events_org on public.intelligence_events(organization_id, created_at desc);
create index idx_benchmark_events_org on public.benchmark_events(organization_id, created_at desc);
create index idx_operational_risk_events_org on public.operational_risk_events(organization_id, created_at desc);
create index idx_forecasting_events_org on public.forecasting_events(organization_id, created_at desc);

alter table public.pms_integrations enable row level security;
alter table public.normalized_healthcare_events enable row level security;
alter table public.healthcare_cloud_layers enable row level security;
alter table public.revenue_orchestration_runs enable row level security;
alter table public.knowledge_graph_nodes enable row level security;
alter table public.knowledge_graph_edges enable row level security;
alter table public.enterprise_forecasts enable row level security;
alter table public.enterprise_playbooks enable row level security;
alter table public.alice_enterprise_memory enable row level security;
alter table public.enterprise_simulations enable row level security;
alter table public.ai_governance_records enable row level security;
alter table public.orchestration_events enable row level security;
alter table public.enterprise_events enable row level security;
alter table public.intelligence_events enable row level security;
alter table public.benchmark_events enable row level security;
alter table public.operational_risk_events enable row level security;
alter table public.forecasting_events enable row level security;

create policy "service_role_all_pms_integrations" on public.pms_integrations for all using (auth.role() = 'service_role');
create policy "service_role_all_normalized_healthcare_events" on public.normalized_healthcare_events for all using (auth.role() = 'service_role');
create policy "service_role_all_healthcare_cloud_layers" on public.healthcare_cloud_layers for all using (auth.role() = 'service_role');
create policy "service_role_all_revenue_orchestration_runs" on public.revenue_orchestration_runs for all using (auth.role() = 'service_role');
create policy "service_role_all_knowledge_graph_nodes" on public.knowledge_graph_nodes for all using (auth.role() = 'service_role');
create policy "service_role_all_knowledge_graph_edges" on public.knowledge_graph_edges for all using (auth.role() = 'service_role');
create policy "service_role_all_enterprise_forecasts" on public.enterprise_forecasts for all using (auth.role() = 'service_role');
create policy "service_role_all_enterprise_playbooks" on public.enterprise_playbooks for all using (auth.role() = 'service_role');
create policy "service_role_all_alice_enterprise_memory" on public.alice_enterprise_memory for all using (auth.role() = 'service_role');
create policy "service_role_all_enterprise_simulations" on public.enterprise_simulations for all using (auth.role() = 'service_role');
create policy "service_role_all_ai_governance_records" on public.ai_governance_records for all using (auth.role() = 'service_role');
create policy "service_role_all_orchestration_events" on public.orchestration_events for all using (auth.role() = 'service_role');
create policy "service_role_all_enterprise_events" on public.enterprise_events for all using (auth.role() = 'service_role');
create policy "service_role_all_intelligence_events" on public.intelligence_events for all using (auth.role() = 'service_role');
create policy "service_role_all_benchmark_events" on public.benchmark_events for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_risk_events" on public.operational_risk_events for all using (auth.role() = 'service_role');
create policy "service_role_all_forecasting_events" on public.forecasting_events for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.orchestration_events;
alter publication supabase_realtime add table public.enterprise_events;
alter publication supabase_realtime add table public.intelligence_events;
alter publication supabase_realtime add table public.benchmark_events;
alter publication supabase_realtime add table public.operational_risk_events;
alter publication supabase_realtime add table public.forecasting_events;
