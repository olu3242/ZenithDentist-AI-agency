-- Video Engagement OS, Smart Video Journey Engine, and Patient Influence Engine.
-- Canonical tenant-scoped foundation. Do not duplicate these tables in later migrations.

create table if not exists public.video_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  journey_key text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.provider_video_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  specialty text,
  languages text[] not null default array['en'],
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_library (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.video_categories(id) on delete set null,
  provider_video_profile_id uuid references public.provider_video_profiles(id) on delete set null,
  title text not null,
  video_url text not null,
  thumbnail_url text,
  transcript text,
  language text not null default 'en',
  version integer not null default 1,
  status text not null default 'draft',
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.video_categories(id) on delete set null,
  name text not null,
  channel text not null,
  subject text,
  body text not null,
  cta_label text,
  cta_url text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.video_categories(id) on delete set null,
  name text not null,
  journey_key text not null,
  objective text not null,
  status text not null default 'draft',
  target_rules jsonb not null default '{}'::jsonb,
  kpis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decision_journeys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  video_campaign_id uuid references public.video_campaigns(id) on delete set null,
  name text not null,
  journey_key text not null,
  lifecycle_stage text not null,
  objective text not null,
  status text not null default 'draft',
  alice_strategy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journey_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  decision_journey_id uuid not null references public.decision_journeys(id) on delete cascade,
  video_id uuid references public.video_library(id) on delete set null,
  template_id uuid references public.video_templates(id) on delete set null,
  step_order integer not null,
  timing_offset text not null,
  channel text not null,
  trigger_condition text not null,
  next_best_action text,
  cta_label text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (decision_journey_id, step_order)
);

create table if not exists public.video_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  video_campaign_id uuid references public.video_campaigns(id) on delete set null,
  decision_journey_id uuid references public.decision_journeys(id) on delete set null,
  journey_step_id uuid references public.journey_steps(id) on delete set null,
  video_id uuid references public.video_library(id) on delete set null,
  patient_external_id text,
  workflow_execution_id uuid,
  channel text not null,
  status text not null default 'queued',
  delivery_provider text,
  provider_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  viewed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_engagement_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  video_delivery_id uuid references public.video_deliveries(id) on delete cascade,
  video_id uuid references public.video_library(id) on delete set null,
  patient_external_id text,
  event_type text not null,
  watch_percentage numeric(5,2),
  event_value numeric(12,2),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.video_attribution_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  video_delivery_id uuid references public.video_deliveries(id) on delete set null,
  workflow_execution_id uuid,
  attribution_model text not null default 'influence_weighted',
  revenue_influenced numeric(12,2) not null default 0,
  revenue_recovered numeric(12,2) not null default 0,
  revenue_protected numeric(12,2) not null default 0,
  attribution_weight numeric(5,2) not null default 1,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_video_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  video_campaign_id uuid references public.video_campaigns(id) on delete set null,
  patient_external_id text not null,
  journey_key text not null,
  status text not null default 'active',
  current_step text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.patient_video_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_video_campaign_id uuid references public.patient_video_campaigns(id) on delete cascade,
  video_delivery_id uuid references public.video_deliveries(id) on delete set null,
  patient_external_id text not null,
  event_type text not null,
  event_score integer not null default 0,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.patient_video_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text not null,
  video_engagement_score integer not null default 0 check (video_engagement_score between 0 and 100),
  attention_score integer not null default 0 check (attention_score between 0 and 100),
  relationship_health_score integer not null default 0 check (relationship_health_score between 0 and 100),
  review_activity_score integer not null default 0 check (review_activity_score between 0 and 100),
  referral_activity_score integer not null default 0 check (referral_activity_score between 0 and 100),
  visit_consistency_score integer not null default 0 check (visit_consistency_score between 0 and 100),
  last_event_at timestamptz,
  computed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (organization_id, patient_external_id)
);

create index if not exists idx_video_categories_org on public.video_categories(organization_id);
create index if not exists idx_provider_video_profiles_org on public.provider_video_profiles(organization_id);
create index if not exists idx_video_library_org_status on public.video_library(organization_id, status);
create index if not exists idx_video_templates_org_channel on public.video_templates(organization_id, channel);
create index if not exists idx_video_campaigns_org_status on public.video_campaigns(organization_id, status);
create index if not exists idx_decision_journeys_org_key on public.decision_journeys(organization_id, journey_key);
create index if not exists idx_journey_steps_journey on public.journey_steps(decision_journey_id, step_order);
create index if not exists idx_video_deliveries_org_status on public.video_deliveries(organization_id, status);
create index if not exists idx_video_engagement_events_org_type on public.video_engagement_events(organization_id, event_type);
create index if not exists idx_video_attribution_org on public.video_attribution_records(organization_id);
create index if not exists idx_patient_video_campaigns_patient on public.patient_video_campaigns(organization_id, patient_external_id);
create index if not exists idx_patient_video_events_patient on public.patient_video_events(organization_id, patient_external_id);
create index if not exists idx_patient_video_scores_patient on public.patient_video_scores(organization_id, patient_external_id);

alter table public.video_categories enable row level security;
alter table public.provider_video_profiles enable row level security;
alter table public.video_library enable row level security;
alter table public.video_templates enable row level security;
alter table public.video_campaigns enable row level security;
alter table public.decision_journeys enable row level security;
alter table public.journey_steps enable row level security;
alter table public.video_deliveries enable row level security;
alter table public.video_engagement_events enable row level security;
alter table public.video_attribution_records enable row level security;
alter table public.patient_video_campaigns enable row level security;
alter table public.patient_video_events enable row level security;
alter table public.patient_video_scores enable row level security;

create policy "video_categories_service_all" on public.video_categories for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "provider_video_profiles_service_all" on public.provider_video_profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "video_library_service_all" on public.video_library for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "video_templates_service_all" on public.video_templates for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "video_campaigns_service_all" on public.video_campaigns for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "decision_journeys_service_all" on public.decision_journeys for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "journey_steps_service_all" on public.journey_steps for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "video_deliveries_service_all" on public.video_deliveries for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "video_engagement_events_service_all" on public.video_engagement_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "video_attribution_records_service_all" on public.video_attribution_records for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_video_campaigns_service_all" on public.patient_video_campaigns for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_video_events_service_all" on public.patient_video_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_video_scores_service_all" on public.patient_video_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
