-- Zenith MVP 2 Implementation Intelligence Layer
-- Extends Client Success OS, Workflow OS, Mission Control, ALICE, and Patient Revenue Engine.

create table if not exists public.implementation_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  assessment_type text not null default 'baseline_discovery',
  status text not null default 'in_progress',
  completed_at timestamptz,
  findings jsonb not null default '[]'::jsonb,
  risk_register jsonb not null default '[]'::jsonb,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.implementation_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  implementation_assessment_id uuid references public.implementation_assessments(id) on delete cascade,
  practice_health_score integer not null default 0 check (practice_health_score between 0 and 100),
  revenue_health_score integer not null default 0 check (revenue_health_score between 0 and 100),
  growth_score integer not null default 0 check (growth_score between 0 and 100),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  implementation_score integer not null default 0 check (implementation_score between 0 and 100),
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.baseline_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  snapshot_date date not null default current_date,
  patient_count integer not null default 0,
  active_patient_count integer not null default 0,
  recall_due_count integer not null default 0,
  unscheduled_treatment_value numeric not null default 0,
  no_show_rate numeric not null default 0,
  review_count integer not null default 0,
  review_average numeric not null default 0,
  referral_count integer not null default 0,
  monthly_production numeric not null default 0,
  monthly_collections numeric not null default 0,
  source_system text,
  captured_by_workflow text not null default 'baseline_assessment_workflow',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_leaks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  baseline_snapshot_id uuid references public.baseline_snapshots(id) on delete set null,
  leak_category text not null check (leak_category in ('recall', 'treatment', 'no_show', 'review', 'referral', 'membership')),
  revenue_at_risk numeric not null default 0,
  recovery_potential numeric not null default 0,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  severity text not null default 'moderate',
  evidence jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  revenue_leak_id uuid references public.revenue_leaks(id) on delete cascade,
  opportunity_type text not null,
  title text not null,
  potential_revenue numeric not null default 0,
  recovered_revenue numeric not null default 0,
  priority_rank integer not null default 0,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  recommended_workflow_id text,
  alice_recommendation text,
  status text not null default 'identified',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.recovery_priorities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  revenue_opportunity_id uuid references public.revenue_opportunities(id) on delete cascade,
  priority_rank integer not null,
  next_action text not null,
  owner_role text not null default 'customer_success',
  due_date date,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.pms_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  vendor text not null check (vendor in ('open_dental', 'dentrix', 'eaglesoft', 'denticon')),
  status text not null default 'not_started',
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  complexity_score integer not null default 0 check (complexity_score between 0 and 100),
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  findings jsonb not null default '[]'::jsonb,
  assessed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.pms_data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pms_assessment_id uuid references public.pms_assessments(id) on delete cascade,
  source_name text not null,
  source_type text not null,
  connection_status text not null default 'not_connected',
  last_validated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.integration_readiness_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  pms_assessment_id uuid references public.pms_assessments(id) on delete cascade,
  data_access_score integer not null default 0 check (data_access_score between 0 and 100),
  data_quality_score integer not null default 0 check (data_quality_score between 0 and 100),
  mapping_score integer not null default 0 check (mapping_score between 0 and 100),
  sync_readiness_score integer not null default 0 check (sync_readiness_score between 0 and 100),
  overall_score integer not null default 0 check (overall_score between 0 and 100),
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.integration_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  pms_assessment_id uuid references public.pms_assessments(id) on delete cascade,
  plan_name text not null,
  milestones jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  owner_role text not null default 'implementation_owner',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.workflow_configurations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  workflow_id text not null,
  workflow_category text not null check (workflow_category in ('recall', 'no_show', 'treatment', 'reviews', 'referrals', 'memberships', 'video_journeys')),
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  configured_at timestamptz,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  unique (implementation_project_id, workflow_id)
);

