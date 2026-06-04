import "server-only";

import type { Json } from "@/lib/database.types";
import { produceEvidence } from "@/lib/evidence/evidence-producer";
import { createServiceClient } from "@/lib/supabase/server";

export async function persistAliceTrace(input: {
  organizationId: string;
  traceId: string;
  recommendation: string;
  reasoning: string[];
  confidence: number;
  inputs?: Record<string, unknown>;
  outcome?: string;
  impact?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { persisted: false, reason: "supabase_unavailable" };
  const client = supabase as any;
  const { data: decision, error } = await client.from("alice_decisions").insert({
    organization_id: input.organizationId,
    trace_id: input.traceId,
    decision_type: "recommendation",
    recommendation: input.recommendation,
    confidence: input.confidence,
    inputs: (input.inputs ?? {}) as Json,
    reasoning: input.reasoning.join("\n"),
    outcome: input.outcome ?? null,
    business_impact: input.impact ?? null
  }).select("id").single();
  if (error || !decision?.id) return { persisted: false, reason: error?.message ?? "decision_missing" };

  await Promise.all([
    client.from("alice_recommendations").insert({
      organization_id: input.organizationId,
      alice_decision_id: decision.id,
      recommendation: input.recommendation,
      recommended_action: input.recommendation,
      confidence: input.confidence,
      status: input.outcome ? "resolved" : "open"
    }),
    client.from("alice_reasoning").insert(input.reasoning.map(reasoningStep => ({
      organization_id: input.organizationId,
      alice_decision_id: decision.id,
      reasoning_step: reasoningStep,
      evidence: (input.inputs ?? {}) as Json
    }))),
    client.from("alice_confidence").insert({
      organization_id: input.organizationId,
      alice_decision_id: decision.id,
      confidence_score: input.confidence,
      confidence_reason: input.reasoning[0] ?? "ALICE confidence recorded."
    }),
    input.outcome ? client.from("alice_outcomes").insert({
      organization_id: input.organizationId,
      alice_decision_id: decision.id,
      outcome: input.outcome,
      impact_value: 0,
      verified: false
    }) : Promise.resolve(),
    produceEvidence({
      type: "ALICE_EVENT",
      organizationId: input.organizationId,
      traceId: input.traceId,
      actor: "alice",
      source: "alice_traceability",
      action: "recommendation_persisted",
      reason: input.reasoning[0],
      outcome: input.outcome ?? "recommendation_open",
      metadata: { decision_id: decision.id, confidence: input.confidence, impact: input.impact }
    })
  ]);
  return { persisted: true, decisionId: decision.id };
}
