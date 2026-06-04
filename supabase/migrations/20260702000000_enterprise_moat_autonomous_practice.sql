-- Zenith MVP 2 Batches 25-32 Enterprise Moat and Autonomous Practice Roadmap
-- Extends Workflow OS, Mission Control, ALICE, Patient Revenue Engine, Patient OS, and Digital Dentist Twin.

create table if not exists public.pms_intelligence_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor text not null check (vendor in ('open_dental', 'dentrix', 'eaglesoft', 'denticon')),
  event_type text not null check (event_type in ('appointment_anomaly', 'production_anomaly', 'recall_anomaly', 'treatment_anomaly', 'sync_signal', 'data_quality_signal')),
  severity text not null default 'moderate',
  event_payload jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.pms_health_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor text not null check (vendor in ('open_dental', 'dentrix', 'eaglesoft', 'denticon')),
  health_score integer not null default 0 check (health_score between 0 and 100),
  appointment_score integer not null default 0 check (appointment_score between 0 and 100),
  production_score integer not null default 0 check (production_score between 0 and 100),
  recall_score integer not null default 0 check (recall_score between 0 and 100),
  treatment_score integer not null default 0 check (treatment_score between 0 and 100),
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.pms_data_quality_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor text not null check (vendor in ('open_dental', 'dentrix', 'eaglesoft', 'denticon')),
  completeness_score integer not null default 0 check (completeness_score between 0 and 100),
  freshness_score integer not null default 0 check (freshness_score between 0 and 100),
  mapping_score integer not null default 0 check (mapping_score between 0 and 100),
  reliability_score integer not null default 0 check (reliability_score between 0 and 100),
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.insurance_claim_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  claim_external_id text not null,
  claim_status text not null check (claim_status in ('outstanding', 'denied', 'aging', 'underpaid', 'paid')),
  recovery_score integer not null default 0 check (recovery_score between 0 and 100),
  claim_amount numeric not null default 0,
  payer_name text,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.insurance_delay_risks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  claim_external_id text,
  risk_type text not null check (risk_type in ('outstanding', 'denied', 'aging', 'underpaid')),
  days_aging integer not null default 0,
  amount_at_risk numeric not null default 0,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  detected_at timestamptz not null default now(),
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.insurance_recovery_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  opportunity_type text not null check (opportunity_type in ('outstanding_claims', 'denied_claims', 'aging_claims', 'underpaid_claims')),
  potential_recovery numeric not null default 0,
  priority_rank integer not null default 0,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  recovery_plan jsonb not null default '{}'::jsonb,
  collection_priority text not null default 'standard',
  status text not null default 'identified',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.provider_performance_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_external_id text not null,
  provider_name text,
  performance_score integer not null default 0 check (performance_score between 0 and 100),
  production numeric not null default 0,
  collections numeric not null default 0,
  treatment_acceptance_rate numeric not null default 0,
  review_count integer not null default 0,
  referral_count integer not null default 0,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.provider_growth_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_external_id text not null,
  growth_score integer not null default 0 check (growth_score between 0 and 100),
  production_growth numeric not null default 0,
  collections_growth numeric not null default 0,
  treatment_acceptance_lift numeric not null default 0,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.provider_capacity_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_external_id text not null,
  capacity_score integer not null default 0 check (capacity_score between 0 and 100),
  available_hours numeric not null default 0,
  utilization_rate numeric not null default 0,
  open_production_capacity numeric not null default 0,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.hygiene_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  hygiene_score integer not null default 0 check (hygiene_score between 0 and 100),
  recall_completion_rate numeric not null default 0,
  perio_conversion_rate numeric not null default 0,
  hygiene_retention_rate numeric not null default 0,
  hygiene_revenue numeric not null default 0,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.hygiene_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  opportunity_type text not null check (opportunity_type in ('recall_completion', 'perio_conversion', 'hygiene_retention')),
  revenue_potential numeric not null default 0,
  priority_rank integer not null default 0,
  alice_growth_plan jsonb not null default '{}'::jsonb,
  status text not null default 'identified',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.hygiene_retention_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text,
  retention_score integer not null default 0 check (retention_score between 0 and 100),
  recall_completion_probability numeric not null default 0,
  next_recall_date date,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  agent_key text not null check (agent_key in ('recall_coordinator', 'treatment_coordinator', 'review_coordinator', 'membership_coordinator', 'reactivation_coordinator')),
  agent_name text not null,
  workflow_domain text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (organization_id, agent_key)
);

