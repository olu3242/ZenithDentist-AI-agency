create type gtm_pipeline_stage as enum (
  'prospect_identified',
  'outreach_sent',
  'loom_audit_delivered',
  'discovery_booked',
  'proposal_sent',
  'closed_won',
  'onboarding',
  'live_optimization',
  'case_study_candidate',
  'referral_opportunity'
);

create type client_success_status as enum ('healthy', 'watch', 'at_risk', 'expansion_ready');

create table public.gtm_prospects (
  id uuid primary key default gen_random_uuid(),
  organization_id text,
  practice_name text not null,
  contact_name text,
  email text,
  phone text,
  city text,
  state text,
  source text not null default 'google_maps',
  pipeline_stage gtm_pipeline_stage not null default 'prospect_identified',
  lead_score integer not null default 0,
  estimated_monthly_opportunity numeric(14,2) not null default 0,
  personalization_notes text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.operational_audits_gtm (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.gtm_prospects(id) on delete set null,
  audit_type text not null default 'operational_revenue_audit',
  no_show_findings text,
  review_findings text,
  recall_findings text,
  retention_findings text,
  revenue_leakage_estimate numeric(14,2) not null default 0,
  loom_url text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.client_onboarding_playbooks (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  client_name text not null,
  status text not null default 'intake',
  pms_assessment jsonb not null default '{}'::jsonb,
  baseline_scores jsonb not null default '{}'::jsonb,
  implementation_roadmap jsonb not null default '[]'::jsonb,
  launch_checklist jsonb not null default '[]'::jsonb,
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_study_results (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  client_name text not null,
  before_metrics jsonb not null default '{}'::jsonb,
  after_metrics jsonb not null default '{}'::jsonb,
  recovered_revenue numeric(14,2) not null default 0,
  no_show_reduction numeric(5,2) not null default 0,
  recall_patients_recovered integer not null default 0,
  reviews_generated integer not null default 0,
  admin_hours_saved numeric(8,2) not null default 0,
  testimonial_prompt text,
  status text not null default 'collecting_data',
  created_at timestamptz not null default now()
);

create table public.client_success_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  client_name text not null,
  status client_success_status not null default 'healthy',
  health_score integer not null default 0,
  adoption_score integer not null default 0,
  retention_score integer not null default 0,
  expansion_score integer not null default 0,
  next_check_in_at timestamptz,
  qbr_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referral_flywheel_events (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  client_name text not null,
  referral_source text,
  referral_target text,
  reward_status text not null default 'pending',
  advocacy_stage text not null default 'identified',
  created_at timestamptz not null default now()
);

create table public.authority_content_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id text,
  content_type text not null,
  title text not null,
  theme text not null,
  target_channel text not null default 'linkedin',
  status text not null default 'draft',
  asset_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  package_key text not null unique,
  name text not null,
  monthly_price numeric(14,2),
  implementation_price numeric(14,2),
  deliverables jsonb not null default '[]'::jsonb,
  kpi_targets jsonb not null default '{}'::jsonb,
  support_model text not null,
  created_at timestamptz not null default now()
);

create index idx_gtm_prospects_stage on public.gtm_prospects(pipeline_stage, updated_at desc);
create index idx_gtm_audits_prospect on public.operational_audits_gtm(prospect_id, created_at desc);
create index idx_onboarding_playbooks_org on public.client_onboarding_playbooks(organization_id, status, updated_at desc);
create index idx_case_study_results_org on public.case_study_results(organization_id, status, created_at desc);
create index idx_client_success_org_status on public.client_success_accounts(organization_id, status, updated_at desc);
create index idx_referral_events_org on public.referral_flywheel_events(organization_id, advocacy_stage, created_at desc);
create index idx_content_assets_theme on public.authority_content_assets(theme, status, created_at desc);

alter table public.gtm_prospects enable row level security;
alter table public.operational_audits_gtm enable row level security;
alter table public.client_onboarding_playbooks enable row level security;
alter table public.case_study_results enable row level security;
alter table public.client_success_accounts enable row level security;
alter table public.referral_flywheel_events enable row level security;
alter table public.authority_content_assets enable row level security;
alter table public.service_packages enable row level security;

create policy "service_role_all_gtm_prospects" on public.gtm_prospects for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_audits_gtm" on public.operational_audits_gtm for all using (auth.role() = 'service_role');
create policy "service_role_all_client_onboarding_playbooks" on public.client_onboarding_playbooks for all using (auth.role() = 'service_role');
create policy "service_role_all_case_study_results" on public.case_study_results for all using (auth.role() = 'service_role');
create policy "service_role_all_client_success_accounts" on public.client_success_accounts for all using (auth.role() = 'service_role');
create policy "service_role_all_referral_flywheel_events" on public.referral_flywheel_events for all using (auth.role() = 'service_role');
create policy "service_role_all_authority_content_assets" on public.authority_content_assets for all using (auth.role() = 'service_role');
create policy "service_role_all_service_packages" on public.service_packages for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.gtm_prospects;
alter publication supabase_realtime add table public.client_onboarding_playbooks;
alter publication supabase_realtime add table public.case_study_results;
alter publication supabase_realtime add table public.client_success_accounts;
alter publication supabase_realtime add table public.referral_flywheel_events;
