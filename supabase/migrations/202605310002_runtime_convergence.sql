-- Runtime Convergence: add organization_id to automation_dead_letters
-- This enables DB-level org isolation for dead letter queries

ALTER TABLE public.automation_dead_letters
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill organization_id from the parent automation_trace
UPDATE public.automation_dead_letters dl
SET organization_id = t.organization_id
FROM public.automation_traces t
WHERE dl.trace_id = t.trace_id
  AND dl.organization_id IS NULL;

-- Index for org-scoped dead letter lookups
CREATE INDEX IF NOT EXISTS idx_automation_dead_letters_org
  ON public.automation_dead_letters(organization_id, created_at DESC);

-- RLS: members of the org can read their org's dead letters
ALTER TABLE public.automation_dead_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "dead_letters_org_read"
  ON public.automation_dead_letters
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );
