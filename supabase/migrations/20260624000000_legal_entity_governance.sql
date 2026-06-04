-- Legal entity governance
-- Standardizes FinClarity Bookkeeping and Services LLC as the legal, tax, billing, and contract entity for the Zenith Pros brand.

alter table public.commercial_packages add column if not exists legal_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists brand text not null default 'Zenith Pros';
alter table public.commercial_packages add column if not exists tax_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists billing_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists contract_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists payment_recipient text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists ip_ownership_clause text not null default 'Customer data remains owned by the customer. Zenith Pros service materials, software, documentation, reports, templates, and training content are provided under the applicable subscription or services agreement unless otherwise agreed in writing.';
alter table public.commercial_packages add column if not exists subscription_license_clause text not null default 'Client acknowledges that access to Zenith Pros constitutes a limited subscription and service license only. Customer data ownership is not transferred by use of the platform.';

alter table public.client_commercial_controls add column if not exists legal_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists brand text not null default 'Zenith Pros';
alter table public.client_commercial_controls add column if not exists tax_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists billing_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists contract_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists payment_recipient text not null default 'FinClarity Bookkeeping and Services LLC';

create index if not exists idx_commercial_packages_legal_brand on public.commercial_packages(organization_id, legal_entity, brand);
create index if not exists idx_client_commercial_controls_legal_brand on public.client_commercial_controls(organization_id, legal_entity, brand);
