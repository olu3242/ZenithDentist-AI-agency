-- Dental practice onboarding deterministic sandbox evidence.
-- Simulation is deliberately isolated from live patient/workflow delivery tables.

create table if not exists public.dental_onboarding_simulation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  onboarding_key text not null,
  evidence_hash text not null,
  scenario_version text not null default 'dental-sandbox-v1',
  selected_playbooks jsonb not null default '[]'::jsonb,
  synthetic_scenarios jsonb not null default '[]'::jsonb,
  projected_outcomes jsonb not null default '{}'::jsonb,
  live_dispatch_count integer not null default 0 check (live_dispatch_count = 0),
  status text not null check (status in ('passed','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_dental_onboarding_sim_org_created
  on public.dental_onboarding_simulation_runs(organization_id, created_at desc);

create unique index if not exists uq_dental_onboarding_sim_evidence_hash
  on public.dental_onboarding_simulation_runs(organization_id, evidence_hash);

alter table public.dental_onboarding_simulation_runs enable row level security;

drop policy if exists "service_role_all_dental_onboarding_simulation_runs" on public.dental_onboarding_simulation_runs;
create policy "service_role_all_dental_onboarding_simulation_runs"
  on public.dental_onboarding_simulation_runs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
