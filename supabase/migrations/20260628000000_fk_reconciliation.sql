-- FK Reconciliation: Restore deferred foreign keys after all referenced tables exist.
-- These FKs were removed from 046_production_hardening_operational_tables.sql
-- to resolve migration dependency conflicts (leads table created later in 202605210001_phase4_production_schema.sql).

-- Restore FK: analytics_events.lead_id -> leads.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_analytics_events_lead_id'
  ) THEN
    ALTER TABLE public.analytics_events
      ADD CONSTRAINT fk_analytics_events_lead_id
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Restore FK: billing_customers.client_account_id -> client_accounts.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_billing_customers_client_account_id'
  ) THEN
    ALTER TABLE public.billing_customers
      ADD CONSTRAINT fk_billing_customers_client_account_id
      FOREIGN KEY (client_account_id) REFERENCES public.client_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restore FK: implementation_projects.client_account_id -> client_accounts.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_implementation_projects_client_account_id'
  ) THEN
    ALTER TABLE public.implementation_projects
      ADD CONSTRAINT fk_implementation_projects_client_account_id
      FOREIGN KEY (client_account_id) REFERENCES public.client_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;
