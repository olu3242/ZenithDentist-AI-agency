-- Revenue Conversion Pipeline — Sprint 3
-- Creates: opportunities table, cta_events table
-- Alters: bookings (add assessment_id), outreach_events (extend event_type)

-- ── OPPORTUNITIES ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid REFERENCES leads(id) ON DELETE SET NULL,
  assessment_id uuid,                          -- FK to roi_calculations.id
  audit_id      uuid,                          -- FK to audits.id
  booking_id    uuid,                          -- FK to bookings.id (set on booking)
  stage         text NOT NULL DEFAULT 'assessment_submitted',
  -- stage enum: assessment_submitted | booking_created | strategy_session | qualified | won | lost
  pipeline_value          numeric(12,2) DEFAULT 0,
  estimated_recovery      numeric(12,2) DEFAULT 0,
  practice_name           text,
  contact_email           text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS lead_id uuid,
  ADD COLUMN IF NOT EXISTS assessment_id uuid,
  ADD COLUMN IF NOT EXISTS audit_id uuid,
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS pipeline_value numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_recovery numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS practice_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_opportunities" ON opportunities;
CREATE POLICY "service_role_all_opportunities" ON opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_opportunities_lead_id ON opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at DESC);

-- ── CTA EVENTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cta_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid,
  session_id    text,
  source        text,                          -- which CTA was clicked
  page          text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  referrer      text,
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cta_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_cta_events" ON cta_events;
CREATE POLICY "service_role_all_cta_events" ON cta_events FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cta_events_lead_id ON cta_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_cta_events_source ON cta_events(source);
CREATE INDEX IF NOT EXISTS idx_cta_events_created_at ON cta_events(created_at DESC);

-- ── ALTER BOOKINGS — add assessment_id ────────────────────────────────────────

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assessment_id uuid;

-- ── UPDATED_AT TRIGGER FOR OPPORTUNITIES ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_opportunities_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON opportunities;
CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_opportunities_updated_at();
