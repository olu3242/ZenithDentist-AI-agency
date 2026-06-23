-- Agent OS — Batch 3: Agent Memory
-- Durable per-agent memory, observation log, and feedback scoring tables.
-- Additive only — references agent_registry(id) from Batch 1.

create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  tenant_id uuid,
  memory_type text,
  memory_key text not null,
  memory_value jsonb not null default '{}'::jsonb,
  confidence_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_observations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  event_type text,
  observation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_feedback (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  feedback_type text,
  score numeric,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_memory_agent_tenant_key on public.agent_memory(agent_id, tenant_id, memory_key);
create index if not exists idx_agent_observations_agent_id on public.agent_observations(agent_id);
create index if not exists idx_agent_feedback_agent_id on public.agent_feedback(agent_id);
