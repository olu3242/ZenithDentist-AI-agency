-- Agent OS — Batch 1: Agent Registry
-- Establishes the canonical agent registry (LIZ, ALICE, MAX, IVY, FINN, NOVA, QUINN, REX, TESS)
-- and supporting capability/tool/metric tables. Additive only — no destructive ops.

create extension if not exists pgcrypto;

create table if not exists public.agent_registry (
  id uuid primary key default gen_random_uuid(),
  agent_id text unique not null,
  agent_name text not null,
  title text,
  category text,
  description text,
  status text not null default 'active',
  version text not null default '1.0.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_capabilities (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  capability_key text not null,
  capability_name text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  tool_name text not null,
  tool_type text,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_metrics (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_registry(id) on delete cascade,
  metric_name text not null,
  metric_value numeric,
  captured_at timestamptz not null default now()
);

create index if not exists idx_agent_capabilities_agent_id on public.agent_capabilities(agent_id);
create index if not exists idx_agent_tools_agent_id on public.agent_tools(agent_id);
create index if not exists idx_agent_metrics_agent_id on public.agent_metrics(agent_id);
create index if not exists idx_agent_registry_status on public.agent_registry(status);

insert into public.agent_registry (agent_id, agent_name, title, category, description, status, version)
values
  ('liz', 'LIZ', 'Patient Concierge', 'patient-facing', 'Patient-facing conversational concierge handling scheduling, treatment, billing, and review intents; delegates to specialist agents behind the scenes.', 'active', '1.0.0'),
  ('alice', 'ALICE', 'Revenue Intelligence Officer', 'revenue-intelligence', 'Surfaces revenue opportunities, practice health signals, and growth recommendations from operational data.', 'active', '1.0.0'),
  ('max', 'MAX', 'Operations & Scheduling Agent', 'operations', 'Manages appointment scheduling, rescheduling, cancellations, and day-to-day operational workflows.', 'active', '1.0.0'),
  ('ivy', 'IVY', 'Patient Success Agent', 'patient-success', 'Drives patient recall, treatment follow-up, and engagement to keep patients on track with care plans.', 'active', '1.0.0'),
  ('finn', 'FINN', 'Financial Recovery Agent', 'financial-recovery', 'Handles insurance claims, billing questions, and outstanding payment recovery workflows.', 'active', '1.0.0'),
  ('nova', 'NOVA', 'Growth & Reviews Agent', 'growth', 'Drives review generation, referral growth, and reputation management campaigns.', 'active', '1.0.0'),
  ('quinn', 'QUINN', 'Compliance Agent', 'compliance', 'Monitors compliance checks, governance policy, and regulatory guardrails across the platform.', 'active', '1.0.0'),
  ('rex', 'REX', 'Runtime & Reliability Agent', 'runtime', 'Watches runtime health, incident detection, and reliability of automated workflows.', 'active', '1.0.0'),
  ('tess', 'TESS', 'Executive Intelligence Agent', 'executive-intelligence', 'Produces executive-level practice reporting and summarized performance intelligence.', 'active', '1.0.0')
on conflict (agent_id) do nothing;
