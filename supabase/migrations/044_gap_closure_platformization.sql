create type runtime_fabric_event_status as enum ('published', 'delivered', 'replayed', 'failed');
create type operational_extension_status as enum ('draft', 'active', 'paused', 'retired');
create type onboarding_step_status as enum ('not_started', 'in_progress', 'completed', 'blocked');

create table public.runtime_event_fabric_events (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  event_key text not null,
  event_type text not null,
  source_system text not null,
  target_channel text not null,
  status runtime_fabric_event_status not null default 'published',
  correlation_id uuid,
  payload jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table public.recovery_orchestration_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  orchestration_key text not null,
  status text not null default 'planned',
  risk_level runtime_action_risk not null default 'moderate',
  confidence numeric(5,2) not null default 0,
  sequence jsonb not null default '[]'::jsonb,
  outcome jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.tenant_onboarding_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  onboarding_key text not null,
  status onboarding_step_status not null default 'not_started',
  current_step text not null default 'tenant_provisioning',
  progress numeric(5,2) not null default 0,
  setup_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.operational_extensions (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  extension_key text not null,
  extension_name text not null,
  extension_type text not null,
  status operational_extension_status not null default 'draft',
  permission_scope text[] not null default '{}',
  dependency_keys text[] not null default '{}',
  observability jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, extension_key)
);

create table public.operational_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  key_name text not null,
  key_prefix text not null,
  scopes text[] not null default '{}',
  status text not null default 'active',
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.operational_usage_meters (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  meter_key text not null,
  quantity numeric(14,2) not null default 0,
  quota numeric(14,2),
  billing_tier text not null default 'growth',
  period_start timestamptz not null default date_trunc('month', now()),
  period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_runtime_fabric_org_type on public.runtime_event_fabric_events(organization_id, event_type, published_at desc);
create index idx_recovery_runs_org_status on public.recovery_orchestration_runs(organization_id, status, created_at desc);
create index idx_onboarding_runs_org_status on public.tenant_onboarding_runs(organization_id, status, updated_at desc);
create index idx_extensions_org_status on public.operational_extensions(organization_id, status, extension_type);
create index idx_api_keys_org_status on public.operational_api_keys(organization_id, status, created_at desc);
create index idx_usage_meters_org_key on public.operational_usage_meters(organization_id, meter_key, period_start desc);

alter table public.runtime_event_fabric_events enable row level security;
alter table public.recovery_orchestration_runs enable row level security;
alter table public.tenant_onboarding_runs enable row level security;
alter table public.operational_extensions enable row level security;
alter table public.operational_api_keys enable row level security;
alter table public.operational_usage_meters enable row level security;

create policy "service_role_all_runtime_event_fabric_events" on public.runtime_event_fabric_events for all using (auth.role() = 'service_role');
create policy "service_role_all_recovery_orchestration_runs" on public.recovery_orchestration_runs for all using (auth.role() = 'service_role');
create policy "service_role_all_tenant_onboarding_runs" on public.tenant_onboarding_runs for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_extensions" on public.operational_extensions for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_api_keys" on public.operational_api_keys for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_usage_meters" on public.operational_usage_meters for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.runtime_event_fabric_events;
alter publication supabase_realtime add table public.recovery_orchestration_runs;
alter publication supabase_realtime add table public.tenant_onboarding_runs;
alter publication supabase_realtime add table public.operational_extensions;
alter publication supabase_realtime add table public.operational_api_keys;
alter publication supabase_realtime add table public.operational_usage_meters;
