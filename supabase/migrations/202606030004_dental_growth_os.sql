BEGIN;

-- ============================================================
-- Dental Growth OS™ | Practice Intelligence OS™ | Growth Score™
-- Migration: 202606030004_dental_growth_os
-- ============================================================

-- 1. growth_scores
CREATE TABLE IF NOT EXISTS growth_scores (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           uuid NOT NULL REFERENCES organizations(id),
  score_date                date NOT NULL,
  review_score              numeric(5,2) DEFAULT 0,
  referral_score            numeric(5,2) DEFAULT 0,
  membership_score          numeric(5,2) DEFAULT 0,
  recall_score              numeric(5,2) DEFAULT 0,
  treatment_acceptance_score numeric(5,2) DEFAULT 0,
  new_patient_score         numeric(5,2) DEFAULT 0,
  revenue_growth_score      numeric(5,2) DEFAULT 0,
  overall_score             numeric(5,2) GENERATED ALWAYS AS (
    LEAST(100, GREATEST(0,
      (review_score + referral_score + membership_score + recall_score +
       treatment_acceptance_score + new_patient_score + revenue_growth_score) / 7.0
    ))
  ) STORED,
  created_at                timestamptz DEFAULT now(),
  CONSTRAINT growth_scores_overall_check CHECK (overall_score >= 0 AND overall_score <= 100),
  UNIQUE (organization_id, score_date)
);

ALTER TABLE growth_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON growth_scores USING (auth.role() = 'service_role');

-- 2. reputation_events
CREATE TABLE IF NOT EXISTS reputation_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id),
  event_type            text NOT NULL, -- 'review_requested', 'review_received', 'review_responded', 'review_recovered'
  platform              text,          -- 'google', 'yelp', 'healthgrades', 'zocdoc'
  patient_external_id   text,
  rating                numeric(3,1),
  review_text           text,
  sentiment             text,          -- 'positive', 'neutral', 'negative'
  responded_at          timestamptz,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON reputation_events USING (auth.role() = 'service_role');

-- 3. referral_tracking
CREATE TABLE IF NOT EXISTS referral_tracking (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id                 uuid NOT NULL REFERENCES organizations(id),
  referring_patient_external_id   text NOT NULL,
  referred_patient_external_id    text,
  referral_source                 text, -- 'patient', 'provider', 'campaign'
  campaign_id                     text,
  converted_at                    timestamptz,
  revenue_attributed              numeric(12,2) DEFAULT 0,
  status                          text DEFAULT 'pending', -- 'pending', 'converted', 'cancelled'
  metadata                        jsonb DEFAULT '{}',
  created_at                      timestamptz DEFAULT now()
);

ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON referral_tracking USING (auth.role() = 'service_role');

-- 4. membership_tracking
CREATE TABLE IF NOT EXISTS membership_tracking (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id),
  patient_external_id   text NOT NULL,
  plan_name             text NOT NULL,
  status                text NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'pending'
  enrolled_at           timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz,
  cancelled_at          timestamptz,
  monthly_value         numeric(12,2) DEFAULT 0,
  annual_value          numeric(12,2) DEFAULT 0,
  renewal_count         int DEFAULT 0,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE membership_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON membership_tracking USING (auth.role() = 'service_role');

-- 5. new_patient_leads
CREATE TABLE IF NOT EXISTS new_patient_leads (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id),
  lead_source           text NOT NULL, -- 'website', 'google_business', 'ads', 'referral', 'landing_page', 'roi_calculator', 'phone'
  patient_external_id   text,
  lead_status           text DEFAULT 'new', -- 'new', 'contacted', 'scheduled', 'converted', 'lost'
  contact_email         text,
  contact_phone         text,
  treatment_interest    text,
  converted_at          timestamptz,
  revenue_attributed    numeric(12,2) DEFAULT 0,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE new_patient_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON new_patient_leads USING (auth.role() = 'service_role');

-- 6. recall_tracking
CREATE TABLE IF NOT EXISTS recall_tracking (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organizations(id),
  patient_external_id   text NOT NULL,
  last_visit_date       date,
  months_overdue        int GENERATED ALWAYS AS (
    CASE
      WHEN last_visit_date IS NULL THEN NULL
      ELSE GREATEST(0,
        (EXTRACT(EPOCH FROM (now() - (last_visit_date + interval '6 months'))) / 2592000)::int
      )
    END
  ) STORED,
  outreach_count        int DEFAULT 0,
  last_outreach_at      timestamptz,
  status                text DEFAULT 'overdue', -- 'overdue', 'contacted', 'scheduled', 'recovered', 'lost'
  recovered_at          timestamptz,
  revenue_attributed    numeric(12,2) DEFAULT 0,
  workflow_id           text,
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE recall_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON recall_tracking USING (auth.role() = 'service_role');

-- 7. practice_intelligence_snapshots
CREATE TABLE IF NOT EXISTS practice_intelligence_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id),
  snapshot_date           date NOT NULL,
  snapshot_type           text NOT NULL, -- 'daily', 'weekly', 'monthly'
  patient_intelligence    jsonb DEFAULT '{}',
  provider_intelligence   jsonb DEFAULT '{}',
  practice_intelligence   jsonb DEFAULT '{}',
  campaign_intelligence   jsonb DEFAULT '{}',
  computed_at             timestamptz DEFAULT now(),
  created_at              timestamptz DEFAULT now(),
  UNIQUE (organization_id, snapshot_date, snapshot_type)
);

ALTER TABLE practice_intelligence_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON practice_intelligence_snapshots USING (auth.role() = 'service_role');

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_growth_scores_org_date
  ON growth_scores (organization_id, score_date DESC);

CREATE INDEX IF NOT EXISTS idx_reputation_events_org_created
  ON reputation_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reputation_events_org_type
  ON reputation_events (organization_id, event_type);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_org_status
  ON referral_tracking (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_org_referring
  ON referral_tracking (organization_id, referring_patient_external_id);

CREATE INDEX IF NOT EXISTS idx_membership_tracking_org_status
  ON membership_tracking (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_membership_tracking_org_patient
  ON membership_tracking (organization_id, patient_external_id);

CREATE INDEX IF NOT EXISTS idx_new_patient_leads_org_status
  ON new_patient_leads (organization_id, lead_status);

CREATE INDEX IF NOT EXISTS idx_new_patient_leads_org_source
  ON new_patient_leads (organization_id, lead_source);

CREATE INDEX IF NOT EXISTS idx_recall_tracking_org_status
  ON recall_tracking (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_recall_tracking_org_patient
  ON recall_tracking (organization_id, patient_external_id);

CREATE INDEX IF NOT EXISTS idx_practice_intelligence_snapshots_org_date
  ON practice_intelligence_snapshots (organization_id, snapshot_date DESC);

COMMIT;
