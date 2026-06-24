-- Treatment Visualization Journey — TVA (Treatment Visualization Agent)
-- Extends the existing Agent OS registry (agent_registry/agent_capabilities) and
-- adds the two new domain tables required by the Treatment Visualization Journey:
-- treatment_visualizations and treatment_media. All other systems (revenue
-- attribution, automation events, analytics events, workflow runs) are reused
-- as-is — no parallel tracking tables are introduced. Additive only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- TVA agent registration (reuses agent_registry / agent_capabilities)
-- ---------------------------------------------------------------------------

insert into public.agent_registry (agent_id, agent_name, title, category, description, status, version)
values
  ('tva', 'TVA', 'Treatment Visualization Agent', 'patient-influence',
   'Generates and delivers patient-facing treatment education (overview, expected outcome, recovery timeline, FAQ) for unscheduled high-value treatment plans, tracks engagement, and attributes treatment acceptance revenue.',
   'active', '1.0.0')
on conflict (agent_id) do nothing;

insert into public.agent_capabilities (agent_id, capability_key, capability_name, description)
select id, capability_key, capability_name, description
from public.agent_registry
cross join (
  values
    ('generate_treatment_education', 'Generate Treatment Education', 'Builds the treatment overview, expected outcome, recovery timeline, and FAQ for a treatment plan.'),
    ('deliver_treatment_education', 'Deliver Treatment Education', 'Sends generated education media to the patient through the Patient Portal / outreach channel.'),
    ('track_education_engagement', 'Track Education Engagement', 'Records patient engagement with delivered treatment media.'),
    ('attribute_treatment_acceptance_revenue', 'Attribute Treatment Acceptance Revenue', 'Attributes accepted treatment revenue back to the education that influenced it.')
) as caps(capability_key, capability_name, description)
where agent_registry.agent_id = 'tva'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- treatment_visualizations — one row per treatment plan's education journey
-- ---------------------------------------------------------------------------

create table if not exists public.treatment_visualizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  patient_id text not null,
  treatment_plan_id text,
  treatment_code text,
  treatment_value numeric,
  agent_execution_id uuid references public.agent_executions(id) on delete set null,
  status text not null default 'pending' check (status in (
    'pending', 'education_generated', 'education_sent', 'viewed', 'accepted', 'declined', 'failed'
  )),
  engagement_score numeric not null default 0,
  expected_outcome text,
  recovery_timeline jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  accepted_value numeric,
  retry_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_treatment_visualizations_org on public.treatment_visualizations(organization_id);
create index if not exists idx_treatment_visualizations_patient on public.treatment_visualizations(patient_id);
create index if not exists idx_treatment_visualizations_status on public.treatment_visualizations(status);

-- ---------------------------------------------------------------------------
-- treatment_media — generated/delivered media assets for a visualization
-- ---------------------------------------------------------------------------

create table if not exists public.treatment_media (
  id uuid primary key default gen_random_uuid(),
  treatment_visualization_id uuid not null references public.treatment_visualizations(id) on delete cascade,
  media_type text not null check (media_type in ('overview', 'expected_outcome', 'recovery_timeline', 'faq', 'case_study_video')),
  title text not null,
  body text,
  media_url text,
  sequence integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_treatment_media_visualization_id on public.treatment_media(treatment_visualization_id);

create trigger set_treatment_visualizations_updated_at
  before update on public.treatment_visualizations
  for each row execute function public.set_updated_at();
