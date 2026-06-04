create table if not exists public.alice_recommendation_traces (
  id uuid primary key default gen_random_uuid(),
  recommendation_id text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  source_events jsonb not null default '[]'::jsonb,
  evidence_summary text not null,
  confidence_score numeric(5,2) not null default 0,
  supporting_metrics jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  resolved_at timestamptz,
  outcome_id uuid
);

create table if not exists public.workflow_execution_evidence (
  id uuid primary key default gen_random_uuid(),
  workflow_id text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  execution_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'started' check (status in ('started', 'running', 'completed', 'failed', 'recovered')),
  duration_ms integer,
  trigger_source text not null,
  affected_entities jsonb not null default '[]'::jsonb,
  outcome_summary text not null default 'Execution evidence captured.',
  revenue_impact numeric(12,2) not null default 0,
  trace_id uuid
);

create table if not exists public.revenue_attribution_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  patient_id text,
  workflow_id text not null,
  campaign_id text,
  appointment_id text,
  opportunity text not null default 'Revenue recovery opportunity',
  recovered_amount numeric(12,2) not null default 0,
  generated_amount numeric(12,2) not null default 0,
  protected_amount numeric(12,2) not null default 0,
  attribution_confidence numeric(5,2) not null default 0,
  proof jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_control_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  event_type text not null,
  source_card text not null,
  workflow_id text,
  evidence_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_control_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  action_type text not null,
  source_card text not null,
  workflow_id text,
  actor text not null default 'system',
  status text not null default 'available' check (status in ('available', 'started', 'completed', 'failed')),
  evidence_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.mission_control_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  action_id uuid references public.mission_control_actions(id) on delete set null,
  outcome_type text not null,
  outcome_summary text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.connector_certifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  connector text not null,
  tenant text not null,
  connection_test boolean not null default false,
  read_test boolean not null default false,
  write_test boolean not null default false,
  rollback_test boolean not null default false,
  certification_status text not null default 'pending' check (certification_status in ('pending', 'pilot', 'certified', 'failed')),
  evidence jsonb not null default '{}'::jsonb,
  certified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  forecast_type text not null,
  generated_at timestamptz not null default now(),
  source_data_version text not null,
  forecast_output jsonb not null default '{}'::jsonb,
  forecast_accuracy numeric(5,2),
  trace_id uuid,
  data_source text not null default 'enterprise_forecasts'
);

create table if not exists public.report_generation_log (
  id uuid primary key default gen_random_uuid(),
  report_id text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  source_records jsonb not null default '[]'::jsonb,
  generated_by text not null default 'system',
  generated_at timestamptz not null default now(),
  downloaded_at timestamptz,
  trace_id uuid
);

create table if not exists public.role_workspace_certifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  role_key text not null,
  navigation boolean not null default false,
  permissions boolean not null default false,
  dashboard boolean not null default false,
  actions boolean not null default false,
  workflows boolean not null default false,
  reports boolean not null default false,
  certification_status text not null default 'pending' check (certification_status in ('pending', 'pilot', 'certified', 'failed')),
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.claim_registry (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  claim text not null,
  feature text not null,
  evidence_required jsonb not null default '[]'::jsonb,
  certification_status text not null default 'pilot' check (certification_status in ('certified', 'pilot', 'blocked')),
  owner text not null default 'Zenith Product',
  public_allowed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (claim, feature)
);

create index if not exists idx_alice_traces_org_generated on public.alice_recommendation_traces(organization_id, generated_at desc);
create index if not exists idx_workflow_evidence_org_started on public.workflow_execution_evidence(organization_id, started_at desc);
create index if not exists idx_workflow_evidence_workflow on public.workflow_execution_evidence(workflow_id, status);
create index if not exists idx_revenue_attribution_org_workflow on public.revenue_attribution_records(organization_id, workflow_id, created_at desc);
create index if not exists idx_mission_control_events_org on public.mission_control_events(organization_id, created_at desc);
create index if not exists idx_connector_certifications_org_connector on public.connector_certifications(organization_id, connector);
create index if not exists idx_forecast_runs_org_type on public.forecast_runs(organization_id, forecast_type, generated_at desc);
create index if not exists idx_report_generation_log_report on public.report_generation_log(report_id, generated_at desc);
create index if not exists idx_role_workspace_certifications_org_role on public.role_workspace_certifications(organization_id, role_key);
create index if not exists idx_claim_registry_org on public.claim_registry(organization_id);
create index if not exists idx_claim_registry_feature_status on public.claim_registry(feature, certification_status);

