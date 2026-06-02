BEGIN;

-- ============================================================
-- REVENUE OS TABLES
-- ============================================================

-- 1. revenue_opportunities
CREATE TABLE IF NOT EXISTS revenue_opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_external_id text NOT NULL,
    opportunity_type text NOT NULL, -- 'unscheduled_treatment','delayed_treatment','declined_treatment','recall','membership','referral','reactivation'
    procedure_code text,
    procedure_description text,
    estimated_value numeric(12,2) DEFAULT 0,
    opportunity_score numeric(5,2) DEFAULT 0, -- 0-100
    status text DEFAULT 'open', -- 'open','actioned','won','lost','expired'
    days_since_recommendation int DEFAULT 0,
    provider_external_id text,
    actioned_at timestamptz,
    won_at timestamptz,
    revenue_realized numeric(12,2) DEFAULT 0,
    workflow_id text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE revenue_opportunities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'revenue_opportunities' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON revenue_opportunities
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 2. revenue_forecasts
CREATE TABLE IF NOT EXISTS revenue_forecasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    forecast_date date NOT NULL DEFAULT CURRENT_DATE,
    horizon_days int NOT NULL, -- 30, 60, 90, 180, 365
    forecast_type text DEFAULT 'total', -- 'total','treatment','membership','recall','referral'
    forecasted_amount numeric(12,2) DEFAULT 0,
    confidence_low numeric(12,2) DEFAULT 0,
    confidence_high numeric(12,2) DEFAULT 0,
    actual_amount numeric(12,2) DEFAULT 0, -- filled in after horizon passes
    model_inputs jsonb DEFAULT '{}', -- appointments, treatment_plans, memberships, historical
    accuracy_score numeric(5,2), -- retrospective accuracy 0-100
    created_at timestamptz DEFAULT now(),
    UNIQUE (organization_id, forecast_date, horizon_days, forecast_type)
);

ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'revenue_forecasts' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON revenue_forecasts
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. provider_performance_snapshots
CREATE TABLE IF NOT EXISTS provider_performance_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider_external_id text NOT NULL,
    snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
    snapshot_type text DEFAULT 'monthly', -- 'daily','weekly','monthly'
    production_amount numeric(12,2) DEFAULT 0,
    collections_amount numeric(12,2) DEFAULT 0,
    treatment_acceptance_rate numeric(5,2) DEFAULT 0, -- 0-100
    treatments_proposed int DEFAULT 0,
    treatments_accepted int DEFAULT 0,
    reviews_generated int DEFAULT 0,
    referrals_generated int DEFAULT 0,
    revenue_influenced numeric(12,2) DEFAULT 0,
    avatar_watch_rate numeric(5,2) DEFAULT 0,
    communication_effectiveness numeric(5,2) DEFAULT 0, -- response rate 0-100
    created_at timestamptz DEFAULT now(),
    UNIQUE (organization_id, provider_external_id, snapshot_date, snapshot_type)
);

ALTER TABLE provider_performance_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'provider_performance_snapshots' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON provider_performance_snapshots
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. practice_benchmarks
CREATE TABLE IF NOT EXISTS practice_benchmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    benchmark_date date NOT NULL DEFAULT CURRENT_DATE,
    benchmark_type text DEFAULT 'monthly',
    metric_name text NOT NULL, -- 'revenue','acceptance_rate','review_count','recall_rate','membership_count'
    practice_value numeric(12,2) DEFAULT 0,
    network_avg numeric(12,2) DEFAULT 0,
    regional_avg numeric(12,2) DEFAULT 0,
    practice_type_avg numeric(12,2) DEFAULT 0,
    percentile int, -- 0-100 where this practice ranks
    trend text, -- 'improving','stable','declining'
    created_at timestamptz DEFAULT now(),
    UNIQUE (organization_id, benchmark_date, metric_name)
);

ALTER TABLE practice_benchmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'practice_benchmarks' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON practice_benchmarks
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================
-- COMMERCIALIZATION OS TABLES
-- ============================================================

