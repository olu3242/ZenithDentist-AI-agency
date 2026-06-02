import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type ProcedureType =
  | "implant"
  | "invisalign"
  | "crown"
  | "veneer"
  | "root_canal"
  | "high_value"
  | "standard"
  | "other";

// Base acceptance rates by procedure type (industry benchmarks)
const BASE_ACCEPTANCE_RATES: Record<ProcedureType, number> = {
  implant: 42,
  invisalign: 55,
  crown: 68,
  veneer: 60,
  root_canal: 72,
  high_value: 50,
  standard: 78,
  other: 65,
};

export interface TreatmentPrediction {
  patientExternalId: string;
  procedureType: ProcedureType;
  acceptanceProbability: number;
  delayRisk: number;
  lossRisk: number;
  financingProbability: number;
  estimatedRevenue: number;
  recommendedAction: string;
  recommendedChannel: string;
  confidenceScore: number;
}

export async function predictTreatmentAcceptance(opts: {
  organizationId: string;
  patientExternalId: string;
  procedureType: ProcedureType;
  estimatedRevenue?: number;
}): Promise<TreatmentPrediction> {
  const supabase = createServiceClient();

  const [influenceResult, profileResult] = await Promise.all([
    supabase
      ? (supabase as any)
          .from("patient_influence_scores")
          .select("treatment_intent_score, engagement_score, loyalty_score")
          .eq("organization_id", opts.organizationId)
          .eq("patient_external_id", opts.patientExternalId)
          .maybeSingle()
      : { data: null },
    supabase
      ? (supabase as any)
          .from("conversion_profiles")
          .select("readiness_score, preferred_channel, best_cta, confidence_score")
          .eq("organization_id", opts.organizationId)
          .eq("patient_external_id", opts.patientExternalId)
          .eq("profile_type", "treatment_acceptance")
          .maybeSingle()
      : { data: null },
  ]);

  const influence = influenceResult.data;
  const profile = profileResult.data;

  const base = BASE_ACCEPTANCE_RATES[opts.procedureType];
  const intentModifier = (influence?.treatment_intent_score ?? 50) / 100;
  const engagementModifier = (influence?.engagement_score ?? 50) / 200;
  const profileModifier = profile ? profile.readiness_score / 200 : 0;

  const acceptanceProbability = Math.min(
    95,
    Math.round(base + intentModifier * 20 + engagementModifier * 10 + profileModifier * 10)
  );
  const delayRisk = Math.max(5, Math.round(50 - intentModifier * 30));
  const lossRisk = Math.max(5, Math.round(30 - (influence?.loyalty_score ?? 50) / 5));
  const financingProbability =
    opts.estimatedRevenue && opts.estimatedRevenue > 3000
      ? Math.round(30 + (influence?.engagement_score ?? 50) / 4)
      : 15;

  const prediction: TreatmentPrediction = {
    patientExternalId: opts.patientExternalId,
    procedureType: opts.procedureType,
    acceptanceProbability,
    delayRisk,
    lossRisk,
    financingProbability,
    estimatedRevenue: opts.estimatedRevenue ?? 0,
    recommendedAction:
      acceptanceProbability > 70
        ? "schedule_consult"
        : delayRisk > 60
        ? "educational_video"
        : "coordinator_followup",
    recommendedChannel: profile?.preferred_channel ?? "video",
    confidenceScore: profile ? Number(profile.confidence_score) / 100 : 0.6,
  };

  if (supabase) {
    await (supabase as any).from("treatment_acceptance_predictions").insert({
      organization_id: opts.organizationId,
      patient_external_id: opts.patientExternalId,
      procedure_type: opts.procedureType,
      acceptance_probability: prediction.acceptanceProbability,
      delay_risk: prediction.delayRisk,
      loss_risk: prediction.lossRisk,
      financing_probability: prediction.financingProbability,
      estimated_revenue: prediction.estimatedRevenue,
      recommended_action: prediction.recommendedAction,
      recommended_channel: prediction.recommendedChannel,
      confidence_score: prediction.confidenceScore,
    });

    await publishRuntimeFabricEvent({
      eventKey: `intent.score.updated.${opts.patientExternalId}`,
      eventType: "agent",
      sourceSystem: "treatment_intelligence",
      targetChannel: "intelligence",
      priority: "moderate",
      summary: `Treatment acceptance predicted: ${acceptanceProbability}% for ${opts.procedureType}`,
      payload: {
        patientExternalId: opts.patientExternalId,
        procedureType: opts.procedureType,
        acceptanceProbability,
      },
    }).catch(() => {});
  }

  return prediction;
}
