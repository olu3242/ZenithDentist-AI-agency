import "server-only";

import type { Json } from "@/lib/database.types";
import { routeEvidence } from "@/lib/evidence/evidence-router";
import { validateEvidence } from "@/lib/evidence/evidence-validator";
import type { EvidenceInput } from "@/lib/evidence/evidence-registry";
import { createServiceClient } from "@/lib/supabase/server";

export async function produceEvidence(input: EvidenceInput) {
  const validation = validateEvidence(input);
  if (!validation.valid) {
    return { ok: false, skipped: true, reason: `missing:${validation.missing.join(",")}` };
  }
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, skipped: true, reason: "supabase_unavailable" };

  const routed = routeEvidence(input);
  const payload = {
    organization_id: input.organizationId,
    trace_id: input.traceId,
    correlation_id: input.correlationId ?? null,
    patient_id: input.patientId ?? null,
    actor: input.actor,
    source: input.source,
    action: input.action,
    reason: input.reason ?? null,
    outcome: input.outcome,
    revenue_amount: input.revenueAmount ?? 0,
    metadata: {
      ...(input.metadata ?? {}),
      workflow_id: input.workflowId ?? null,
      operational_event: routed.operationalEvent,
      evidence_event: routed.evidenceEvent,
      audit_event: routed.auditEvent,
      certification_event: routed.certificationEvent
    } as Json
  };

  const { error } = await (supabase as any).from(routed.table).insert(payload);
  if (error) return { ok: false, skipped: false, reason: error.message };
  return { ok: true, skipped: false, table: routed.table };
}