alter table public.alice_recommendation_traces enable row level security;
alter table public.workflow_execution_evidence enable row level security;
alter table public.revenue_attribution_records enable row level security;
alter table public.mission_control_events enable row level security;
alter table public.mission_control_actions enable row level security;
alter table public.mission_control_outcomes enable row level security;
alter table public.connector_certifications enable row level security;
alter table public.forecast_runs enable row level security;
alter table public.report_generation_log enable row level security;
alter table public.role_workspace_certifications enable row level security;
alter table public.claim_registry enable row level security;

drop policy if exists "service_role_all_alice_recommendation_traces" on public.alice_recommendation_traces;
create policy "service_role_all_alice_recommendation_traces" on public.alice_recommendation_traces for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_workflow_execution_evidence" on public.workflow_execution_evidence;
create policy "service_role_all_workflow_execution_evidence" on public.workflow_execution_evidence for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_revenue_attribution_records" on public.revenue_attribution_records;
create policy "service_role_all_revenue_attribution_records" on public.revenue_attribution_records for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_mission_control_events" on public.mission_control_events;
create policy "service_role_all_mission_control_events" on public.mission_control_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_mission_control_actions" on public.mission_control_actions;
create policy "service_role_all_mission_control_actions" on public.mission_control_actions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_mission_control_outcomes" on public.mission_control_outcomes;
create policy "service_role_all_mission_control_outcomes" on public.mission_control_outcomes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_connector_certifications" on public.connector_certifications;
create policy "service_role_all_connector_certifications" on public.connector_certifications for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_forecast_runs" on public.forecast_runs;
create policy "service_role_all_forecast_runs" on public.forecast_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_report_generation_log" on public.report_generation_log;
create policy "service_role_all_report_generation_log" on public.report_generation_log for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_role_workspace_certifications" on public.role_workspace_certifications;
create policy "service_role_all_role_workspace_certifications" on public.role_workspace_certifications for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "service_role_all_claim_registry" on public.claim_registry;
create policy "service_role_all_claim_registry" on public.claim_registry for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into public.claim_registry (organization_id, claim, feature, evidence_required, certification_status, owner, public_allowed)
values
  (null, 'Free Revenue Opportunity Assessment identifies missed revenue and automation opportunities.', 'Revenue Assessment', '["roi_assessments","audits","runtime_trace","lead_created_workflow"]'::jsonb, 'certified', 'Growth', true),
  (null, 'LIZ can recommend solutions, track conversions, escalate, and launch workflows.', 'LIZ', '["liz_action_events","workflow_execution_evidence","conversion_events"]'::jsonb, 'certified', 'Growth', true),
  (null, 'ALICE recommendations are explainable and traceable.', 'ALICE', '["alice_recommendation_traces","supporting_metrics","outcomes"]'::jsonb, 'pilot', 'Product', false),
  (null, 'Workflows produce auditable execution evidence.', 'Workflow OS', '["workflow_execution_evidence","automation_traces","workflow_events"]'::jsonb, 'pilot', 'Platform', false),
  (null, 'Recovered revenue is attributable to workflows and campaigns.', 'Revenue Attribution', '["revenue_attribution_records","appointment_proof","workflow_evidence"]'::jsonb, 'pilot', 'Revenue', false),
  (null, 'PMS connectors are production certified.', 'PMS Integrations', '["connector_certifications","read_test","write_test","rollback_test"]'::jsonb, 'pilot', 'Integrations', false)
on conflict (claim, feature) do update set
  evidence_required = excluded.evidence_required,
  certification_status = excluded.certification_status,
  owner = excluded.owner,
  public_allowed = excluded.public_allowed,
  updated_at = now();
