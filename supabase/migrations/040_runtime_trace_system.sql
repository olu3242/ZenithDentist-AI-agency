create type automation_trace_status as enum ('running', 'completed', 'failed', 'replayed');
create type automation_trace_stage_status as enum ('started', 'completed', 'failed', 'skipped');
create type automation_failure_category as enum (
  'infra',
  'auth',
  'provider',
  'timeout',
  'business_rule',
  'validation',
  'dependency',
  'partial_success',
  'retry_exhausted'
);

create table public.automation_traces (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null unique default gen_random_uuid(),
  workflow_id text not null,
  organization_id uuid not null,
  domain text not null,
  event_name text not null,
  status automation_trace_status not null default 'running',
  correlation_id uuid not null default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  latency_ms integer,
  retry_count integer not null default 0,
  failure_category automation_failure_category,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.automation_trace_events (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null references public.automation_traces(trace_id) on delete cascade,
  stage text not null,
  status automation_trace_stage_status not null,
  message text not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.automation_dead_letters (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null references public.automation_traces(trace_id) on delete cascade,
  workflow_id text not null,
  payload jsonb not null default '{}'::jsonb,
  failure_reason text not null,
  replayable boolean not null default true,
  replayed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_automation_traces_trace_id on public.automation_traces(trace_id);
create index idx_automation_traces_workflow_id on public.automation_traces(workflow_id);
create index idx_automation_traces_org on public.automation_traces(organization_id);
create index idx_automation_traces_status on public.automation_traces(status);
create index idx_automation_traces_created_at on public.automation_traces(started_at desc);
create index idx_automation_trace_events_trace_id on public.automation_trace_events(trace_id, created_at);
create index idx_automation_dead_letters_trace_id on public.automation_dead_letters(trace_id);
create index idx_automation_dead_letters_workflow_id on public.automation_dead_letters(workflow_id);
create index idx_automation_dead_letters_created_at on public.automation_dead_letters(created_at desc);

alter table public.automation_traces enable row level security;
alter table public.automation_trace_events enable row level security;
alter table public.automation_dead_letters enable row level security;

create policy "service_role_all_automation_traces" on public.automation_traces for all using (auth.role() = 'service_role');
create policy "service_role_all_automation_trace_events" on public.automation_trace_events for all using (auth.role() = 'service_role');
create policy "service_role_all_automation_dead_letters" on public.automation_dead_letters for all using (auth.role() = 'service_role');
