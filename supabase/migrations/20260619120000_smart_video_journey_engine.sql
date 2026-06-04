-- Smart Video Journey & Patient Influence Engine
-- Adds tenant-scoped video intelligence, patient journey, behavioral signal, and attribution tables.

create table if not exists public.video_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  journey_stage text,
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
  default_cta text,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
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
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
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
  channel text not null check (channel in ('sms', 'email', 'whatsapp', 'portal', 'mobile_app')),
  subject text,
  body text not null,
  cta_label text,
  cta_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.video_categories(id) on delete set null,
  name text not null,
  campaign_type text not null check (campaign_type in ('new_patient', 'cleaning', 'recall', 'treatment_acceptance', 'membership', 'review', 'referral', 'financing', 'recovery', 'custom')),
  objective text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  start_at timestamptz,
  end_at timestamptz,
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
  journey_type text not null check (journey_type in ('new_patient', 'cleaning', 'root_canal', 'implant', 'orthodontic', 'treatment_acceptance', 'recall_recovery', 'membership_enrollment', 'review_conversion', 'referral_conversion', 'financing_conversion')),
  lifecycle_stage text not null,
  objective text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  alice_strategy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'decision_journeys' AND column_name = 'journey_type'
  ) THEN
    ALTER TABLE public.decision_journeys
      ADD COLUMN journey_type text DEFAULT 'new_patient';
    UPDATE public.decision_journeys
      SET journey_type = 'new_patient'
      WHERE journey_type IS NULL;
    ALTER TABLE public.decision_journeys
      ALTER COLUMN journey_type SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'decision_journeys_journey_type_check'
  ) THEN
    ALTER TABLE public.decision_journeys
      ADD CONSTRAINT decision_journeys_journey_type_check
      CHECK (journey_type in ('new_patient', 'cleaning', 'root_canal', 'implant', 'orthodontic', 'treatment_acceptance', 'recall_recovery', 'membership_enrollment', 'review_conversion', 'referral_conversion', 'financing_conversion'));
  END IF;
END $$;

create table if not exists public.journey_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  decision_journey_id uuid not null references public.decision_journeys(id) on delete cascade,
  video_id uuid references public.video_library(id) on delete set null,
  template_id uuid references public.video_templates(id) on delete set null,
  step_order integer not null,
  timing_offset text not null,
  channel text not null check (channel in ('sms', 'email', 'whatsapp', 'portal', 'mobile_app')),
  trigger_condition text not null,
  next_best_action text,
  cta_label text,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
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
  channel text not null check (channel in ('sms', 'email', 'whatsapp', 'portal', 'mobile_app')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'opened', 'viewed', 'clicked', 'failed', 'recovered')),
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
  event_type text not null check (event_type in ('video_open', 'video_completion', 'rewatch', 'cta_click', 'portal_login', 'appointment_confirmation', 'treatment_scheduling', 'review_submission', 'referral_submission', 'membership_enrollment')),
  watch_percentage numeric(5,2),
  event_value numeric(12,2),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.behavioral_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text,
  source_event_id uuid references public.video_engagement_events(id) on delete set null,
  signal_type text not null,
  signal_strength numeric(5,2) not null default 0,
  attention_score integer not null default 0 check (attention_score between 0 and 100),
  relationship_score integer not null default 0 check (relationship_score between 0 and 100),
  retention_risk integer not null default 0 check (retention_risk between 0 and 100),
  membership_eligibility boolean not null default false,
  recommended_next_action text,
  created_at timestamptz not null default now()
);

create table if not exists public.engagement_patterns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text,
  pattern_name text not null,
  pattern_window text not null default '30d',
  open_rate numeric(5,2) not null default 0,
  completion_rate numeric(5,2) not null default 0,
  cta_rate numeric(5,2) not null default 0,
  conversion_rate numeric(5,2) not null default 0,
  attention_score integer not null default 0 check (attention_score between 0 and 100),
  computed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.conversion_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text,
  profile_type text not null check (profile_type in ('treatment_acceptance', 'recall_recovery', 'membership', 'review', 'referral', 'financing')),
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  preferred_channel text check (preferred_channel in ('sms', 'email', 'whatsapp', 'portal', 'mobile_app')),
  best_cta text,
  best_timing text,
  expected_revenue_impact numeric(12,2) not null default 0,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (organization_id, patient_external_id, profile_type)
);

