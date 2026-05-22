create table if not exists public.automation_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  automation_event_id uuid references public.automation_events(id) on delete set null,
  workflow_id text not null,
  status text not null default 'queued',
  idempotency_key text not null unique,
  correlation_id text not null,
  payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  queued_at timestamptz not null default now(),
  processing_started_at timestamptz,
  completed_at timestamptz,
  next_retry_at timestamptz,
  dead_lettered_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_failures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  workflow_id text not null,
  correlation_id text not null,
  idempotency_key text not null,
  failure_reason text not null,
  payload jsonb not null default '{}'::jsonb,
  replayable boolean not null default true,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  workflow_id text not null,
  status text not null default 'queued',
  correlation_id text not null,
  idempotency_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  latency_ms integer,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  agent_name text not null,
  correlation_id text,
  level text not null default 'info',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null default 'stripe',
  provider_event_id text not null unique,
  event_type text not null,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  entitlement_key text not null,
  active boolean not null default true,
  source_subscription_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, entitlement_key)
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  counter_key text not null,
  quantity numeric(14,2) not null default 0,
  period_start date not null,
  period_end date not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (organization_id, counter_key, period_start)
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  event_name text not null,
  destination text not null default 'internal',
  attribution jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_automation_queue_org_status on public.automation_queue(organization_id, status, queued_at desc);
create index if not exists idx_automation_queue_correlation on public.automation_queue(correlation_id);
create index if not exists idx_automation_failures_org on public.automation_failures(organization_id, created_at desc);
create index if not exists idx_workflow_runs_org_status on public.workflow_runs(organization_id, status, started_at desc);
create index if not exists idx_agent_logs_org on public.agent_logs(organization_id, created_at desc);
create index if not exists idx_billing_events_org_status on public.billing_events(organization_id, status, received_at desc);
create index if not exists idx_usage_counters_org_key on public.usage_counters(organization_id, counter_key, period_start desc);
create index if not exists idx_analytics_events_org_name on public.analytics_events(organization_id, event_name, created_at desc);

alter table public.automation_queue enable row level security;
alter table public.automation_failures enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.agent_logs enable row level security;
alter table public.billing_events enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.usage_counters enable row level security;
alter table public.analytics_events enable row level security;

create policy "service_role_all_automation_queue" on public.automation_queue for all using (auth.role() = 'service_role');
create policy "service_role_all_automation_failures" on public.automation_failures for all using (auth.role() = 'service_role');
create policy "service_role_all_workflow_runs" on public.workflow_runs for all using (auth.role() = 'service_role');
create policy "service_role_all_agent_logs" on public.agent_logs for all using (auth.role() = 'service_role');
create policy "service_role_all_billing_events" on public.billing_events for all using (auth.role() = 'service_role');
create policy "service_role_all_subscription_entitlements" on public.subscription_entitlements for all using (auth.role() = 'service_role');
create policy "service_role_all_usage_counters" on public.usage_counters for all using (auth.role() = 'service_role');
create policy "service_role_all_analytics_events" on public.analytics_events for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.automation_queue;
alter publication supabase_realtime add table public.automation_failures;
alter publication supabase_realtime add table public.workflow_runs;
alter publication supabase_realtime add table public.billing_events;
alter publication supabase_realtime add table public.analytics_events;
