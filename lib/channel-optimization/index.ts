import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type OptimizedChannel = "video" | "voice" | "sms" | "email" | "whatsapp" | "portal" | "staff";

export interface ChannelRecommendation {
  patientExternalId: string;
  recommendedChannel: OptimizedChannel;
  recommendedTiming: string;
  recommendedCta: string;
  confidenceScore: number;
  factors: Record<string, unknown>;
}

const timingByScore = (score: number): string =>
  score > 80
    ? "within_24h"
    : score > 60
    ? "within_48h"
    : score > 40
    ? "within_7d"
    : "within_14d";

export async function selectOptimalChannel(opts: {
  organizationId: string;
  patientExternalId: string;
  journeyType: string;
  procedureType?: string;
}): Promise<ChannelRecommendation> {
  const supabase = createServiceClient();

  const [profilesResult, influenceResult] = await Promise.all([
    supabase
      ? (supabase as any)
          .from("conversion_profiles")
          .select("preferred_channel, best_cta, best_timing, profile_type, readiness_score")
          .eq("organization_id", opts.organizationId)
          .eq("patient_external_id", opts.patientExternalId)
          .limit(5)
      : { data: [] },
    supabase
      ? (supabase as any)
          .from("patient_influence_scores")
          .select("engagement_score, treatment_intent_score, overall_influence_score")
          .eq("organization_id", opts.organizationId)
          .eq("patient_external_id", opts.patientExternalId)
          .maybeSingle()
      : { data: null },
  ]);

  const profiles = profilesResult.data ?? [];
  const influence = influenceResult.data;
  const overallScore: number = influence?.overall_influence_score ?? 50;

  const bestProfile =
    profiles.find((p: Record<string, string>) => p.preferred_channel) ?? profiles[0];
  const recommendedChannel: OptimizedChannel =
    (bestProfile?.preferred_channel as OptimizedChannel) ??
    (overallScore > 75 ? "video" : overallScore > 50 ? "sms" : "email");

  const recommendation: ChannelRecommendation = {
    patientExternalId: opts.patientExternalId,
    recommendedChannel,
    recommendedTiming: bestProfile?.best_timing ?? timingByScore(overallScore),
    recommendedCta: bestProfile?.best_cta ?? "Schedule Now",
    confidenceScore: bestProfile ? 0.85 : 0.6,
    factors: {
      profileCount: profiles.length,
      overallScore,
      journeyType: opts.journeyType,
    },
  };

  if (supabase) {
    await (supabase as any).from("channel_selections").insert({
      organization_id: opts.organizationId,
      patient_external_id: opts.patientExternalId,
      journey_type: opts.journeyType,
      procedure_type: opts.procedureType ?? null,
      recommended_channel: recommendation.recommendedChannel,
      recommended_timing: recommendation.recommendedTiming,
      recommended_cta: recommendation.recommendedCta,
      confidence_score: recommendation.confidenceScore,
      optimization_factors: recommendation.factors,
    });

    await publishRuntimeFabricEvent({
      eventKey: `channel.selected.${opts.patientExternalId}`,
      eventType: "agent",
      sourceSystem: "channel_optimization",
      targetChannel: "intelligence",
      priority: "low",
      summary: `Channel selected: ${recommendation.recommendedChannel} (confidence ${recommendation.confidenceScore})`,
      payload: {
        patientExternalId: opts.patientExternalId,
        channel: recommendation.recommendedChannel,
        confidence: recommendation.confidenceScore,
      },
    }).catch(() => {});
  }

  return recommendation;
}
