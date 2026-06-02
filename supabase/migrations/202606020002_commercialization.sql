-- ============================================================
-- Commercialization Foundation — Plans, Entitlements, Usage & Billing
-- 202606020002_commercialization.sql
-- ============================================================

BEGIN;

-- ─── feature_entitlements ────────────────────────────────────────────────────
-- Global config table — no org scope, no RLS needed
CREATE TABLE IF NOT EXISTS public.feature_entitlements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key     text NOT NULL, -- 'starter' | 'growth' | 'professional' | 'enterprise'
  feature_key  text NOT NULL,
  enabled      boolean NOT NULL DEFAULT true,
  limit_value  integer,  -- null = unlimited
  limit_unit   text,     -- 'per_month' | 'per_year' | null
  created_at   timestamptz DEFAULT now(),
  UNIQUE(plan_key, feature_key)
);

-- Seed default feature entitlements
INSERT INTO public.feature_entitlements (plan_key, feature_key, enabled, limit_value, limit_unit) VALUES
  ('starter', 'revenue_engine',        true,  null, null),
  ('starter', 'recall_recovery',       true,  100,  'per_month'),
  ('starter', 'no_show_prevention',    true,  200,  'per_month'),
  ('starter', 'review_engine',         true,  50,   'per_month'),
  ('starter', 'alice',                 false, null, null),
  ('starter', 'benchmarking',          false, null, null),
  ('starter', 'multi_location',        false, null, null),
  ('growth',  'revenue_engine',        true,  null, null),
  ('growth',  'recall_recovery',       true,  null, null),
  ('growth',  'no_show_prevention',    true,  null, null),
  ('growth',  'review_engine',         true,  null, null),
  ('growth',  'chair_fill',            true,  null, null),
  ('growth',  'treatment_acceptance',  true,  null, null),
  ('growth',  'alice',                 true,  100,  'per_month'),
  ('growth',  'benchmarking',          true,  null, null),
  ('growth',  'multi_location',        false, null, null),
  ('professional', 'revenue_engine',        true,  null, null),
  ('professional', 'recall_recovery',       true,  null, null),
  ('professional', 'no_show_prevention',    true,  null, null),
  ('professional', 'review_engine',         true,  null, null),
  ('professional', 'chair_fill',            true,  null, null),
  ('professional', 'treatment_acceptance',  true,  null, null),
  ('professional', 'referral_engine',       true,  null, null),
  ('professional', 'alice',                 true,  null, null),
  ('professional', 'benchmarking',          true,  null, null),
  ('professional', 'forecasting',           true,  null, null),
  ('professional', 'multi_location',        true,  3,    null),
  ('enterprise', 'revenue_engine',          true,  null, null),
  ('enterprise', 'recall_recovery',         true,  null, null),
  ('enterprise', 'no_show_prevention',      true,  null, null),
  ('enterprise', 'review_engine',           true,  null, null),
  ('enterprise', 'chair_fill',              true,  null, null),
  ('enterprise', 'treatment_acceptance',    true,  null, null),
  ('enterprise', 'referral_engine',         true,  null, null),
  ('enterprise', 'alice',                   true,  null, null),
  ('enterprise', 'benchmarking',            true,  null, null),
  ('enterprise', 'forecasting',             true,  null, null),
  ('enterprise', 'multi_location',          true,  null, null),
  ('enterprise', 'digital_twin',            true,  null, null),
  ('enterprise', 'enterprise_analytics',    true,  null, null)
ON CONFLICT (plan_key, feature_key) DO NOTHING;

-- ─── usage_metering ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_metering (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key     text NOT NULL,
  quantity        integer NOT NULL DEFAULT 1,
  metered_at      timestamptz DEFAULT now(),
  period_month    integer NOT NULL DEFAULT EXTRACT(MONTH FROM now())::integer,
  period_year     integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  metadata        jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_usage_metering_org        ON public.usage_metering(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_metering_created    ON public.usage_metering(metered_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_metering_org_period ON public.usage_metering(organization_id, period_year, period_month);

ALTER TABLE public.usage_metering ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_metering_org_isolation" ON public.usage_metering
  FOR ALL
  USING (
    organization_id IN (
      SELECT unnest(ARRAY(
        SELECT om.organization_id
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
      ))
    )
  );

-- ─── plan_limits ─────────────────────────────────────────────────────────────
-- Per-org overrides for feature limits
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key     text NOT NULL,
  limit_value     integer,
  override_reason text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(organization_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_limits_org     ON public.plan_limits(organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_limits_created ON public.plan_limits(created_at DESC);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_limits_org_isolation" ON public.plan_limits
  FOR ALL
  USING (
    organization_id IN (
      SELECT unnest(ARRAY(
        SELECT om.organization_id
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
      ))
    )
  );

-- ─── billing_events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN (
    'subscription_created','subscription_upgraded','subscription_downgraded',
    'subscription_cancelled','payment_succeeded','payment_failed',
    'trial_started','trial_ended'
  )),
  plan_key        text,
  amount_cents    integer,
  currency        text DEFAULT 'usd',
  stripe_event_id text UNIQUE,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_org     ON public.billing_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created ON public.billing_events(created_at DESC);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_events_org_isolation" ON public.billing_events
  FOR ALL
  USING (
    organization_id IN (
      SELECT unnest(ARRAY(
        SELECT om.organization_id
        FROM public.organization_members om
        WHERE om.user_id = auth.uid()
      ))
    )
  );

COMMIT;