create table if not exists public.reminder_cadences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  cadence_type text not null check (cadence_type in ('appointment', 'treatment', 'review', 'recall')),
  timing_rules jsonb not null default '[]'::jsonb,
  channels text[] not null default '{}',
  retry_logic jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.recall_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  recall_types text[] not null default '{}',
  channels text[] not null default '{}',
  escalations jsonb not null default '[]'::jsonb,
  retry_logic jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.patient_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  segment_key text not null,
  segment_name text not null,
  criteria jsonb not null default '{}'::jsonb,
  recommended_workflow_id text,
  patient_count integer not null default 0,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.patient_health_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text not null,
  health_score integer not null default 0 check (health_score between 0 and 100),
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.patient_ltv_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text not null,
  ltv_score integer not null default 0 check (ltv_score between 0 and 100),
  estimated_ltv numeric not null default 0,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.patient_churn_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text not null,
  churn_score integer not null default 0 check (churn_score between 0 and 100),
  risk_band text not null default 'stable',
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.patient_reactivation_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_external_id text not null,
  reactivation_score integer not null default 0 check (reactivation_score between 0 and 100),
  recovery_potential numeric not null default 0,
  recommended_workflow_id text,
  scored_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.go_live_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  implementation_score integer not null default 0 check (implementation_score between 0 and 100),
  certification_status text not null default 'in_progress',
  risk_register jsonb not null default '[]'::jsonb,
  assessed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.certification_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  go_live_assessment_id uuid references public.go_live_assessments(id) on delete cascade,
  certification_categories jsonb not null default '{}'::jsonb,
  go_live_score integer not null default 0 check (go_live_score between 0 and 100),
  certification_status text not null default 'draft',
  report_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.implementation_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  implementation_project_id uuid references public.implementation_projects(id) on delete cascade,
  milestone_key text not null,
  milestone_name text not null,
  stage text not null,
  status text not null default 'not_started',
  due_date date,
  completed_at timestamptz,
  evidence_type text,
  evidence_record_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_implementation_assessments_org_status on public.implementation_assessments(organization_id, status, updated_at desc);
create index if not exists idx_implementation_scores_org_scored on public.implementation_scores(organization_id, scored_at desc);
create index if not exists idx_baseline_snapshots_org_date on public.baseline_snapshots(organization_id, snapshot_date desc);
create index if not exists idx_revenue_leaks_org_category on public.revenue_leaks(organization_id, leak_category, status);
create index if not exists idx_revenue_opportunities_org_priority on public.revenue_opportunities(organization_id, priority_rank, status);
create index if not exists idx_recovery_priorities_org_rank on public.recovery_priorities(organization_id, priority_rank, status);
create index if not exists idx_pms_assessments_org_vendor on public.pms_assessments(organization_id, vendor, status);
create index if not exists idx_workflow_configurations_project on public.workflow_configurations(implementation_project_id, workflow_category, enabled);
create index if not exists idx_patient_segments_org_key on public.patient_segments(organization_id, segment_key);
create index if not exists idx_go_live_assessments_org_status on public.go_live_assessments(organization_id, certification_status, assessed_at desc);
create index if not exists idx_implementation_milestones_project_stage on public.implementation_milestones(implementation_project_id, stage, status);

alter table public.implementation_assessments enable row level security;
alter table public.implementation_scores enable row level security;
alter table public.baseline_snapshots enable row level security;
alter table public.revenue_leaks enable row level security;
alter table public.revenue_opportunities enable row level security;
alter table public.recovery_priorities enable row level security;
alter table public.pms_assessments enable row level security;
alter table public.pms_data_sources enable row level security;
alter table public.integration_readiness_scores enable row level security;
alter table public.integration_plans enable row level security;
alter table public.workflow_configurations enable row level security;
alter table public.reminder_cadences enable row level security;
alter table public.recall_preferences enable row level security;
alter table public.patient_segments enable row level security;
alter table public.patient_health_scores enable row level security;
alter table public.patient_ltv_scores enable row level security;
alter table public.patient_churn_scores enable row level security;
alter table public.patient_reactivation_scores enable row level security;
alter table public.go_live_assessments enable row level security;
alter table public.certification_reports enable row level security;
alter table public.implementation_milestones enable row level security;

create policy "implementation_assessments_service_all" on public.implementation_assessments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "implementation_scores_service_all" on public.implementation_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "baseline_snapshots_service_all" on public.baseline_snapshots for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "revenue_leaks_service_all" on public.revenue_leaks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "revenue_opportunities_service_all" on public.revenue_opportunities for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "recovery_priorities_service_all" on public.recovery_priorities for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "pms_assessments_service_all" on public.pms_assessments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "pms_data_sources_service_all" on public.pms_data_sources for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "integration_readiness_scores_service_all" on public.integration_readiness_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "integration_plans_service_all" on public.integration_plans for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "workflow_configurations_service_all" on public.workflow_configurations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "reminder_cadences_service_all" on public.reminder_cadences for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "recall_preferences_service_all" on public.recall_preferences for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_segments_service_all" on public.patient_segments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_health_scores_service_all" on public.patient_health_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_ltv_scores_service_all" on public.patient_ltv_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_churn_scores_service_all" on public.patient_churn_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "patient_reactivation_scores_service_all" on public.patient_reactivation_scores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "go_live_assessments_service_all" on public.go_live_assessments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "certification_reports_service_all" on public.certification_reports for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "implementation_milestones_service_all" on public.implementation_milestones for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
