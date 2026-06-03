BEGIN;

-- =============================================
-- COMMERCIAL OS TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS commercial_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key text NOT NULL UNIQUE,
  package_name text NOT NULL,
  setup_fee numeric NOT NULL DEFAULT 0,
  monthly_price numeric NOT NULL,
  annual_price numeric,
  included_features jsonb NOT NULL DEFAULT '[]',
  tier_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed 3 canonical packages
INSERT INTO commercial_packages (package_key, package_name, setup_fee, monthly_price, annual_price, tier_order, included_features) VALUES
('revenue_recovery_starter', 'Revenue Recovery Starter', 3500, 997, 9970,  1, '["Revenue Opportunity Assessment","Recall Automation","Appointment Reminders","No Show Recovery","Review Automation"]'),
('growth_automation_suite',  'Growth Automation Suite',  7500, 2497, 24970, 2, '["Everything in Starter","Referral Engine","Reactivation Campaigns","Mission Control","ALICE Insights","Smart Video Journey Engine"]'),
('zenith_operational_os',   'Zenith Operational OS',   15000, 4997, 49970, 3, '["Everything in Growth","Workflow OS","Commercial OS","Event Fabric","Executive Intelligence","Governance","Automation Audit Center","Digital Twin OS"]')
ON CONFLICT (package_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS commercial_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  pipeline_entry_id uuid,
  practice_name text NOT NULL,
  contact_name text,
  contact_email text,
  recommended_package_key text REFERENCES commercial_packages(package_key),
  current_state_analysis jsonb,
  revenue_opportunity_summary jsonb,
  roi_projection jsonb,
  pricing_summary jsonb,
  implementation_timeline jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','declined','expired')),
  sent_at timestamptz,
  accepted_at timestamptz,
  expires_at timestamptz,
  total_setup_fee numeric,
  monthly_mrr numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commercial_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  proposal_id uuid REFERENCES commercial_proposals(id),
  pipeline_entry_id uuid,
  practice_name text NOT NULL,
  contact_email text,
  package_key text REFERENCES commercial_packages(package_key),
  monthly_mrr numeric NOT NULL,
  setup_fee numeric NOT NULL DEFAULT 0,
  contract_start_date date,
  contract_term_months integer NOT NULL DEFAULT 12,
  contract_status text NOT NULL DEFAULT 'draft' CHECK (contract_status IN ('draft','sent','signed','active','cancelled','expired')),
  signed_at timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commercial_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  contract_id uuid REFERENCES commercial_contracts(id),
  package_key text REFERENCES commercial_packages(package_key),
  monthly_mrr numeric NOT NULL,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','past_due','cancelled','churned')),
  trial_started_at timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  churn_reason text,
  last_payment_at timestamptz,
  next_billing_date date,
  health_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- DIGITAL TWIN OS TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS digital_twin_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  twin_type text NOT NULL CHECK (twin_type IN ('practice','revenue','workflow','patient','forecast')),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  current_state jsonb NOT NULL DEFAULT '{}',
  forecast_state jsonb NOT NULL DEFAULT '{}',
  simulation_inputs jsonb DEFAULT '{}',
  simulation_outputs jsonb DEFAULT '{}',
  confidence_score numeric DEFAULT 0.7,
  data_freshness_minutes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, twin_type, snapshot_date)
);

CREATE TABLE IF NOT EXISTS digital_twin_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  simulation_type text NOT NULL,
  input_parameters jsonb NOT NULL,
  projected_impact jsonb NOT NULL,
  confidence_score numeric DEFAULT 0.7,
  horizon_days integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_twin_forecast_accuracy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  twin_type text NOT NULL,
  forecast_date date NOT NULL,
  horizon_days integer NOT NULL,
  predicted_value numeric NOT NULL,
  actual_value numeric,
  variance_pct numeric,
  accuracy_score numeric,
  recorded_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, twin_type, forecast_date, horizon_days)
);

-- =============================================
-- WORKFLOW SELF-HEALING TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_recovery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  workflow_id text NOT NULL,
  failure_type text NOT NULL CHECK (failure_type IN ('timeout','api_failure','queue_backlog','dead_letter','routing_failure','dependency_missing','orphaned_event','execution_error')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  status text NOT NULL DEFAULT 'detected' CHECK (status IN ('detected','diagnosing','recovering','resolved','escalated')),
  diagnosis text,
  recovery_action text,
  escalation_reason text,
  metadata jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS workflow_recovery_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_event_id uuid REFERENCES workflow_recovery_events(id),
  action_type text NOT NULL CHECK (action_type IN ('retry','requeue','reconnect','replay_event','failover','escalate')),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  succeeded boolean,
  result_summary text,
  duration_ms integer
);

CREATE TABLE IF NOT EXISTS workflow_recovery_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_failures integer NOT NULL DEFAULT 0,
  total_recoveries integer NOT NULL DEFAULT 0,
  recovery_success_rate numeric NOT NULL DEFAULT 0,
  mean_time_to_recovery_ms integer,
  workflow_stability_score numeric NOT NULL DEFAULT 100,
  automation_reliability_score numeric NOT NULL DEFAULT 100,
  active_incidents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, metric_date)
);

-- =============================================
-- ALICE LEARNING / KNOWLEDGE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS alice_knowledge_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number integer NOT NULL,
  training_source text NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  confidence_score numeric DEFAULT 0.7,
  performance_impact numeric,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','active','rolled_back')),
  promoted_at timestamptz,
  rolled_back_at timestamptz,
  rollback_reason text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_number)
);

CREATE TABLE IF NOT EXISTS alice_recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  recommendation_id uuid,
  recommendation_type text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  accepted boolean,
  rejected boolean,
  outcome_recorded boolean NOT NULL DEFAULT false,
  outcome_revenue_impact numeric,
  outcome_recorded_at timestamptz,
  accuracy_score numeric,
  adoption_rate_contribution numeric,
  impact_score numeric
);

CREATE TABLE IF NOT EXISTS alice_executive_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  briefing_date date NOT NULL DEFAULT CURRENT_DATE,
  opportunities jsonb NOT NULL DEFAULT '[]',
  risks jsonb NOT NULL DEFAULT '[]',
  revenue_forecast jsonb DEFAULT '{}',
  growth_forecast jsonb DEFAULT '{}',
  workflow_health jsonb DEFAULT '{}',
  top_recommendations jsonb NOT NULL DEFAULT '[]',
  priority_actions jsonb NOT NULL DEFAULT '[]',
  projected_business_impact jsonb DEFAULT '{}',
  executive_intelligence_score numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, briefing_date)
);

-- RLS
ALTER TABLE commercial_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_twin_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_twin_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_twin_forecast_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_recovery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_recovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_recovery_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alice_knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alice_recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE alice_executive_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON commercial_packages FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON commercial_proposals FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON commercial_contracts FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON commercial_subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON digital_twin_snapshots FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON digital_twin_simulations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON digital_twin_forecast_accuracy FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON workflow_recovery_events FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON workflow_recovery_actions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON workflow_recovery_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON alice_knowledge_versions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON alice_recommendation_feedback FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON alice_executive_briefings FOR ALL TO service_role USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commercial_proposals_org ON commercial_proposals (organization_id);
CREATE INDEX IF NOT EXISTS idx_commercial_proposals_status ON commercial_proposals (status);
CREATE INDEX IF NOT EXISTS idx_commercial_contracts_org ON commercial_contracts (organization_id);
CREATE INDEX IF NOT EXISTS idx_commercial_subscriptions_status ON commercial_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_digital_twin_snapshots_org_type ON digital_twin_snapshots (organization_id, twin_type, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_digital_twin_simulations_org ON digital_twin_simulations (organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_recovery_events_status ON workflow_recovery_events (status, severity);
CREATE INDEX IF NOT EXISTS idx_workflow_recovery_metrics_date ON workflow_recovery_metrics (organization_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_alice_knowledge_versions_status ON alice_knowledge_versions (status, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_alice_recommendation_feedback_org ON alice_recommendation_feedback (organization_id);
CREATE INDEX IF NOT EXISTS idx_alice_executive_briefings_org_date ON alice_executive_briefings (organization_id, briefing_date DESC);

COMMIT;
