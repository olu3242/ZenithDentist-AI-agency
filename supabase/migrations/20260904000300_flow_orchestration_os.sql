-- Flow Orchestration Operating System
-- Durable coordination state above the canonical Automation Runtime.
-- Does not duplicate workflow execution; workflow_execution_id is a reference only.

create table if not exists public.flow_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flow_key text not null,
  flow_version integer not null default 1 check (flow_version > 0),
  status text not null default 'pending' check (status in ('pending','ready','running','waiting','blocked','succeeded','failed','cancelled')),
  current_step_key text,
  input jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  correlation_id text,
  last_error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists public.flow_step_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flow_run_id uuid not null references public.flow_runs(id) on delete cascade,
  step_key text not null,
  status text not null default 'pending' check (status in ('pending','ready','running','waiting_event','waiting_approval','retry_scheduled','succeeded','failed','skipped','cancelled')),
  attempt integer not null default 1 check (attempt > 0),
  workflow_execution_id uuid,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  last_error text,
  next_retry_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flow_run_id, step_key, attempt)
);

create table if not exists public.flow_waits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flow_run_id uuid not null references public.flow_runs(id) on delete cascade,
  step_run_id uuid not null references public.flow_step_runs(id) on delete cascade,
  wait_type text not null check (wait_type in ('event','approval','retry','timer')),
  wait_key text not null,
  status text not null default 'waiting' check (status in ('waiting','satisfied','expired','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  satisfied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (flow_run_id, step_run_id, wait_key)
);

create table if not exists public.flow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flow_run_id uuid not null references public.flow_runs(id) on delete cascade,
  event_type text not null,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (flow_run_id, idempotency_key)
);

create index if not exists idx_flow_runs_org_status_updated
  on public.flow_runs(organization_id, status, updated_at desc);
create index if not exists idx_flow_runs_flow_key_status
  on public.flow_runs(flow_key, flow_version, status, updated_at desc);
create index if not exists idx_flow_step_runs_run_status
  on public.flow_step_runs(flow_run_id, status, created_at);
create index if not exists idx_flow_step_runs_retry_due
  on public.flow_step_runs(status, next_retry_at)
  where status = 'retry_scheduled';
create index if not exists idx_flow_waits_wait_key
  on public.flow_waits(wait_key, status, created_at)
  where status = 'waiting';
create index if not exists idx_flow_events_org_created
  on public.flow_events(organization_id, created_at desc);

alter table public.flow_runs enable row level security;
alter table public.flow_step_runs enable row level security;
alter table public.flow_waits enable row level security;
alter table public.flow_events enable row level security;

drop policy if exists "service_role_all_flow_runs" on public.flow_runs;
create policy "service_role_all_flow_runs" on public.flow_runs for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_flow_step_runs" on public.flow_step_runs;
create policy "service_role_all_flow_step_runs" on public.flow_step_runs for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_flow_waits" on public.flow_waits;
create policy "service_role_all_flow_waits" on public.flow_waits for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_flow_events" on public.flow_events;
create policy "service_role_all_flow_events" on public.flow_events for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "member_read_flow_runs" on public.flow_runs;
create policy "member_read_flow_runs" on public.flow_runs for select
  using (exists (
    select 1 from public.organization_members om
    where om.organization_id = flow_runs.organization_id and om.user_id = auth.uid()
  ));

drop policy if exists "member_read_flow_step_runs" on public.flow_step_runs;
create policy "member_read_flow_step_runs" on public.flow_step_runs for select
  using (exists (
    select 1 from public.organization_members om
    where om.organization_id = flow_step_runs.organization_id and om.user_id = auth.uid()
  ));

drop policy if exists "member_read_flow_waits" on public.flow_waits;
create policy "member_read_flow_waits" on public.flow_waits for select
  using (exists (
    select 1 from public.organization_members om
    where om.organization_id = flow_waits.organization_id and om.user_id = auth.uid()
  ));

drop policy if exists "member_read_flow_events" on public.flow_events;
create policy "member_read_flow_events" on public.flow_events for select
  using (exists (
    select 1 from public.organization_members om
    where om.organization_id = flow_events.organization_id and om.user_id = auth.uid()
  ));
