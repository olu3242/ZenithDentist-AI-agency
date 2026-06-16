-- Zenith Unified Intelligence Convergence
-- Extends ALICE as the single intelligence authority and Mission Control as the executive visibility layer.

create table if not exists public.entity_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('patient', 'provider', 'practice', 'location', 'workflow', 'organization')),
  entity_id text not null,
  score_type text not null check (score_type in ('health', 'growth', 'performance', 'risk', 'capacity', 'forecast', 'ltv', 'churn', 'referral', 'membership', 'treatment_acceptance')),
  score numeric not null default 0 check (score >= 0 and score <= 100),
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  metadata jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  unique (organization_id, entity_type, entity_id, score_type)
);

alter table public.alice_recommendations
  add column if not exists recommendation_type text,
  add column if not exists priority text not null default 'medium',
  add column if not exists impact text not null default 'moderate',
  add column if not exists estimated_value numeric not null default 0,
  add column if not exists source_domain text not null default 'alice',
  add column if not exists approved_at timestamptz,
  add column if not exists launched_workflow_id text;

create table if not exists public.forecast_engine (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null default 'practice' check (entity_type in ('patient', 'provider', 'practice', 'location', 'workflow', 'organization')),
  entity_id text not null,
  forecast_category text not null check (forecast_category in ('revenue', 'production', 'collections', 'membership', 'recall', 'provider_capacity')),
  horizon text not null check (horizon in ('30_day', '60_day', '90_day', '12_month')),
  forecast_value numeric not null default 0,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  source_domain text not null default 'alice',
  metadata jsonb not null default '{}'::jsonb,
  forecasted_at timestamptz not null default now(),
  unique (organization_id, entity_type, entity_id, forecast_category, horizon)
);

create table if not exists public.practice_twins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  current_state jsonb not null default '{}'::jsonb,
  projected_state jsonb not null default '{}'::jsonb,
  optimal_state jsonb not null default '{}'::jsonb,
  health_score numeric not null default 0 check (health_score >= 0 and health_score <= 100),
  growth_score numeric not null default 0 check (growth_score >= 0 and growth_score <= 100),
  risk_score numeric not null default 0 check (risk_score >= 0 and risk_score <= 100),
  capacity_score numeric not null default 0 check (capacity_score >= 0 and capacity_score <= 100),
  forecast_score numeric not null default 0 check (forecast_score >= 0 and forecast_score <= 100),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists public.autonomous_action_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  alice_recommendation_id uuid references public.alice_recommendations(id) on delete set null,
  recommended_action text not null,
  workflow_id text,
  workflow_payload jsonb not null default '{}'::jsonb,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected', 'launched', 'failed', 'measured')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  launched_at timestamptz,
  measured_at timestamptz,
  outcome jsonb not null default '{}'::jsonb,
  source_domain text not null default 'alice',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_entity_scores_org_entity on public.entity_scores(organization_id, entity_type, entity_id, score_type);
create index if not exists idx_entity_scores_org_score on public.entity_scores(organization_id, score_type, calculated_at desc);
create index if not exists idx_alice_recommendations_org_type on public.alice_recommendations(organization_id, recommendation_type, status);
create index if not exists idx_forecast_engine_org_category on public.forecast_engine(organization_id, forecast_category, horizon, forecasted_at desc);
create index if not exists idx_practice_twins_org_updated on public.practice_twins(organization_id, updated_at desc);
create index if not exists idx_autonomous_action_requests_org_status on public.autonomous_action_requests(organization_id, approval_status, created_at desc);

alter table public.entity_scores enable row level security;
alter table public.forecast_engine enable row level security;
alter table public.practice_twins enable row level security;
alter table public.autonomous_action_requests enable row level security;

create policy "entity_scores_service_all" on public.entity_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "forecast_engine_service_all" on public.forecast_engine for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "practice_twins_service_all" on public.practice_twins for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "autonomous_action_requests_service_all" on public.autonomous_action_requests for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
