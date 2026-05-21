create type automation_domain_key as enum (
  'scheduling_intelligence',
  'recall_recovery',
  'review_acceleration',
  'patient_retention',
  'revenue_recovery',
  'staffing_intelligence',
  'executive_intelligence',
  'ai_intelligence',
  'benchmark_intelligence',
  'enterprise_coordination'
);

create type automation_coverage_status as enum ('complete', 'partial', 'missing', 'risk');

create table public.automation_blueprints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  domain automation_domain_key not null,
  name text not null,
  purpose text not null,
  triggers jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  intelligence_outputs jsonb not null default '[]'::jsonb,
  alice_visibility jsonb not null default '[]'::jsonb,
  emitted_event_types jsonb not null default '[]'::jsonb,
  required_pipelines jsonb not null default '[]'::jsonb,
  required_controls jsonb not null default '[]'::jsonb,
  coverage_status automation_coverage_status not null default 'partial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_audit_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_at timestamptz not null default now(),
  total_blueprints integer not null,
  complete_count integer not null,
  partial_count integer not null,
  missing_count integer not null,
  risk_count integer not null,
  coverage_score numeric(5,2) not null,
  critical_gaps jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb
);

create table public.automation_coverage_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  audit_run_id uuid references public.automation_audit_runs(id) on delete cascade,
  blueprint_id uuid,
  domain automation_domain_key not null,
  name text not null,
  coverage_status automation_coverage_status not null,
  missing_controls jsonb not null default '[]'::jsonb,
  missing_event_types jsonb not null default '[]'::jsonb,
  missing_pipelines jsonb not null default '[]'::jsonb,
  alice_visibility_score numeric(5,2) not null default 1,
  replay_readiness_score numeric(5,2) not null default 1,
  telemetry_score numeric(5,2) not null default 1,
  created_at timestamptz not null default now()
);

create index idx_automation_blueprints_org_domain on public.automation_blueprints(organization_id, domain);
create index idx_automation_audit_runs_org on public.automation_audit_runs(organization_id, run_at desc);
create index idx_automation_coverage_results_org_domain on public.automation_coverage_results(organization_id, domain, created_at desc);

alter table public.automation_blueprints enable row level security;
alter table public.automation_audit_runs enable row level security;
alter table public.automation_coverage_results enable row level security;

create policy "service_role_all_automation_blueprints" on public.automation_blueprints for all using (auth.role() = 'service_role');
create policy "service_role_all_automation_audit_runs" on public.automation_audit_runs for all using (auth.role() = 'service_role');
create policy "service_role_all_automation_coverage_results" on public.automation_coverage_results for all using (auth.role() = 'service_role');
