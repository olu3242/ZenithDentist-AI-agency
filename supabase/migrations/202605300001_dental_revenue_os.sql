-- ============================================================
-- Dental Revenue OS — Production Migration
-- 202605300001_dental_revenue_os.sql
-- ============================================================

-- ─── Helper: updated_at trigger function (idempotent) ────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── practice_profiles ───────────────────────────────────────────────────────
create table if not exists public.practice_profiles (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  practice_name     text not null,
  tax_id            text,
  npi               text,
  specialty         text,
  phone             text,
  email             text,
  website           text,
  metadata          jsonb not null default '{}',
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid
);
create index if not exists idx_practice_profiles_org on public.practice_profiles(organization_id);
create index if not exists idx_practice_profiles_created on public.practice_profiles(created_at);
alter table public.practice_profiles enable row level security;
create policy "org members read practice_profiles"
  on public.practice_profiles for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_practice_profiles_updated_at
  before update on public.practice_profiles
  for each row execute function public.set_updated_at();

-- ─── practice_locations ──────────────────────────────────────────────────────
create table if not exists public.practice_locations (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  practice_id       uuid references public.practice_profiles(id) on delete cascade,
  location_name     text not null,
  address_line1     text,
  address_line2     text,
  city              text,
  state             text,
  zip               text,
  country           text default 'US',
  phone             text,
  is_primary        boolean not null default false,
  metadata          jsonb not null default '{}',
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid
);
create index if not exists idx_practice_locations_org on public.practice_locations(organization_id);
create index if not exists idx_practice_locations_created on public.practice_locations(created_at);
alter table public.practice_locations enable row level security;
create policy "org members read practice_locations"
  on public.practice_locations for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_practice_locations_updated_at
  before update on public.practice_locations
  for each row execute function public.set_updated_at();

