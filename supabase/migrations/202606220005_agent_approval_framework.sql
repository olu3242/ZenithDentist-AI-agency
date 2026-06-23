-- Agent OS — Batch 8: Approval Framework
-- Agent-action-scoped approval layer, additive and narrower than the
-- Workflow OS-level org governance in lib/runtime/governance.ts. Gates
-- individual agent actions before ExecutionEngine.run() dispatches them.

create table if not exists public.agent_approval_rules (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  action_type text not null,
  auto_approve boolean not null default true,
  risk_level text not null default 'low',
  created_at timestamptz not null default now()
);

create table if not exists public.agent_approval_requests (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references public.agent_executions(id) on delete cascade,
  agent_id uuid references public.agent_registry(id) on delete cascade,
  action_type text,
  payload jsonb default '{}'::jsonb,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.agent_approval_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.agent_approval_requests(id) on delete cascade,
  decided_by text,
  decision text,
  rationale text,
  decided_at timestamptz not null default now()
);

create index if not exists idx_agent_approval_rules_agent_id on public.agent_approval_rules(agent_id);
create index if not exists idx_agent_approval_rules_action_type on public.agent_approval_rules(action_type);
create index if not exists idx_agent_approval_requests_agent_id on public.agent_approval_requests(agent_id);
create index if not exists idx_agent_approval_requests_status on public.agent_approval_requests(status);
create index if not exists idx_agent_approval_decisions_request_id on public.agent_approval_decisions(request_id);

-- Default agent-agnostic rules (agent_id = null means "applies to all agents").
insert into public.agent_approval_rules (agent_id, action_type, auto_approve, risk_level)
select null, action_type, true, 'low'
from (values
  ('appointment_reminder'),
  ('review_request'),
  ('patient_education'),
  ('recall_notification'),
  ('status_update')
) as defaults(action_type)
where not exists (
  select 1 from public.agent_approval_rules r
  where r.agent_id is null and r.action_type = defaults.action_type
);

insert into public.agent_approval_rules (agent_id, action_type, auto_approve, risk_level)
select null, action_type, false, 'high'
from (values
  ('mass_campaign'),
  ('financial_adjustment'),
  ('custom_ai_message'),
  ('bulk_patient_outreach'),
  ('high_risk_operation')
) as defaults(action_type)
where not exists (
  select 1 from public.agent_approval_rules r
  where r.agent_id is null and r.action_type = defaults.action_type
);
