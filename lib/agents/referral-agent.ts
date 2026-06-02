import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type ReferralAgentTask = {
  organizationId: string;
  patientExternalId: string;
};

export async function runReferralAgentTask(task: ReferralAgentTask): Promise<any> {
  const { organizationId, patientExternalId } = task;
  const supabase = createServiceClient();

  try {
    const { data: scores } = supabase
      ? await (supabase as any)
          .from("patient_influence_scores")
          .select("referral_probability_score")
          .eq("organization_id", organizationId)
          .eq("patient_external_id", patientExternalId)
          .order("computed_at", { ascending: false })
          .limit(1)
          .single()
      : { data: null };

    const referralScore: number = scores?.referral_probability_score ?? 0;

    let action: string;
    let channel: string;
    let confidence: number;
    let reasoning: string;

    if (referralScore >= 65) {
      action = "launch_referral_video";
      channel = "video";
      confidence = 0.82;
      reasoning = `High referral probability (${referralScore}) — personalized referral video recommended.`;
    } else if (referralScore >= 45) {
      action = "launch_referral_sms";
      channel = "sms";
      confidence = 0.68;
      reasoning = `Moderate referral probability (${referralScore}) — SMS referral campaign recommended.`;
    } else {
      action = "no_action";
      channel = "none";
      confidence = 0.80;
      reasoning = `Low referral probability (${referralScore}) — no outreach recommended at this time.`;
    }

    const recommendation = { action, channel, confidence, reasoning, referralScore };

    if (supabase) {
      (async () => {
        try {
          await (supabase as any).from("agent_recommendations").insert({
            organization_id: organizationId,
            patient_external_id: patientExternalId,
            agent_key: "referral_agent",
            action,
            channel,
            confidence,
            reasoning,
            status: "pending",
            context: { referralScore },
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_tasks").insert({
            organization_id: organizationId,
            agent_key: "referral_agent",
            patient_external_id: patientExternalId,
            status: "completed",
            result: recommendation,
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_events").insert({
            organization_id: organizationId,
            agent_key: "referral_agent",
            event_type: "agent.completed",
            payload: { patientExternalId, recommendation },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          logger.warn("referral_agent.persist_failed_non_blocking", { error: String(err) });
        }
      })();
    }

    logger.info("referral_agent.task_completed", { organizationId, patientExternalId, action });
    return { ok: true, recommendation };
  } catch (err) {
    logger.error("referral_agent.task_failed", { organizationId, patientExternalId, error: String(err) });
    return { ok: false, error: String(err) };
  }
}
