create type operational_incident_status as enum ('open', 'mitigating', 'resolved', 'postmortem');
create type operational_incident_severity as enum ('low', 'moderate', 'high', 'critical');

create table public.operational_memory_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  memory_type text not null,
  workflow_id text,
  title text not null,
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) not null default 0.80,
  created_at timestamptz not null default now()
);

create table public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  incident_key text not null,
  title text not null,
  severity operational_incident_severity not null default 'moderate',
  status operational_incident_status not null default 'open',
  root_cause text,
  mitigation text,
  sla_impact_ms integer,
  correlation_id uuid,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (organization_id, incident_key)
);

create table public.operational_incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.operational_incidents(id) on delete cascade,
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.provider_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  provider_key text not null,
  status text not null default 'unknown',
  uptime_score numeric(5,2) not null default 0,
  latency_ms integer,
  retry_rate numeric(5,2) not null default 0,
  failure_rate numeric(5,2) not null default 0,
  dependency_impact numeric(5,2) not null default 0,
  confidence numeric(5,2) not null default 0,
  observed_at timestamptz not null default now()
);

create table public.executive_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  report_type text not null,
  status text not null default 'ready',
  title text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  export_metadata jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create index idx_operational_memory_org_type on public.operational_memory_entries(organization_id, memory_type, created_at desc);
create index idx_operational_incidents_org_status on public.operational_incidents(organization_id, status, opened_at desc);
create index idx_operational_incident_events_incident on public.operational_incident_events(incident_id, created_at);
create index idx_provider_health_org_provider on public.provider_health_snapshots(organization_id, provider_key, observed_at desc);
create index idx_executive_report_org_type on public.executive_report_snapshots(organization_id, report_type, generated_at desc);

alter table public.operational_memory_entries enable row level security;
alter table public.operational_incidents enable row level security;
alter table public.operational_incident_events enable row level security;
alter table public.provider_health_snapshots enable row level security;
alter table public.executive_report_snapshots enable row level security;

create policy "service_role_all_operational_memory_entries" on public.operational_memory_entries for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_incidents" on public.operational_incidents for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_incident_events" on public.operational_incident_events for all using (auth.role() = 'service_role');
create policy "service_role_all_provider_health_snapshots" on public.provider_health_snapshots for all using (auth.role() = 'service_role');
create policy "service_role_all_executive_report_snapshots" on public.executive_report_snapshots for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.automation_traces;
alter publication supabase_realtime add table public.automation_trace_events;
alter publication supabase_realtime add table public.automation_dead_letters;
alter publication supabase_realtime add table public.operational_memory_entries;
alter publication supabase_realtime add table public.operational_incidents;
alter publication supabase_realtime add table public.operational_incident_events;
alter publication supabase_realtime add table public.provider_health_snapshots;
alter publication supabase_realtime add table public.executive_report_snapshots;
