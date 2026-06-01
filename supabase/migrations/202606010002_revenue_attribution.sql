-- ============================================================
-- Revenue Attribution — Link workflow executions to revenue outcomes
-- 202606010002_revenue_attribution.sql
--
-- Depends on: 202605300001_dental_revenue_os.sql (revenue tables)
--             202606010001_pros_core_tables.sql   (workflow_executions, patients)
-- ============================================================

BEGIN;

-- ─── Add workflow_execution_id to revenue tracking tables ────────────────────
-- Enables end-to-end attribution: workflow trigger → patient action → revenue

ALTER TABLE public.revenue_recovery_events
  ADD COLUMN IF NOT EXISTS workflow_execution_id uuid
    REFERENCES public.workflow_executions(id) ON DELETE SET NULL;

ALTER TABLE public.recall_recovery_events
  ADD COLUMN IF NOT EXISTS workflow_execution_id uuid
    REFERENCES public.workflow_executions(id) ON DELETE SET NULL;

ALTER TABLE public.recall_recovery_events
  ADD COLUMN IF NOT EXISTS patient_id uuid
    REFERENCES public.patients(id) ON DELETE SET NULL;

ALTER TABLE public.review_growth_events
  ADD COLUMN IF NOT EXISTS workflow_execution_id uuid
    REFERENCES public.workflow_executions(id) ON DELETE SET NULL;

ALTER TABLE public.chair_utilization_snapshots
  ADD COLUMN IF NOT EXISTS workflow_execution_id uuid
    REFERENCES public.workflow_executions(id) ON DELETE SET NULL;

-- ─── Indexes for attribution queries ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_revenue_recovery_execution
  ON public.revenue_recovery_events(workflow_execution_id)
  WHERE workflow_execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recall_recovery_execution
  ON public.recall_recovery_events(workflow_execution_id)
  WHERE workflow_execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recall_recovery_patient
  ON public.recall_recovery_events(patient_id)
  WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_review_growth_execution
  ON public.review_growth_events(workflow_execution_id)
  WHERE workflow_execution_id IS NOT NULL;

-- ─── Attribution view: workflow → revenue outcome ─────────────────────────────
CREATE OR REPLACE VIEW public.workflow_revenue_attribution AS
SELECT
  we.id                                             AS execution_id,
  we.organization_id,
  we.workflow_id,
  we.patient_id,
  we.trigger_name,
  we.status                                         AS execution_status,
  we.started_at,
  we.completed_at,
  COALESCE(rre.amount_recovered, 0)                 AS revenue_recovered,
  rre.recovery_type,
  CASE WHEN rcre.appointment_booked THEN 1 ELSE 0 END AS recall_booked,
  CASE WHEN rge.converted THEN 1 ELSE 0 END           AS review_generated
FROM public.workflow_executions we
LEFT JOIN public.revenue_recovery_events rre
  ON rre.workflow_execution_id = we.id
LEFT JOIN public.recall_recovery_events rcre
  ON rcre.workflow_execution_id = we.id
LEFT JOIN public.review_growth_events rge
  ON rge.workflow_execution_id = we.id;

COMMIT;
