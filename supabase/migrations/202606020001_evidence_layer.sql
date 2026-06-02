-- ============================================================
-- Evidence Layer — Workflow, Recommendation & Revenue Traceability
-- 202606020001_evidence_layer.sql
-- ============================================================

BEGIN;

-- ─── Helper: ensure update_updated_at_column function exists ─────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── workflow_execution_evidence ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_execution_evidence (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  execution_id     uuid REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  evidence_type    text NOT NULL CHECK (evidence_type IN (
    'sms_delivered','email_delivered','call_completed','booking_confirmed',
    'appointment_scheduled','payment_received','review_posted',
    'webhook_returned','n8n_receipt'
  )),
  evidence_payload jsonb DEFAULT '{}',
  source           text NOT NULL DEFAULT 'system', -- 'n8n' | 'system' | 'pms' | 'twilio' | 'sendgrid'
  trace_id         uuid,
  recorded_at      timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_evidence_org     ON public.workflow_execution_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_evidence_created ON public.workflow_execution_evidence(created_at DESC);

ALTER TABLE public.workflow_execution_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_execution_evidence_org_isolation" ON public.workflow_execution_evidence
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

-- ─── alice_recommendation_traces ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alice_recommendation_traces (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trace_id           uuid UNIQUE DEFAULT gen_random_uuid(),
  agent_name         text NOT NULL, -- 'revenue_analyst' | 'operations_analyst' | 'patient_journey_analyst' | 'executive_advisor'
  problem            text NOT NULL,
  impact             text NOT NULL,
  evidence           jsonb DEFAULT '[]', -- array of evidence pointers
  confidence         numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  recommended_action text NOT NULL,
  expected_outcome   text NOT NULL,
  workflow_id        text, -- if recommendation maps to a workflow
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','launched','completed','dismissed')),
  outcome            text, -- actual outcome after action taken
  generated_at       timestamptz DEFAULT now(),
  launched_at        timestamptz,
  completed_at       timestamptz,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alice_recommendation_traces_org     ON public.alice_recommendation_traces(organization_id);
CREATE INDEX IF NOT EXISTS idx_alice_recommendation_traces_created ON public.alice_recommendation_traces(created_at DESC);

ALTER TABLE public.alice_recommendation_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alice_recommendation_traces_org_isolation" ON public.alice_recommendation_traces
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

-- ─── revenue_attribution_records ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revenue_attribution_records (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  execution_id       uuid REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  attribution_type   text NOT NULL CHECK (attribution_type IN (
    'recall_recovery','no_show_prevention','treatment_acceptance',
    'chair_fill','review_referral','referral','other'
  )),
  attributed_revenue numeric(10,2) NOT NULL DEFAULT 0,
  attribution_date   date NOT NULL DEFAULT CURRENT_DATE,
  patient_id         uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id     uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  confidence         numeric(3,2) DEFAULT 1.0,
  evidence_ids       uuid[] DEFAULT '{}',
  notes              text,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_attribution_records_org     ON public.revenue_attribution_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_revenue_attribution_records_created ON public.revenue_attribution_records(created_at DESC);

ALTER TABLE public.revenue_attribution_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "revenue_attribution_records_org_isolation" ON public.revenue_attribution_records
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

-- ─── forecast_runs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.forecast_runs (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id            text NOT NULL,
  forecast_type          text NOT NULL CHECK (forecast_type IN (
    'revenue','appointments','response_rate','recovery_rate'
  )),
  input_params           jsonb DEFAULT '{}',
  expected_revenue       numeric(10,2),
  expected_appointments  integer,
  expected_response_rate numeric(5,2),
  confidence             numeric(3,2),
  run_by                 text DEFAULT 'alice', -- 'alice' | 'user' | 'system'
  executed               boolean DEFAULT false,
  actual_revenue         numeric(10,2),
  variance_pct           numeric(6,2),
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecast_runs_org     ON public.forecast_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_created ON public.forecast_runs(created_at DESC);

ALTER TABLE public.forecast_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forecast_runs_org_isolation" ON public.forecast_runs
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

CREATE TRIGGER set_forecast_runs_updated_at
  BEFORE UPDATE ON public.forecast_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── claim_registry ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.claim_registry (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  claim_type            text NOT NULL CHECK (claim_type IN (
    'revenue_recovered','appointment_booked','review_generated',
    'no_show_prevented','chair_filled','referral_converted'
  )),
  claim_value           numeric(10,2),
  claim_date            date NOT NULL DEFAULT CURRENT_DATE,
  evidence_execution_id uuid REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  evidence_record_id    uuid REFERENCES public.workflow_execution_evidence(id) ON DELETE SET NULL,
  verified              boolean DEFAULT false,
  verified_at           timestamptz,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_registry_org     ON public.claim_registry(organization_id);
CREATE INDEX IF NOT EXISTS idx_claim_registry_created ON public.claim_registry(created_at DESC);

ALTER TABLE public.claim_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claim_registry_org_isolation" ON public.claim_registry
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

-- ─── mission_control_events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_control_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  severity        text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical','fatal')),
  title           text NOT NULL,
  description     text,
  workflow_id     text,
  execution_id    uuid REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  trace_id        uuid,
  metadata        jsonb DEFAULT '{}',
  acknowledged    boolean DEFAULT false,
  acknowledged_at timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_control_events_org     ON public.mission_control_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_mission_control_events_created ON public.mission_control_events(created_at DESC);

ALTER TABLE public.mission_control_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_control_events_org_isolation" ON public.mission_control_events
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

-- ─── mission_control_actions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mission_control_actions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        uuid REFERENCES public.mission_control_events(id) ON DELETE CASCADE,
  action_type     text NOT NULL CHECK (action_type IN (
    'retry','replay','escalate','dismiss','alert','remediate'
  )),
  performed_by    text DEFAULT 'system',
  result          text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_control_actions_org     ON public.mission_control_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_mission_control_actions_created ON public.mission_control_actions(created_at DESC);

ALTER TABLE public.mission_control_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_control_actions_org_isolation" ON public.mission_control_actions
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

-- ─── report_generation_log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.report_generation_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type     text NOT NULL,
  generated_by    text DEFAULT 'alice',
  period_start    date,
  period_end      date,
  output_url      text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_generation_log_org     ON public.report_generation_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_generation_log_created ON public.report_generation_log(created_at DESC);

ALTER TABLE public.report_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_generation_log_org_isolation" ON public.report_generation_log
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
