import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getIntelligenceProvider } from "@/lib/ai/provider";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export interface AlicePatientDecision {
  id?: string;
  patientExternalId: string;
  decisionType:
    | "intervention"
    | "journey_update"
    | "channel_change"
    | "escalation"
    | "hold"
    | "no_action";
  who: string;
  what: string;
  when: string;
  why: string;
  how: string;
  confidenceScore: number;
  expectedRevenue: number;
  expectedConversionRate: number;
  expectedFollowup: string;
  recommendedJourneyType?: string;
  recommendedChannel?: string;
}

export async function generatePatientDecision(opts: {
  organizationId: string;
  patientExternalId: string;
  context?: Record<string, unknown>;
}): Promise<AlicePatientDecision> {
  const supabase = createServiceClient();
  const provider = getIntelligenceProvider();

  const [influenceResult, treatmentResult] = await Promise.all([
    supabase
      ? (supabase as any)
          .from("patient_influence_scores")
          .select("*")
          .eq("organization_id", opts.organizationId)
          .eq("patient_external_id", opts.patientExternalId)
          .maybeSingle()
      : { data: null },
    supabase
      ? (supabase as any)
          .from("treatment_acceptance_predictions")
          .select(
            "procedure_type, acceptance_probability, recommended_action, recommended_channel"
          )
          .eq("organization_id", opts.organizationId)
          .eq("patient_external_id", opts.patientExternalId)
          .order("predicted_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null },
  ]);

  const influence = influenceResult.data;
  const treatment = treatmentResult.data;
  const overallScore: number = influence?.overall_influence_score ?? 50;

  const systemPrompt =
    "You are ALICE, a dental revenue intelligence system. Respond only with valid JSON.";
  const userPrompt = `You are ALICE, the Zenith Patient Intelligence Engine. Analyze this patient's scores and generate a precise intervention decision.

Patient External ID: ${opts.patientExternalId}
Overall Influence Score: ${overallScore}/100
Engagement Score: ${influence?.engagement_score ?? "unknown"}
Treatment Intent Score: ${influence?.treatment_intent_score ?? "unknown"}
Recall Recovery Score: ${influence?.recall_recovery_score ?? "unknown"}
Review Probability: ${influence?.review_probability_score ?? "unknown"}
Most Recent Treatment Prediction: ${treatment ? JSON.stringify(treatment) : "none"}

Respond with a JSON object with exactly these fields:
{
  "decisionType": "intervention|journey_update|channel_change|escalation|hold|no_action",
  "who": "which team member or system should act",
  "what": "specific action to take",
  "when": "timing recommendation",
  "why": "one sentence rationale",
  "how": "delivery method or workflow",
  "confidenceScore": 0.0-1.0,
  "expectedRevenue": dollar amount,
  "expectedConversionRate": 0-100,
  "expectedFollowup": "next action after this decision",
  "recommendedJourneyType": "recall|treatment_acceptance|review_request|referral|membership|null",
  "recommendedChannel": "video|sms|email|whatsapp|portal|staff|null"
}`;

  let decision: AlicePatientDecision;

  try {
    const response = await provider.complete({
      system: systemPrompt,
      prompt: userPrompt,
      context: opts.context ?? {},
    });
    const parsed = JSON.parse(
      response.content.replace(/```json\n?|\n?```/g, "").trim()
    );
    decision = {
      patientExternalId: opts.patientExternalId,
      decisionType: parsed.decisionType ?? "no_action",
      who: parsed.who ?? "system",
      what: parsed.what ?? "no action required",
      when: parsed.when ?? "within_7d",
      why: parsed.why ?? "insufficient signal",
      how: parsed.how ?? "automated",
      confidenceScore: Math.min(1, Math.max(0, parsed.confidenceScore ?? 0.5)),
      expectedRevenue: parsed.expectedRevenue ?? 0,
      expectedConversionRate: Math.min(100, Math.max(0, parsed.expectedConversionRate ?? 0)),
      expectedFollowup: parsed.expectedFollowup ?? "reassess_in_30_days",
      recommendedJourneyType: parsed.recommendedJourneyType ?? undefined,
      recommendedChannel: parsed.recommendedChannel ?? undefined,
    };
  } catch {
    // Rule-based fallback
    decision = {
      patientExternalId: opts.patientExternalId,
      decisionType:
        overallScore > 70
          ? "intervention"
          : overallScore > 50
          ? "journey_update"
          : "hold",
      who: overallScore > 70 ? "treatment_coordinator" : "automated_system",
      what:
        treatment?.recommended_action ??
        (overallScore > 60 ? "schedule_followup" : "send_education_content"),
      when: overallScore > 70 ? "within_24h" : "within_7d",
      why: `Patient influence score ${overallScore}/100 indicates ${overallScore > 70 ? "high" : "moderate"} engagement opportunity`,
      how: treatment?.recommended_channel ?? "video",
      confidenceScore: 0.65,
      expectedRevenue: 0,
      expectedConversionRate: overallScore * 0.6,
      expectedFollowup: "reassess_in_14_days",
    };
  }

  if (supabase) {
    const { data: saved } = await (supabase as any)
      .from("alice_patient_decisions")
      .insert({
        organization_id: opts.organizationId,
        patient_external_id: opts.patientExternalId,
        decision_type: decision.decisionType,
        who: decision.who,
        what: decision.what,
        when_to_execute: null,
        why: decision.why,
        how: decision.how,
        confidence_score: decision.confidenceScore,
        expected_revenue: decision.expectedRevenue,
        expected_conversion_rate: decision.expectedConversionRate,
        expected_followup: decision.expectedFollowup,
        recommended_journey_type: decision.recommendedJourneyType ?? null,
        recommended_channel: decision.recommendedChannel ?? null,
      })
      .select("id")
      .single();

    decision.id = saved?.id;

    await publishRuntimeFabricEvent({
      eventKey: `alice.recommendation.created.${opts.patientExternalId}`,
      eventType: "agent",
      sourceSystem: "alice_patient_decision_engine",
      targetChannel: "intelligence",
      priority: "moderate",
      summary: `ALICE decision: ${decision.decisionType} (confidence ${decision.confidenceScore})`,
      payload: {
        patientExternalId: opts.patientExternalId,
        decisionType: decision.decisionType,
        confidence: decision.confidenceScore,
      },
    }).catch(() => {});
  }

  return decision;
}

export async function getPendingPatientDecisions(
  organizationId: string
): Promise<AlicePatientDecision[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any)
    .from("alice_patient_decisions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    patientExternalId: d.patient_external_id as string,
    decisionType: d.decision_type as AlicePatientDecision["decisionType"],
    who: d.who as string,
    what: d.what as string,
    when: (d.when_to_execute as string) ?? "",
    why: d.why as string,
    how: d.how as string,
    confidenceScore: d.confidence_score as number,
    expectedRevenue: d.expected_revenue as number,
    expectedConversionRate: d.expected_conversion_rate as number,
    expectedFollowup: d.expected_followup as string,
    recommendedJourneyType: d.recommended_journey_type as string | undefined,
    recommendedChannel: d.recommended_channel as string | undefined,
  }));
}
