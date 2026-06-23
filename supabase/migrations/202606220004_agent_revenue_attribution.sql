-- Agent OS — Batch 7: Revenue Attribution
-- Adds an agent_id dimension on top of existing workflow-level revenue attribution
-- (lib/revenue-attribution/index.ts). This table does not replace that source of
-- truth — it re-keys the same dollar figures by agent for Mission Control + scorecards.

create table if not exists public.agent_revenue_attribution (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  execution_id uuid references public.agent_executions(id) on delete cascade,
  tenant_id uuid,
  revenue_type text,
  revenue_amount numeric,
  currency text not null default 'USD',
  attribution_confidence numeric,
  source_event text,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_revenue_attribution_agent_id on public.agent_revenue_attribution(agent_id);
create index if not exists idx_agent_revenue_attribution_execution_id on public.agent_revenue_attribution(execution_id);
create index if not exists idx_agent_revenue_attribution_tenant_id on public.agent_revenue_attribution(tenant_id);
create index if not exists idx_agent_revenue_attribution_revenue_type on public.agent_revenue_attribution(revenue_type);