-- ─── practice_metrics ────────────────────────────────────────────────────────
create table if not exists public.practice_metrics (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  practice_id           uuid references public.practice_profiles(id) on delete cascade,
  metric_date           date not null,
  production_amount     numeric(12,2),
  collection_amount     numeric(12,2),
  new_patients          integer,
  active_patients       integer,
  no_show_count         integer,
  cancellation_count    integer,
  hygiene_production    numeric(12,2),
  doctor_production     numeric(12,2),
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_practice_metrics_org on public.practice_metrics(organization_id);
create index if not exists idx_practice_metrics_created on public.practice_metrics(created_at);
create index if not exists idx_practice_metrics_date on public.practice_metrics(metric_date);
alter table public.practice_metrics enable row level security;
create policy "org members read practice_metrics"
  on public.practice_metrics for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_practice_metrics_updated_at
  before update on public.practice_metrics
  for each row execute function public.set_updated_at();

-- ─── revenue_recovery_events ─────────────────────────────────────────────────
create table if not exists public.revenue_recovery_events (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  workflow_execution_id text,
  patient_id            text,
  recovery_type         text not null,
  amount_recovered      numeric(12,2),
  status                text not null default 'pending',
  outcome               text,
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_revenue_recovery_events_org on public.revenue_recovery_events(organization_id);
create index if not exists idx_revenue_recovery_events_created on public.revenue_recovery_events(created_at);
alter table public.revenue_recovery_events enable row level security;
create policy "org members read revenue_recovery_events"
  on public.revenue_recovery_events for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_revenue_recovery_events_updated_at
  before update on public.revenue_recovery_events
  for each row execute function public.set_updated_at();

-- ─── recall_recovery_events ──────────────────────────────────────────────────
create table if not exists public.recall_recovery_events (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  workflow_execution_id text,
  patient_id            text,
  recall_type           text,
  outreach_channel      text,
  appointment_booked    boolean not null default false,
  revenue_attributed    numeric(12,2),
  status                text not null default 'pending',
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_recall_recovery_events_org on public.recall_recovery_events(organization_id);
create index if not exists idx_recall_recovery_events_created on public.recall_recovery_events(created_at);
alter table public.recall_recovery_events enable row level security;
create policy "org members read recall_recovery_events"
  on public.recall_recovery_events for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_recall_recovery_events_updated_at
  before update on public.recall_recovery_events
  for each row execute function public.set_updated_at();

-- ─── review_growth_events ────────────────────────────────────────────────────
create table if not exists public.review_growth_events (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  workflow_execution_id text,
  patient_id            text,
  platform              text,
  request_sent_at       timestamptz,
  review_received_at    timestamptz,
  star_rating           integer check (star_rating between 1 and 5),
  converted             boolean not null default false,
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_review_growth_events_org on public.review_growth_events(organization_id);
create index if not exists idx_review_growth_events_created on public.review_growth_events(created_at);
alter table public.review_growth_events enable row level security;
create policy "org members read review_growth_events"
  on public.review_growth_events for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_review_growth_events_updated_at
  before update on public.review_growth_events
  for each row execute function public.set_updated_at();

-- ─── chair_utilization_snapshots ─────────────────────────────────────────────
create table if not exists public.chair_utilization_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  location_id           uuid references public.practice_locations(id) on delete set null,
  snapshot_date         date not null,
  total_chairs          integer not null default 0,
  occupied_hours        numeric(8,2) not null default 0,
  available_hours       numeric(8,2) not null default 0,
  utilization_pct       numeric(5,2),
  revenue_per_chair     numeric(12,2),
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_chair_utilization_snapshots_org on public.chair_utilization_snapshots(organization_id);
create index if not exists idx_chair_utilization_snapshots_created on public.chair_utilization_snapshots(created_at);
alter table public.chair_utilization_snapshots enable row level security;
create policy "org members read chair_utilization_snapshots"
  on public.chair_utilization_snapshots for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_chair_utilization_snapshots_updated_at
  before update on public.chair_utilization_snapshots
  for each row execute function public.set_updated_at();

-- ─── discovery_sessions ──────────────────────────────────────────────────────
create table if not exists public.discovery_sessions (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  lead_id               text,
  session_type          text not null default 'initial',
  conducted_by          uuid,
  conducted_at          timestamptz,
  duration_minutes      integer,
  pain_points           jsonb not null default '[]',
  qualified             boolean,
  next_steps            text,
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_discovery_sessions_org on public.discovery_sessions(organization_id);
create index if not exists idx_discovery_sessions_created on public.discovery_sessions(created_at);
alter table public.discovery_sessions enable row level security;
create policy "org members read discovery_sessions"
  on public.discovery_sessions for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_discovery_sessions_updated_at
  before update on public.discovery_sessions
  for each row execute function public.set_updated_at();

-- ─── practice_assessments ────────────────────────────────────────────────────
create table if not exists public.practice_assessments (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  practice_id           uuid references public.practice_profiles(id) on delete cascade,
  assessed_at           timestamptz not null default now(),
  health_score          integer check (health_score between 0 and 100),
  revenue_score         integer check (revenue_score between 0 and 100),
  retention_score       integer check (retention_score between 0 and 100),
  scheduling_score      integer check (scheduling_score between 0 and 100),
  reputation_score      integer check (reputation_score between 0 and 100),
  findings              jsonb not null default '[]',
  recommendations       jsonb not null default '[]',
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_practice_assessments_org on public.practice_assessments(organization_id);
create index if not exists idx_practice_assessments_created on public.practice_assessments(created_at);
alter table public.practice_assessments enable row level security;
create policy "org members read practice_assessments"
  on public.practice_assessments for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_practice_assessments_updated_at
  before update on public.practice_assessments
  for each row execute function public.set_updated_at();

-- ─── opportunity_scores ──────────────────────────────────────────────────────
create table if not exists public.opportunity_scores (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  opportunity_type      text not null,
  opportunity_ref_id    text,
  score                 numeric(5,2) not null default 0,
  confidence            numeric(5,2) not null default 0,
  estimated_value       numeric(12,2),
  priority_rank         integer,
  expires_at            timestamptz,
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_opportunity_scores_org on public.opportunity_scores(organization_id);
create index if not exists idx_opportunity_scores_created on public.opportunity_scores(created_at);
alter table public.opportunity_scores enable row level security;
create policy "org members read opportunity_scores"
  on public.opportunity_scores for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_opportunity_scores_updated_at
  before update on public.opportunity_scores
  for each row execute function public.set_updated_at();

-- ─── roi_projections ─────────────────────────────────────────────────────────
create table if not exists public.roi_projections (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  projection_period     text not null,
  period_start          date not null,
  period_end            date not null,
  projected_revenue     numeric(12,2),
  actual_revenue        numeric(12,2),
  projected_roi_pct     numeric(8,2),
  actual_roi_pct        numeric(8,2),
  variance_pct          numeric(8,2),
  confidence            numeric(5,2),
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_roi_projections_org on public.roi_projections(organization_id);
create index if not exists idx_roi_projections_created on public.roi_projections(created_at);
alter table public.roi_projections enable row level security;
create policy "org members read roi_projections"
  on public.roi_projections for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_roi_projections_updated_at
  before update on public.roi_projections
  for each row execute function public.set_updated_at();

-- ─── automation_baselines ────────────────────────────────────────────────────
create table if not exists public.automation_baselines (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  automation_id         text not null,
  baseline_period_start date not null,
  baseline_period_end   date not null,
  metric_name           text not null,
  baseline_value        numeric(16,4),
  unit                  text,
  sample_size           integer,
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_automation_baselines_org on public.automation_baselines(organization_id);
create index if not exists idx_automation_baselines_created on public.automation_baselines(created_at);
alter table public.automation_baselines enable row level security;
create policy "org members read automation_baselines"
  on public.automation_baselines for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_automation_baselines_updated_at
  before update on public.automation_baselines
  for each row execute function public.set_updated_at();

-- ─── automation_results ──────────────────────────────────────────────────────
create table if not exists public.automation_results (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  automation_id         text not null,
  baseline_id           uuid references public.automation_baselines(id) on delete set null,
  result_period_start   date not null,
  result_period_end     date not null,
  metric_name           text not null,
  result_value          numeric(16,4),
  unit                  text,
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_automation_results_org on public.automation_results(organization_id);
create index if not exists idx_automation_results_created on public.automation_results(created_at);
alter table public.automation_results enable row level security;
create policy "org members read automation_results"
  on public.automation_results for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_automation_results_updated_at
  before update on public.automation_results
  for each row execute function public.set_updated_at();

-- ─── impact_measurements ─────────────────────────────────────────────────────
create table if not exists public.impact_measurements (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  automation_id         text not null,
  baseline_id           uuid references public.automation_baselines(id) on delete set null,
  result_id             uuid references public.automation_results(id) on delete set null,
  metric_name           text not null,
  baseline_value        numeric(16,4),
  result_value          numeric(16,4),
  delta_value           numeric(16,4),
  delta_pct             numeric(8,2),
  unit                  text,
  measured_at           timestamptz not null default now(),
  metadata              jsonb not null default '{}',
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);
create index if not exists idx_impact_measurements_org on public.impact_measurements(organization_id);
create index if not exists idx_impact_measurements_created on public.impact_measurements(created_at);
alter table public.impact_measurements enable row level security;
create policy "org members read impact_measurements"
  on public.impact_measurements for select
  using (organization_id = (select organization_id from public.organization_members where user_id = auth.uid() limit 1));
create trigger trg_impact_measurements_updated_at
  before update on public.impact_measurements
  for each row execute function public.set_updated_at();
