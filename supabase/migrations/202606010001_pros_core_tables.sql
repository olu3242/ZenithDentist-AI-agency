-- ============================================================
-- PROS Core Tables — Patients, Appointments, Workflow Execution
-- 202606010001_pros_core_tables.sql
-- ============================================================

BEGIN;

-- ─── Helper: ensure update_updated_at_column function exists ─────────────────
-- Alias for the existing public.set_updated_at() so both naming conventions work.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── patients ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id           text,           -- PMS source ID
  pms_source            text,           -- 'dentrix' | 'eaglesoft' | 'open_dental' | 'denticon'
  first_name            text NOT NULL,
  last_name             text NOT NULL,
  email                 text,
  phone                 text,
  date_of_birth         date,
  last_visit_date       date,
  next_appointment_date date,
  recall_due_date       date,
  lifetime_value        numeric(10,2) DEFAULT 0,
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','inactive','archived')),
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

COMMENT ON TABLE public.patients IS 'Patient master data synced from PMS providers';

CREATE INDEX IF NOT EXISTS idx_patients_org     ON public.patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_created ON public.patients(created_at DESC);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients_org_isolation" ON public.patients
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

CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── appointments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id        uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  external_id       text,   -- PMS source ID
  pms_source        text,
  provider_name     text,
  appointment_type  text,
  scheduled_at      timestamptz NOT NULL,
  duration_minutes  integer DEFAULT 60,
  status            text NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show')),
  production_value  numeric(10,2) DEFAULT 0,
  notes             text,
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

COMMENT ON TABLE public.appointments IS 'Appointment records synced from PMS providers';

CREATE INDEX IF NOT EXISTS idx_appointments_org          ON public.appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created      ON public.appointments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient      ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_org_isolation" ON public.appointments
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

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── workflow_executions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id         text NOT NULL,
  workflow_version    text DEFAULT '1.0',
  trace_id            uuid REFERENCES public.automation_traces(id) ON DELETE SET NULL,
  patient_id          uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id      uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  trigger_name        text NOT NULL,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','running','completed','failed','cancelled')),
  started_at          timestamptz DEFAULT now(),
  completed_at        timestamptz,
  execution_context   jsonb DEFAULT '{}',
  result              jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_org         ON public.workflow_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created     ON public.workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_patient     ON public.workflow_executions(patient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status      ON public.workflow_executions(status);

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_executions_org_isolation" ON public.workflow_executions
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

CREATE TRIGGER set_workflow_executions_updated_at
  BEFORE UPDATE ON public.workflow_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── workflow_events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  execution_id    uuid NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  step_name       text,
  payload         jsonb DEFAULT '{}',
  occurred_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_org       ON public.workflow_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created   ON public.workflow_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_events_execution ON public.workflow_events(execution_id);

ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_events_org_isolation" ON public.workflow_events
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

-- ─── automation_retries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_retries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trace_id        uuid REFERENCES public.automation_traces(id) ON DELETE CASCADE,
  execution_id    uuid REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  attempt_number  integer NOT NULL DEFAULT 1,
  attempted_at    timestamptz DEFAULT now(),
  status          text NOT NULL CHECK (status IN ('pending','success','failed')),
  failure_reason  text,
  next_retry_at   timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_retries_org     ON public.automation_retries(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_retries_created ON public.automation_retries(created_at DESC);

ALTER TABLE public.automation_retries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_retries_org_isolation" ON public.automation_retries
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

-- ─── automation_execution_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  execution_id    uuid REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  level           text NOT NULL CHECK (level IN ('debug','info','warn','error')),
  message         text NOT NULL,
  context         jsonb DEFAULT '{}',
  logged_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_org     ON public.automation_execution_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_created ON public.automation_execution_logs(logged_at DESC);

ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_execution_logs_org_isolation" ON public.automation_execution_logs
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
