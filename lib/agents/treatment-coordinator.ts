import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type TreatmentCoordinatorTask = {
  organizationId: string;
  patientExternalId: string;
  treatmentCode?: string;
  treatmentFee?: number;
  context?: Record<string, unknown>;
};

export type TreatmentCoordinatorResult = {
  ok: boolean;
  recommendation?: {
    action:
      | "follow_up_video"
      | "follow_up_sms"
      | "offer_financing"
      | "schedule_consultation"
      | "escalate_to_provider"
      | "no_action";
    channel: string;
    scriptTheme: string;
    confidence: number;
    reasoning: string;
    revenuePotential: number;
  };
  error?: string;
};

export async function runTreatmentCoordinatorTask(
  task: TreatmentCoordinatorTask
): Promise<TreatmentCoordinatorResult> {
  const { organizationId, patientExternalId, treatmentFee } = task;
  const supabase = createServiceClient();

  try {
    const { data: scores } = supabase
      ? await (supabase as any)
          .from("patient_influence_scores")
          .select("treatment_intent_score, engagement_score")
          .eq("organization_id", organizationId)
          .eq("patient_external_id", patientExternalId)
          .order("computed_at", { ascending: false })
          .limit(1)
          .single()
      : { data: null };

    const { data: memoryRows } = supabase
      ? await (supabase as any)
          .from("practice_memory_records")
          .select("record_type, content, created_at")
          .eq("organization_id", organizationId)
          .eq("patient_external_id", patientExternalId)
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] };

    const treatmentIntentScore: number = scores?.treatment_intent_score ?? 0;
    const engagementScore: number = scores?.engagement_score ?? 0;
    const fee = treatmentFee ?? 0;

    type ActionType = NonNullable<TreatmentCoordinatorResult["recommendation"]>["action"];
    let action: ActionType = "follow_up_sms";
    let channel = "sms";
    let scriptTheme = "treatment_follow_up";
    let confidence = 0.65;
    let reasoning = "Default follow-up recommended based on standard protocol.";
    let revenuePotential = fee;

    if (treatmentIntentScore >= 70 && engagementScore >= 60) {
      action = "follow_up_video";
      channel = "video";
      scriptTheme = "high_intent_treatment_follow_up";
      confidence = 0.85;
      reasoning = `High treatment intent (${treatmentIntentScore}) and strong engagement (${engagementScore}) indicate patient readiness for personalized video outreach.`;
      revenuePotential = fee > 0 ? fee : 800;
    } else if (treatmentIntentScore >= 50 && fee >= 1000) {
      action = "offer_financing";
      channel = "sms";
      scriptTheme = "financing_offer";
      confidence = 0.75;
      reasoning = `Moderate treatment intent (${treatmentIntentScore}) with high-value treatment ($${fee}) — financing offer may remove barrier to acceptance.`;
      revenuePotential = fee;
    } else if (treatmentIntentScore < 30) {
      action = "no_action";
      channel = "none";
      scriptTheme = "none";
      confidence = 0.9;
      reasoning = `Low treatment intent score (${treatmentIntentScore}) — no outreach recommended at this time.`;
      revenuePotential = 0;
    }

    const recommendation = { action, channel, scriptTheme, confidence, reasoning, revenuePotential };

    if (supabase) {
      (async () => {
        try {
          await (supabase as any).from("agent_recommendations").insert({
            organization_id: organizationId,
            patient_external_id: patientExternalId,
            agent_key: "treatment_coordinator",
            action,
            channel,
            script_theme: scriptTheme,
            confidence,
            reasoning,
            revenue_potential: revenuePotential,
            status: "pending",
            context: task.context ?? {},
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_tasks").insert({
            organization_id: organizationId,
            agent_key: "treatment_coordinator",
            patient_external_id: patientExternalId,
            status: "completed",
            result: recommendation,
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_events").insert({
            organization_id: organizationId,
            agent_key: "treatment_coordinator",
            event_type: "agent.completed",
            payload: { patientExternalId, recommendation },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          logger.warn("treatment_coordinator.persist_failed_non_blocking", { error: String(err) });
        }
      })();
    }

    logger.info("treatment_coordinator.task_completed", { organizationId, patientExternalId, action, confidence });
    return { ok: true, recommendation };
  } catch (err) {
    logger.error("treatment_coordinator.task_failed", { organizationId, patientExternalId, error: String(err) });
    return { ok: false, error: String(err) };
  }
}

export async function getTreatmentCoordinatorRecommendations(organizationId: string): Promise<any[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("agent_recommendations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("agent_key", "treatment_coordinator")
    .eq("status", "pending")
    .order("confidence", { ascending: false });

  return (data ?? []) as any[];
}
