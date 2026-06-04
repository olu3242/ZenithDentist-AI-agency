create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  email text not null,
  full_name text,
  practice_name text,
  status text not null default 'lead' check (status in ('lead', 'proposal', 'contract_pending', 'payment_pending', 'approved', 'active', 'suspended', 'cancelled')),
  package_type text not null default 'revenue_recovery_system',
  contract_signed boolean not null default false,
  setup_fee_paid boolean not null default false,
  implementation_started boolean not null default false,
  approved_for_access boolean not null default false,
  subscription_active boolean not null default false,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  invitation_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (email)
);

create table if not exists public.authorized_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  value text not null,
  value_type text not null default 'email' check (value_type in ('email', 'domain')),
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (value, value_type)
);

create index if not exists idx_client_accounts_email on public.client_accounts (lower(email));
create index if not exists idx_client_accounts_status on public.client_accounts (status, approved_for_access, subscription_active);
create index if not exists idx_client_accounts_organization on public.client_accounts (organization_id);
create index if not exists idx_authorized_domains_value on public.authorized_domains (lower(value), value_type, status);
create index if not exists idx_authorized_domains_organization on public.authorized_domains (organization_id);

alter table public.client_accounts enable row level security;
alter table public.authorized_domains enable row level security;

drop policy if exists "service_role_all_client_accounts" on public.client_accounts;
create policy "service_role_all_client_accounts" on public.client_accounts
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_authorized_domains" on public.authorized_domains;
create policy "service_role_all_authorized_domains" on public.authorized_domains
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "approved_client_read_own_account" on public.client_accounts;
create policy "approved_client_read_own_account" on public.client_accounts
  for select using (
    auth.jwt() ->> 'email' is not null
    and lower(email) = lower(auth.jwt() ->> 'email')
    and approved_for_access = true
  );

drop policy if exists "member_read_authorized_domains" on public.authorized_domains;
create policy "member_read_authorized_domains" on public.authorized_domains
  for select using (
    organization_id is not null
    and exists (
      select 1 from public.organization_members om
      where om.organization_id = authorized_domains.organization_id
      and om.user_id = auth.uid()
    )
  );
