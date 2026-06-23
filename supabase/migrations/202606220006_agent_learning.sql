-- Agent OS — Batch 9: Learning System
-- Additive learning-loop tables. Inputs are agent_feedback (Batch 3),
-- agent_results (Batch 4), agent_revenue_attribution (Batch 7), and
-- agent_approval_decisions (Batch 8).

create table if not exists public.agent_learning_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  event_type text,
  source text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_performance_scores (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  metric text not null,
  score numeric,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_recommendations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  recommendation text,
  confidence numeric,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_learning_events_agent_id on public.agent_learning_events(agent_id);
create index if not exists idx_agent_performance_scores_agent_id on public.agent_performance_scores(agent_id);
create index if not exists idx_agent_performance_scores_metric on public.agent_performance_scores(metric);
create index if not exists idx_agent_recommendations_agent_id on public.agent_recommendations(agent_id);
create index if not exists idx_agent_recommendations_status on public.agent_recommendations(status);