create table if not exists public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.ai_agents(id) on delete set null,
  workflow_id text not null,
  assignment_type text not null,
  assigned_to_role text not null default 'workflow_os',
  status text not null default 'queued',
  due_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.agent_performance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.ai_agents(id) on delete cascade,
  actions_completed integer not null default 0,
  recovery_value numeric not null default 0,
  success_rate numeric not null default 0,
  escalation_rate numeric not null default 0,
  performance_score integer not null default 0 check (performance_score between 0 and 100),
  measured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.education_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  asset_key text not null,
  treatment_category text not null,
  asset_type text not null check (asset_type in ('video', 'faq', 'guide', 'interactive')),
  title text not null,
  digital_twin_context jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.treatment_education_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text,
  treatment_category text not null,
  understanding_score integer not null default 0 check (understanding_score between 0 and 100),
  video_engagement_score integer not null default 0 check (video_engagement_score between 0 and 100),
  faq_usage_count integer not null default 0,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.education_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  education_asset_id uuid references public.education_assets(id) on delete set null,
  patient_external_id text,
  treatment_category text not null,
  treatment_accepted boolean,
  acceptance_lift numeric not null default 0,
  revenue_influenced numeric not null default 0,
  measured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.practice_forecasts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  forecast_period text not null,
  production_forecast numeric not null default 0,
  collections_forecast numeric not null default 0,
  recall_revenue_forecast numeric not null default 0,
  membership_growth_forecast numeric not null default 0,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  forecasted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.growth_forecasts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  forecast_period text not null,
  growth_category text not null,
  forecast_value numeric not null default 0,
  expected_lift numeric not null default 0,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  forecasted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.risk_forecasts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  risk_category text not null check (risk_category in ('churn', 'production', 'collections', 'recall', 'membership')),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  revenue_at_risk numeric not null default 0,
  mitigation_plan jsonb not null default '{}'::jsonb,
  forecasted_at timestamptz not null default now(),
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.autonomous_growth_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_type text not null check (plan_type in ('weekly', 'monthly', 'quarterly')),
  plan_name text not null,
  revenue_goal numeric not null default 0,
  actions jsonb not null default '[]'::jsonb,
  expected_lift numeric not null default 0,
  approval_status text not null default 'recommended',
  generated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_pms_intelligence_events_org on public.pms_intelligence_events(organization_id, vendor, event_type, status);
