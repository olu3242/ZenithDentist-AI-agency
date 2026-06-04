import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type MembershipAgentTask = {
  organizationId: string;
  patientExternalId: string;
};

export async function runMembershipAgentTask(task: MembershipAgentTask): Promise<any> {
  const { organizationId, patientExternalId } = task;
  const supabase = createServiceClient();

  try {
    const { data: scores } = supabase
      ? await (supabase as any)
          .from("patient_influence_scores")
          .select("membership_conversion_score")
          .eq("organization_id", organizationId)
          .eq("patient_external_id", patientExternalId)
          .order("computed_at", { ascending: false })
          .limit(1)
          .single()
      : { data: null };

    const membershipScore: number = scores?.membership_conversion_score ?? 0;

    let action: string;
    let channel: string;
    let confidence: number;
    let reasoning: string;

    if (membershipScore >= 70) {
      action = "offer_membership_video";
      channel = "video";
      confidence = 0.82;
      reasoning = `High membership conversion score (${membershipScore}) — personalized video offer recommended.`;
    } else if (membershipScore >= 50) {
      action = "offer_membership_sms";
      channel = "sms";
      confidence = 0.68;
      reasoning = `Moderate membership conversion score (${membershipScore}) — SMS offer recommended.`;
    } else {
      action = "no_action";
      channel = "none";
      confidence = 0.85;
      reasoning = `Low membership conversion score (${membershipScore}) — no outreach recommended.`;
    }

    const recommendation = { action, channel, confidence, reasoning, membershipScore };

    if (supabase) {
      (async () => {
        try {
          await (supabase as any).from("agent_recommendations").insert({
            organization_id: organizationId,
            patient_external_id: patientExternalId,
            agent_key: "membership_agent",
            action,
            channel,
            confidence,
            reasoning,
            status: "pending",
            context: { membershipScore },
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_tasks").insert({
            organization_id: organizationId,
            agent_key: "membership_agent",
            patient_external_id: patientExternalId,
            status: "completed",
            result: recommendation,
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_events").insert({
            organization_id: organizationId,
            agent_key: "membership_agent",
            event_type: "agent.completed",
            payload: { patientExternalId, recommendation },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          logger.warn("membership_agent.persist_failed_non_blocking", { error: String(err) });
        }
      })();
    }

    logger.info("membership_agent.task_completed", { organizationId, patientExternalId, action });
    return { ok: true, recommendation };
  } catch (err) {
    logger.error("membership_agent.task_failed", { organizationId, patientExternalId, error: String(err) });
    return { ok: false, error: String(err) };
  }
}

export async function getMembershipRecommendations(organizationId: string): Promise<any[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("agent_recommendations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("agent_key", "membership_agent")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as any[];
}