-- 5. sales_pipeline (Zenith's own CRM — no organization_id)
CREATE TABLE IF NOT EXISTS sales_pipeline (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_name text NOT NULL,
    practice_name text,
    contact_email text,
    contact_phone text,
    lead_source text, -- 'referral','website','outbound','partner','conference'
    stage text DEFAULT 'lead', -- 'lead','qualified','discovery','demo','proposal','negotiation','closed_won','closed_lost'
    tier text, -- 'essentials','growth','performance','enterprise'
    estimated_mrr numeric(10,2) DEFAULT 0,
    estimated_arr numeric(10,2) DEFAULT 0,
    implementation_fee numeric(10,2) DEFAULT 0,
    probability int DEFAULT 0, -- 0-100
    expected_close_date date,
    actual_close_date date,
    lost_reason text,
    assigned_to text,
    last_activity_at timestamptz DEFAULT now(),
    notes text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE sales_pipeline ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sales_pipeline' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON sales_pipeline
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 6. sales_activities
CREATE TABLE IF NOT EXISTS sales_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id uuid REFERENCES sales_pipeline(id) ON DELETE CASCADE,
    activity_type text NOT NULL, -- 'call','email','demo','proposal_sent','contract_sent','follow_up','meeting'
    activity_date timestamptz DEFAULT now(),
    performed_by text,
    notes text,
    outcome text, -- 'positive','neutral','negative','no_answer'
    next_action text,
    next_action_date date,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sales_activities' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON sales_activities
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. product_tiers (global — no organization_id)
CREATE TABLE IF NOT EXISTS product_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_key text UNIQUE NOT NULL, -- 'essentials','growth','performance','enterprise'
    tier_name text NOT NULL, -- 'Zenith Essentials','Zenith Growth','Zenith Performance','Zenith Enterprise'
    monthly_price numeric(10,2) NOT NULL,
    annual_price numeric(10,2),
    implementation_fee numeric(10,2) DEFAULT 0,
    max_providers int, -- NULL = unlimited
    max_locations int, -- NULL = unlimited
    features jsonb DEFAULT '[]',
    target_practice_type text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE product_tiers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'product_tiers' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON product_tiers
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Seed product_tiers
INSERT INTO product_tiers (tier_key, tier_name, monthly_price, annual_price, implementation_fee, max_providers, max_locations, features, target_practice_type)
VALUES
    (
        'essentials',
        'Zenith Essentials',
        297.00,
        2970.00,
        497.00,
        1,
        1,
        '["Workflow OS","Reviews","Recall","Basic Automations","Mission Control Lite"]',
        'single_provider'
    ),
    (
        'growth',
        'Zenith Growth',
        597.00,
        5970.00,
        997.00,
        3,
        1,
        '["Digital Dentist Twin","Video Intelligence","Patient Influence Engine","Revenue Command Center","Membership Engine","Referral Engine"]',
        'growing_practice'
    ),
    (
        'performance',
        'Zenith Performance',
        997.00,
        9970.00,
        1497.00,
        5,
        2,
        '["ALICE","Revenue OS","Treatment Acceptance Intelligence","Advanced Attribution","Growth Command Center","Multi-provider support"]',
        'high_growth_practice'
    ),
    (
        'enterprise',
        'Zenith Enterprise',
        1997.00,
        19970.00,
        2997.00,
        NULL,
        NULL,
        '["Multi-location support","DSO support","Benchmarking","White-label reporting","Enterprise governance"]',
        'dso'
    )
ON CONFLICT (tier_key) DO NOTHING;

-- 8. partner_registry (global — no organization_id)
CREATE TABLE IF NOT EXISTS partner_registry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name text NOT NULL,
    partner_type text NOT NULL, -- 'referral','reseller','implementation','strategic','technology'
    contact_email text,
    contact_name text,
    status text DEFAULT 'active', -- 'active','inactive','pending'
    referrals_sent int DEFAULT 0,
    referrals_converted int DEFAULT 0,
    total_revenue_generated numeric(12,2) DEFAULT 0,
    commission_rate numeric(5,2) DEFAULT 0, -- percentage
    agreement_signed_at date,
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_registry ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'partner_registry' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON partner_registry
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_org_status
    ON revenue_opportunities (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_org_type
    ON revenue_opportunities (organization_id, opportunity_type);

CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_org_patient
    ON revenue_opportunities (organization_id, patient_external_id);

CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_org_date
    ON revenue_forecasts (organization_id, forecast_date DESC);

CREATE INDEX IF NOT EXISTS idx_provider_performance_snapshots_org_provider_date
    ON provider_performance_snapshots (organization_id, provider_external_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_practice_benchmarks_org_date
    ON practice_benchmarks (organization_id, benchmark_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_pipeline_stage
    ON sales_pipeline (stage);

CREATE INDEX IF NOT EXISTS idx_sales_pipeline_assigned_to
    ON sales_pipeline (assigned_to);

CREATE INDEX IF NOT EXISTS idx_sales_activities_pipeline_date
    ON sales_activities (pipeline_id, activity_date DESC);

COMMIT;
