-- Compatibility view to satisfy runtime and reporting queries that reference workflow_executions
-- Read-only view that surfaces persisted execution records (workflow_runs)
-- enriched with latest telemetry from automation_traces where available.

CREATE OR REPLACE VIEW public.workflow_executions AS
SELECT
  wr.id AS id,
  wr.organization_id,
  wr.workflow_id,
  wr.status,
  COALESCE(at.retry_count, 0) AS retry_count,
  at.failure_reason,
  wr.started_at AS created_at,
  wr.completed_at,
  wr.correlation_id,
  wr.idempotency_key,
  wr.latency_ms,
  wr.metadata
FROM public.workflow_runs wr
LEFT JOIN LATERAL (
  SELECT retry_count, failure_reason, started_at
  FROM public.automation_traces at
  WHERE at.workflow_id = wr.workflow_id
    AND wr.organization_id::text = at.organization_id
  ORDER BY at.started_at DESC
  LIMIT 1
) at ON true;