create table if not exists public.journey_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  decision_journey_id uuid references public.decision_journeys(id) on delete set null,
  video_campaign_id uuid references public.video_campaigns(id) on delete set null,
  patient_external_id text,
  outcome_type text not null check (outcome_type in ('appointment_kept', 'treatment_accepted', 'membership_enrolled', 'review_submitted', 'referral_generated', 'recall_scheduled', 'revenue_recovered', 'revenue_protected')),
  outcome_value numeric(12,2) not null default 0,
  revenue_influenced numeric(12,2) not null default 0,
  revenue_recovered numeric(12,2) not null default 0,
  revenue_protected numeric(12,2) not null default 0,
  occurred_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.video_attribution_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  video_delivery_id uuid references public.video_deliveries(id) on delete set null,
  journey_outcome_id uuid references public.journey_outcomes(id) on delete set null,
  workflow_execution_id uuid,
  attribution_model text not null default 'influence_weighted',
  revenue_influenced numeric(12,2) not null default 0,
  revenue_recovered numeric(12,2) not null default 0,
  revenue_protected numeric(12,2) not null default 0,
  attribution_weight numeric(5,2) not null default 1,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_video_categories_org on public.video_categories(organization_id);
create index if not exists idx_provider_video_profiles_org on public.provider_video_profiles(organization_id);
create index if not exists idx_video_library_org_status on public.video_library(organization_id, status);
create index if not exists idx_video_templates_org_channel on public.video_templates(organization_id, channel);
create index if not exists idx_video_campaigns_org_status on public.video_campaigns(organization_id, status);
create index if not exists idx_decision_journeys_org_type on public.decision_journeys(organization_id, journey_type);
create index if not exists idx_journey_steps_journey on public.journey_steps(decision_journey_id, step_order);
create index if not exists idx_video_deliveries_org_status on public.video_deliveries(organization_id, status);
create index if not exists idx_video_deliveries_patient on public.video_deliveries(organization_id, patient_external_id);
create index if not exists idx_video_engagement_events_org_type on public.video_engagement_events(organization_id, event_type);
create index if not exists idx_behavioral_signals_patient on public.behavioral_signals(organization_id, patient_external_id);
create index if not exists idx_engagement_patterns_patient on public.engagement_patterns(organization_id, patient_external_id);
create index if not exists idx_conversion_profiles_org_type on public.conversion_profiles(organization_id, profile_type);
create index if not exists idx_journey_outcomes_org_type on public.journey_outcomes(organization_id, outcome_type);
create index if not exists idx_video_attribution_org on public.video_attribution_records(organization_id);

alter table public.video_categories enable row level security;
alter table public.provider_video_profiles enable row level security;
alter table public.video_library enable row level security;
alter table public.video_templates enable row level security;
alter table public.video_campaigns enable row level security;
alter table public.decision_journeys enable row level security;
alter table public.journey_steps enable row level security;
alter table public.video_deliveries enable row level security;
alter table public.video_engagement_events enable row level security;
alter table public.behavioral_signals enable row level security;
alter table public.engagement_patterns enable row level security;
alter table public.conversion_profiles enable row level security;
alter table public.journey_outcomes enable row level security;
alter table public.video_attribution_records enable row level security;

drop policy if exists "video_categories_members_read" on public.video_categories;
create policy "video_categories_members_read" on public.video_categories for select using (
  exists (select 1 from public.organization_members om where om.organization_id = video_categories.organization_id and om.user_id = auth.uid())
);
drop policy if exists "provider_video_profiles_members_read" on public.provider_video_profiles;
create policy "provider_video_profiles_members_read" on public.provider_video_profiles for select using (
  exists (select 1 from public.organization_members om where om.organization_id = provider_video_profiles.organization_id and om.user_id = auth.uid())
);
drop policy if exists "video_library_members_read" on public.video_library;
create policy "video_library_members_read" on public.video_library for select using (
  exists (select 1 from public.organization_members om where om.organization_id = video_library.organization_id and om.user_id = auth.uid())
);
drop policy if exists "video_templates_members_read" on public.video_templates;
create policy "video_templates_members_read" on public.video_templates for select using (
  exists (select 1 from public.organization_members om where om.organization_id = video_templates.organization_id and om.user_id = auth.uid())
);
drop policy if exists "video_campaigns_members_read" on public.video_campaigns;
create policy "video_campaigns_members_read" on public.video_campaigns for select using (
  exists (select 1 from public.organization_members om where om.organization_id = video_campaigns.organization_id and om.user_id = auth.uid())
);
drop policy if exists "decision_journeys_members_read" on public.decision_journeys;
create policy "decision_journeys_members_read" on public.decision_journeys for select using (
  exists (select 1 from public.organization_members om where om.organization_id = decision_journeys.organization_id and om.user_id = auth.uid())
);
drop policy if exists "journey_steps_members_read" on public.journey_steps;
create policy "journey_steps_members_read" on public.journey_steps for select using (
  exists (select 1 from public.organization_members om where om.organization_id = journey_steps.organization_id and om.user_id = auth.uid())
);
drop policy if exists "video_deliveries_members_read" on public.video_deliveries;
create policy "video_deliveries_members_read" on public.video_deliveries for select using (
  exists (select 1 from public.organization_members om where om.organization_id = video_deliveries.organization_id and om.user_id = auth.uid())
);
drop policy if exists "video_engagement_events_members_read" on public.video_engagement_events;
create policy "video_engagement_events_members_read" on public.video_engagement_events for select using (
  exists (select 1 from public.organization_members om where om.organization_id = video_engagement_events.organization_id and om.user_id = auth.uid())
);
drop policy if exists "behavioral_signals_members_read" on public.behavioral_signals;
create policy "behavioral_signals_members_read" on public.behavioral_signals for select using (
  exists (select 1 from public.organization_members om where om.organization_id = behavioral_signals.organization_id and om.user_id = auth.uid())
);
drop policy if exists "engagement_patterns_members_read" on public.engagement_patterns;
create policy "engagement_patterns_members_read" on public.engagement_patterns for select using (
  exists (select 1 from public.organization_members om where om.organization_id = engagement_patterns.organization_id and om.user_id = auth.uid())
);
drop policy if exists "conversion_profiles_members_read" on public.conversion_profiles;
create policy "conversion_profiles_members_read" on public.conversion_profiles for select using (
  exists (select 1 from public.organization_members om where om.organization_id = conversion_profiles.organization_id and om.user_id = auth.uid())
);
drop policy if exists "journey_outcomes_members_read" on public.journey_outcomes;
create policy "journey_outcomes_members_read" on public.journey_outcomes for select using (
  exists (select 1 from public.organization_members om where om.organization_id = journey_outcomes.organization_id and om.user_id = auth.uid())
);
drop policy if exists "video_attribution_records_members_read" on public.video_attribution_records;
create policy "video_attribution_records_members_read" on public.video_attribution_records for select using (
  exists (select 1 from public.organization_members om where om.organization_id = video_attribution_records.organization_id and om.user_id = auth.uid())
);

drop policy if exists "video_categories_service_all" on public.video_categories;
create policy "video_categories_service_all" on public.video_categories for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "provider_video_profiles_service_all" on public.provider_video_profiles;
create policy "provider_video_profiles_service_all" on public.provider_video_profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "video_library_service_all" on public.video_library;
create policy "video_library_service_all" on public.video_library for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "video_templates_service_all" on public.video_templates;
create policy "video_templates_service_all" on public.video_templates for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "video_campaigns_service_all" on public.video_campaigns;
create policy "video_campaigns_service_all" on public.video_campaigns for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "decision_journeys_service_all" on public.decision_journeys;
create policy "decision_journeys_service_all" on public.decision_journeys for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "journey_steps_service_all" on public.journey_steps;
create policy "journey_steps_service_all" on public.journey_steps for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "video_deliveries_service_all" on public.video_deliveries;
create policy "video_deliveries_service_all" on public.video_deliveries for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "video_engagement_events_service_all" on public.video_engagement_events;
create policy "video_engagement_events_service_all" on public.video_engagement_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "behavioral_signals_service_all" on public.behavioral_signals;
create policy "behavioral_signals_service_all" on public.behavioral_signals for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "engagement_patterns_service_all" on public.engagement_patterns;
create policy "engagement_patterns_service_all" on public.engagement_patterns for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "conversion_profiles_service_all" on public.conversion_profiles;
create policy "conversion_profiles_service_all" on public.conversion_profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "journey_outcomes_service_all" on public.journey_outcomes;
create policy "journey_outcomes_service_all" on public.journey_outcomes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "video_attribution_records_service_all" on public.video_attribution_records;
create policy "video_attribution_records_service_all" on public.video_attribution_records for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
