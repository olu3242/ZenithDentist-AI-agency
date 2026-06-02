BEGIN;

CREATE TABLE IF NOT EXISTS billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_account_id uuid REFERENCES client_accounts(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('inactive','trialing','active','past_due','canceled','unpaid')),
  current_period_end timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_org ON billing_customers (organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe ON billing_customers (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_email ON billing_customers (email);

ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_billing_customers" ON billing_customers FOR ALL TO service_role USING (true);

CREATE OR REPLACE FUNCTION set_billing_customers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_billing_customers_updated_at
  BEFORE UPDATE ON billing_customers
  FOR EACH ROW EXECUTE FUNCTION set_billing_customers_updated_at();

COMMIT;