create index if not exists idx_pms_health_scores_org on public.pms_health_scores(organization_id, vendor, scored_at desc);
create index if not exists idx_pms_data_quality_scores_org on public.pms_data_quality_scores(organization_id, vendor, scored_at desc);
create index if not exists idx_insurance_claim_scores_org on public.insurance_claim_scores(organization_id, claim_status, scored_at desc);
create index if not exists idx_insurance_delay_risks_org on public.insurance_delay_risks(organization_id, risk_type, status);
create index if not exists idx_insurance_recovery_opportunities_org on public.insurance_recovery_opportunities(organization_id, priority_rank, status);
create index if not exists idx_provider_performance_scores_org on public.provider_performance_scores(organization_id, provider_external_id, scored_at desc);
create index if not exists idx_provider_growth_scores_org on public.provider_growth_scores(organization_id, provider_external_id, scored_at desc);
create index if not exists idx_provider_capacity_scores_org on public.provider_capacity_scores(organization_id, provider_external_id, scored_at desc);
create index if not exists idx_hygiene_scores_org on public.hygiene_scores(organization_id, scored_at desc);
create index if not exists idx_hygiene_opportunities_org on public.hygiene_opportunities(organization_id, priority_rank, status);
create index if not exists idx_hygiene_retention_scores_org on public.hygiene_retention_scores(organization_id, retention_score desc);
create index if not exists idx_ai_agents_org on public.ai_agents(organization_id, agent_key, status);
create index if not exists idx_agent_assignments_org on public.agent_assignments(organization_id, workflow_id, status);
create index if not exists idx_agent_performance_org on public.agent_performance(organization_id, measured_at desc);
create index if not exists idx_education_assets_org on public.education_assets(organization_id, treatment_category, active);
create index if not exists idx_treatment_education_scores_org on public.treatment_education_scores(organization_id, treatment_category, scored_at desc);
create index if not exists idx_education_outcomes_org on public.education_outcomes(organization_id, treatment_category, measured_at desc);
create index if not exists idx_practice_forecasts_org on public.practice_forecasts(organization_id, forecast_period, forecasted_at desc);
create index if not exists idx_growth_forecasts_org on public.growth_forecasts(organization_id, growth_category, forecasted_at desc);
create index if not exists idx_risk_forecasts_org on public.risk_forecasts(organization_id, risk_category, status);
create index if not exists idx_autonomous_growth_plans_org on public.autonomous_growth_plans(organization_id, plan_type, approval_status);

alter table public.pms_intelligence_events enable row level security;
alter table public.pms_health_scores enable row level security;
alter table public.pms_data_quality_scores enable row level security;
alter table public.insurance_claim_scores enable row level security;
alter table public.insurance_delay_risks enable row level security;
alter table public.insurance_recovery_opportunities enable row level security;
alter table public.provider_performance_scores enable row level security;
alter table public.provider_growth_scores enable row level security;
alter table public.provider_capacity_scores enable row level security;
alter table public.hygiene_scores enable row level security;
alter table public.hygiene_opportunities enable row level security;
alter table public.hygiene_retention_scores enable row level security;
alter table public.ai_agents enable row level security;
alter table public.agent_assignments enable row level security;
alter table public.agent_performance enable row level security;
alter table public.education_assets enable row level security;
alter table public.treatment_education_scores enable row level security;
alter table public.education_outcomes enable row level security;
alter table public.practice_forecasts enable row level security;
alter table public.growth_forecasts enable row level security;
alter table public.risk_forecasts enable row level security;
alter table public.autonomous_growth_plans enable row level security;

create policy "pms_intelligence_events_service_all" on public.pms_intelligence_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "pms_health_scores_service_all" on public.pms_health_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "pms_data_quality_scores_service_all" on public.pms_data_quality_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "insurance_claim_scores_service_all" on public.insurance_claim_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "insurance_delay_risks_service_all" on public.insurance_delay_risks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "insurance_recovery_opportunities_service_all" on public.insurance_recovery_opportunities for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "provider_performance_scores_service_all" on public.provider_performance_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "provider_growth_scores_service_all" on public.provider_growth_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "provider_capacity_scores_service_all" on public.provider_capacity_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "hygiene_scores_service_all" on public.hygiene_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "hygiene_opportunities_service_all" on public.hygiene_opportunities for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "hygiene_retention_scores_service_all" on public.hygiene_retention_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "ai_agents_service_all" on public.ai_agents for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "agent_assignments_service_all" on public.agent_assignments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "agent_performance_service_all" on public.agent_performance for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "education_assets_service_all" on public.education_assets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "treatment_education_scores_service_all" on public.treatment_education_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "education_outcomes_service_all" on public.education_outcomes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "practice_forecasts_service_all" on public.practice_forecasts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "growth_forecasts_service_all" on public.growth_forecasts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "risk_forecasts_service_all" on public.risk_forecasts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "autonomous_growth_plans_service_all" on public.autonomous_growth_plans for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
