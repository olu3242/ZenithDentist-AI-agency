-- Agent OS — Batch 4: Execution Engine
-- Per-agent execution tracking around the existing executeRegisteredAutomation() entrypoint.
-- Additive only — references agent_registry(id) from Batch 1.

create table if not exists public.agent_executions (
  id uuid primary key default gen_random_uuid(),
  execution_id text unique not null,
  agent_id uuid references public.agent_registry(id) on delete cascade,
  tenant_id uuid,
  event_type text,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer
);

create table if not exists public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references public.agent_executions(id) on delete cascade,
  action_name text,
  action_type text,
  input_payload jsonb default '{}'::jsonb,
  output_payload jsonb default '{}'::jsonb,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_results (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references public.agent_executions(id) on delete cascade,
  success boolean,
  revenue_impact numeric,
  outcome jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_executions_agent_id on public.agent_executions(agent_id);
create index if not exists idx_agent_executions_tenant_id on public.agent_executions(tenant_id);
create index if not exists idx_agent_actions_execution_id on public.agent_actions(execution_id);
create index if not exists idx_agent_results_execution_id on public.agent_results(execution_id);
