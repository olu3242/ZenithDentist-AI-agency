-- Batch 11-15, Phase 5 (ALICE — Chief Intelligence Officer)
-- Additive column on the existing agent_recommendations table (Batch 9,
-- migration 202606220006_agent_learning.sql) so ALICE's revenue-intelligence
-- recommendations can point at the responsible executing agent (IVY/FINN/
-- MAX/NOVA) who will carry out the recommended action via the existing
-- ExecutionEngine.run() path once approved. No new recommendations table.

ALTER TABLE public.agent_recommendations
  ADD COLUMN IF NOT EXISTS responsible_agent_id uuid REFERENCES public.agent_registry(id);

CREATE INDEX IF NOT EXISTS idx_agent_recommendations_responsible_agent
  ON public.agent_recommendations (responsible_agent_id);
