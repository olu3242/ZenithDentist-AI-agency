BEGIN;

-- pilot_scorecards: per-org pilot tracking
CREATE TABLE IF NOT EXISTS pilot_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  pilot_started_at timestamptz NOT NULL DEFAULT now(),
  pilot_status text NOT NULL DEFAULT 'active' CHECK (pilot_status IN ('setup', 'active', 'completed', 'churned')),
  tier text NOT NULL DEFAULT 'growth',
  -- 30-day criteria
  first_practice_live boolean NOT NULL DEFAULT false,
  first_journey_completed boolean NOT NULL DEFAULT false,
  first_video_delivered boolean NOT NULL DEFAULT false,
  first_review_generated boolean NOT NULL DEFAULT false,
  first_referral_generated boolean NOT NULL DEFAULT false,
  first_recall_recovered boolean NOT NULL DEFAULT false,
  first_treatment_influence boolean NOT NULL DEFAULT false,
  first_revenue_attribution boolean NOT NULL DEFAULT false,
  first_roi_report boolean NOT NULL DEFAULT false,
  first_case_study boolean NOT NULL DEFAULT false,
  -- summary metrics (updated daily)
  total_patients_engaged integer NOT NULL DEFAULT 0,
  total_videos_delivered integer NOT NULL DEFAULT 0,
  total_videos_watched integer NOT NULL DEFAULT 0,
  total_appointments_confirmed integer NOT NULL DEFAULT 0,
  total_recall_recovered integer NOT NULL DEFAULT 0,
  total_reviews_generated integer NOT NULL DEFAULT 0,
  total_referrals_generated integer NOT NULL DEFAULT 0,
  total_membership_enrollments integer NOT NULL DEFAULT 0,
  total_revenue_influenced numeric NOT NULL DEFAULT 0,
  total_revenue_recovered numeric NOT NULL DEFAULT 0,
  health_score integer NOT NULL DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- pilot_daily_metrics: one row per org per day
CREATE TABLE IF NOT EXISTS pilot_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  patients_engaged integer NOT NULL DEFAULT 0,
  videos_delivered integer NOT NULL DEFAULT 0,
  videos_watched integer NOT NULL DEFAULT 0,
  watch_rate numeric NOT NULL DEFAULT 0,
  appointments_confirmed integer NOT NULL DEFAULT 0,
  recall_recovered integer NOT NULL DEFAULT 0,
  reviews_generated integer NOT NULL DEFAULT 0,
  referrals_generated integer NOT NULL DEFAULT 0,
  membership_enrollments integer NOT NULL DEFAULT 0,
  treatment_accepted integer NOT NULL DEFAULT 0,
  revenue_influenced numeric NOT NULL DEFAULT 0,
  revenue_recovered numeric NOT NULL DEFAULT 0,
  alice_recommendations integer NOT NULL DEFAULT 0,
  journeys_started integer NOT NULL DEFAULT 0,
  journeys_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, metric_date)
);

-- pilot_roi_reports: periodic ROI snapshots
CREATE TABLE IF NOT EXISTS pilot_roi_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  report_period text NOT NULL DEFAULT '30d' CHECK (report_period IN ('7d', '30d', '60d', '90d')),
  -- before metrics (captured at onboarding)
  baseline_monthly_revenue numeric,
  baseline_acceptance_rate numeric,
  baseline_reviews_monthly integer,
  baseline_recall_rate numeric,
  baseline_membership_count integer,
  -- after metrics
  current_monthly_revenue numeric,
  current_acceptance_rate numeric,
  current_reviews_monthly integer,
  current_recall_rate numeric,
  current_membership_count integer,
  -- impact
  revenue_recovered numeric NOT NULL DEFAULT 0,
  revenue_influenced numeric NOT NULL DEFAULT 0,
  roi_multiple numeric,
  roi_percentage numeric,
  subscription_cost numeric,
  net_roi numeric,
  -- narrative (generated summary)
  executive_summary text,
  wins jsonb,
  risks jsonb,
  next_actions jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, report_date, report_period)
);

-- pilot_journey_performance: per-journey stats per org per period
CREATE TABLE IF NOT EXISTS pilot_journey_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  journey_type text NOT NULL CHECK (journey_type IN ('welcome', 'treatment', 'review', 'referral', 'membership', 'recall')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  journeys_started integer NOT NULL DEFAULT 0,
  journeys_completed integer NOT NULL DEFAULT 0,
  completion_rate numeric NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  conversion_rate numeric NOT NULL DEFAULT 0,
  revenue_influenced numeric NOT NULL DEFAULT 0,
  revenue_generated numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, journey_type, period_start)
);

-- alice_performance_snapshots: periodic ALICE accuracy tracking
CREATE TABLE IF NOT EXISTS alice_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  recommendations_generated integer NOT NULL DEFAULT 0,
  recommendations_accepted integer NOT NULL DEFAULT 0,
  recommendations_rejected integer NOT NULL DEFAULT 0,
  acceptance_rate numeric NOT NULL DEFAULT 0,
  prediction_accuracy numeric,
  intent_score_accuracy numeric,
  treatment_acceptance_accuracy numeric,
  revenue_forecast_accuracy numeric,
  avg_confidence numeric,
  learning_signals_processed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, snapshot_date)
);

-- RLS
ALTER TABLE pilot_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_roi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_journey_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE alice_performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON pilot_scorecards FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON pilot_daily_metrics FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON pilot_roi_reports FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON pilot_journey_performance FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON alice_performance_snapshots FOR ALL TO service_role USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pilot_scorecards_org ON pilot_scorecards (organization_id);
CREATE INDEX IF NOT EXISTS idx_pilot_daily_metrics_org_date ON pilot_daily_metrics (organization_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_pilot_roi_reports_org ON pilot_roi_reports (organization_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_pilot_journey_org_type ON pilot_journey_performance (organization_id, journey_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_alice_performance_org_date ON alice_performance_snapshots (organization_id, snapshot_date DESC);

COMMIT;
