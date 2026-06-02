import "server-only";

import type { Json } from "@/lib/database.types";
import { produceEvidence } from "@/lib/evidence/evidence-producer";
import { calculateSlaCompliance, type SlaSnapshot } from "@/lib/sla/sla-engine";
import { createServiceClient } from "@/lib/supabase/server";

export async function trackSlaEvent(input: { organizationId: string; slaType: string; snapshot: SlaSnapshot; traceId: string; metadata?: Record<string, unknown> }) {
  const supabase = createServiceClient();
  const result = calculateSlaCompliance(input.snapshot);
  if (!supabase) return { persisted: false, result };
  const client = supabase as any;
  await Promise.all([
    client.from("sla_scores").insert({
      organization_id: input.organizationId,
      availability_score: input.snapshot.availability,
      response_score: input.snapshot.response,
      resolution_score: input.snapshot.resolution,
      recovery_score: input.snapshot.recovery,
      compliance_percent: result.compliance,
      metadata: (input.metadata ?? {}) as Json
    }),
    result.forecastedBreach ? client.from("sla_forecasts").insert({
      organization_id: input.organizationId,
      forecast_type: input.slaType,
      forecast_percent: result.compliance,
      risk_level: result.compliance < 80 ? "high" : "medium",
      metadata: (input.metadata ?? {}) as Json
    }) : Promise.resolve(),
    produceEvidence({ type: "SLA_EVENT", organizationId: input.organizationId, traceId: input.traceId, actor: "sla_tracker", source: "sla", action: input.slaType, outcome: result.status, metadata: { compliance: result.compliance } })
  ]);
  return { persisted: true, result };
}
