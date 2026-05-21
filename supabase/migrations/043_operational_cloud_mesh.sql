create type operational_agent_status as enum ('active', 'watching', 'coordinating', 'escalating', 'degraded');
create type agent_message_priority as enum ('low', 'moderate', 'high', 'critical');

create table public.operational_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  agent_key text not null,
  agent_name text not null,
  agent_type text not null,
  status operational_agent_status not null default 'watching',
  confidence numeric(5,2) not null default 0,
  responsibilities text[] not null default '{}',
  last_signal_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, agent_key)
);

create table public.agent_bus_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  source_agent_key text not null,
  target_agent_key text,
  message_type text not null,
  priority agent_message_priority not null default 'moderate',
  payload jsonb not null default '{}'::jsonb,
  correlation_id uuid,
  created_at timestamptz not null default now()
);

create table public.swarm_consensus_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  consensus_key text not null,
  participating_agents text[] not null default '{}',
  consensus_score numeric(5,2) not null default 0,
  recommended_action text not null,
  risk_level runtime_action_risk not null default 'moderate',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.operational_digital_twins (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  twin_key text not null,
  runtime_model jsonb not null default '{}'::jsonb,
  simulation_state jsonb not null default '{}'::jsonb,
  resilience_score numeric(5,2) not null default 0,
  generated_at timestamptz not null default now()
);

create table public.infrastructure_awareness_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  global_health_score numeric(5,2) not null default 0,
  ecosystem_pressure numeric(5,2) not null default 0,
  provider_stability jsonb not null default '{}'::jsonb,
  tenant_patterns jsonb not null default '{}'::jsonb,
  orchestration_bottlenecks jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

create index idx_operational_agents_org_status on public.operational_agents(organization_id, status, updated_at desc);
create index idx_agent_bus_org_priority on public.agent_bus_messages(organization_id, priority, created_at desc);
create index idx_swarm_consensus_org_created on public.swarm_consensus_runs(organization_id, created_at desc);
create index idx_digital_twins_org_generated on public.operational_digital_twins(organization_id, generated_at desc);
create index idx_awareness_org_generated on public.infrastructure_awareness_snapshots(organization_id, generated_at desc);

alter table public.operational_agents enable row level security;
alter table public.agent_bus_messages enable row level security;
alter table public.swarm_consensus_runs enable row level security;
alter table public.operational_digital_twins enable row level security;
alter table public.infrastructure_awareness_snapshots enable row level security;

create policy "service_role_all_operational_agents" on public.operational_agents for all using (auth.role() = 'service_role');
create policy "service_role_all_agent_bus_messages" on public.agent_bus_messages for all using (auth.role() = 'service_role');
create policy "service_role_all_swarm_consensus_runs" on public.swarm_consensus_runs for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_digital_twins" on public.operational_digital_twins for all using (auth.role() = 'service_role');
create policy "service_role_all_infrastructure_awareness_snapshots" on public.infrastructure_awareness_snapshots for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.operational_agents;
alter publication supabase_realtime add table public.agent_bus_messages;
alter publication supabase_realtime add table public.swarm_consensus_runs;
alter publication supabase_realtime add table public.operational_digital_twins;
alter publication supabase_realtime add table public.infrastructure_awareness_snapshots;
