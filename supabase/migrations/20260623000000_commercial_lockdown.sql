-- Commercial Lockdown Framework
-- Adds deliverable-based package controls, payment gates, scope protection, expansion quotes, and offboarding rules.

create table if not exists public.commercial_packages (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, package_key text not null, name text not null, setup_fee numeric(12,2) not null default 0, monthly_fee numeric(12,2) not null default 0, sla text not null, deliverables jsonb not null default '{}'::jsonb, client_responsibilities text[] not null default '{}', success_criteria text[] not null default '{}', payment_schedule jsonb not null default '[]'::jsonb, stripe_product_keys jsonb not null default '{}'::jsonb, active boolean not null default true, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb, unique (organization_id, package_key));

alter table public.commercial_packages
  add column if not exists organization_id uuid,
  add column if not exists name text,
  add column if not exists monthly_fee numeric(12,2) not null default 0,
  add column if not exists sla text not null default '',
  add column if not exists deliverables jsonb not null default '{}'::jsonb,
  add column if not exists client_responsibilities text[] not null default '{}',
  add column if not exists success_criteria text[] not null default '{}',
  add column if not exists payment_schedule jsonb not null default '[]'::jsonb,
  add column if not exists stripe_product_keys jsonb not null default '{}'::jsonb,
  add column if not exists active boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'commercial_packages'
      and column_name = 'package_name'
  ) then
    execute 'update public.commercial_packages set name = coalesce(name, package_name)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'commercial_packages'
      and column_name = 'monthly_price'
  ) then
    execute 'update public.commercial_packages set monthly_fee = coalesce(monthly_fee, monthly_price)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'commercial_packages'
      and column_name = 'is_active'
  ) then
    execute 'update public.commercial_packages set active = coalesce(active, is_active)';
  end if;
end $$;

create table if not exists public.commercial_payment_gates (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, commercial_package_id uuid references public.commercial_packages(id) on delete cascade, gate_key text not null, gate_name text not null, percentage numeric(5,2) not null default 0, trigger_event text not null, required_criteria text[] not null default '{}', billable boolean not null default false, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.client_commercial_controls (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_id uuid references public.clients(id) on delete set null, implementation_project_id uuid references public.implementation_projects(id) on delete set null, contract_id uuid references public.contracts(id) on delete set null, package_key text not null, contract_value numeric(12,2) not null default 0, implementation_status text not null default 'not_started', go_live_status text not null default 'not_certified', monthly_revenue numeric(12,2) not null default 0, renewal_date date, expansion_potential numeric(12,2) not null default 0, health_score integer not null default 0, scope_status text not null default 'in_scope', payment_status text not null default 'current', risk_status text not null default 'normal', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.client_payment_milestones (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_commercial_control_id uuid references public.client_commercial_controls(id) on delete cascade, gate_key text not null, gate_name text not null, amount numeric(12,2) not null default 0, due_date date, status text not null default 'not_billable', invoice_id uuid references public.invoices(id) on delete set null, paid_at timestamptz, blocked_reason text, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.change_requests (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_commercial_control_id uuid references public.client_commercial_controls(id) on delete cascade, request_title text not null, request_scope text not null, status text not null default 'requested', quoted_amount numeric(12,2) not null default 0, approved_at timestamptz, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.expansion_quotes (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_commercial_control_id uuid references public.client_commercial_controls(id) on delete cascade, expansion_type text not null, quote_amount numeric(12,2) not null default 0, status text not null default 'draft', approved_at timestamptz, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.client_offboarding_checklists (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_commercial_control_id uuid references public.client_commercial_controls(id) on delete cascade, notice_received boolean not null default false, outstanding_balance_paid boolean not null default false, export_package_generated boolean not null default false, checklist_complete boolean not null default false, offboarding_status text not null default 'not_started', completed_at timestamptz, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);

create index if not exists idx_commercial_packages_org_active on public.commercial_packages(organization_id, active);
create index if not exists idx_commercial_payment_gates_package on public.commercial_payment_gates(commercial_package_id, gate_key);
create index if not exists idx_client_commercial_controls_org_risk on public.client_commercial_controls(organization_id, risk_status, renewal_date);
create index if not exists idx_client_payment_milestones_org_status on public.client_payment_milestones(organization_id, status, due_date);
create index if not exists idx_change_requests_org_status on public.change_requests(organization_id, status);
create index if not exists idx_expansion_quotes_org_status on public.expansion_quotes(organization_id, status);
create index if not exists idx_client_offboarding_org_status on public.client_offboarding_checklists(organization_id, offboarding_status);

alter table public.commercial_packages enable row level security;
alter table public.commercial_payment_gates enable row level security;
alter table public.client_commercial_controls enable row level security;
alter table public.client_payment_milestones enable row level security;
alter table public.change_requests enable row level security;
alter table public.expansion_quotes enable row level security;
alter table public.client_offboarding_checklists enable row level security;

drop policy if exists "commercial_packages_service_all" on public.commercial_packages;
create policy "commercial_packages_service_all" on public.commercial_packages for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "commercial_payment_gates_service_all" on public.commercial_payment_gates;
create policy "commercial_payment_gates_service_all" on public.commercial_payment_gates for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "client_commercial_controls_service_all" on public.client_commercial_controls;
create policy "client_commercial_controls_service_all" on public.client_commercial_controls for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "client_payment_milestones_service_all" on public.client_payment_milestones;
create policy "client_payment_milestones_service_all" on public.client_payment_milestones for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "change_requests_service_all" on public.change_requests;
create policy "change_requests_service_all" on public.change_requests for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "expansion_quotes_service_all" on public.expansion_quotes;
create policy "expansion_quotes_service_all" on public.expansion_quotes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "client_offboarding_checklists_service_all" on public.client_offboarding_checklists;
create policy "client_offboarding_checklists_service_all" on public.client_offboarding_checklists for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
