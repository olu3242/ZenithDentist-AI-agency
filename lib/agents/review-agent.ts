import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type ReviewAgentTask = {
  organizationId: string;
  patientExternalId: string;
};

export async function runReviewAgentTask(task: ReviewAgentTask): Promise<any> {
  const { organizationId, patientExternalId } = task;
  const supabase = createServiceClient();

  try {
    const { data: scores } = supabase
      ? await (supabase as any)
          .from("patient_influence_scores")
          .select("review_probability_score")
          .eq("organization_id", organizationId)
          .eq("patient_external_id", patientExternalId)
          .order("computed_at", { ascending: false })
          .limit(1)
          .single()
      : { data: null };

    const reviewScore: number = scores?.review_probability_score ?? 0;

    let action: string;
    let channel: string;
    let confidence: number;
    let reasoning: string;

    if (reviewScore >= 70) {
      action = "send_review_request_sms";
      channel = "sms";
      confidence = 0.83;
      reasoning = `High review probability (${reviewScore}) — SMS review request recommended for best conversion.`;
    } else if (reviewScore >= 50) {
      action = "send_review_request_email";
      channel = "email";
      confidence = 0.68;
      reasoning = `Moderate review probability (${reviewScore}) — email review request recommended.`;
    } else {
      action = "no_action";
      channel = "none";
      confidence = 0.80;
      reasoning = `Low review probability (${reviewScore}) — no outreach recommended at this time.`;
    }

    const recommendation = { action, channel, confidence, reasoning, reviewScore };

    if (supabase) {
      (async () => {
        try {
          await (supabase as any).from("agent_recommendations").insert({
            organization_id: organizationId,
            patient_external_id: patientExternalId,
            agent_key: "review_agent",
            action,
            channel,
            confidence,
            reasoning,
            status: "pending",
            context: { reviewScore },
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_tasks").insert({
            organization_id: organizationId,
            agent_key: "review_agent",
            patient_external_id: patientExternalId,
            status: "completed",
            result: recommendation,
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_events").insert({
            organization_id: organizationId,
            agent_key: "review_agent",
            event_type: "agent.completed",
            payload: { patientExternalId, recommendation },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          logger.warn("review_agent.persist_failed_non_blocking", { error: String(err) });
        }
      })();
    }

    logger.info("review_agent.task_completed", { organizationId, patientExternalId, action });
    return { ok: true, recommendation };
  } catch (err) {
    logger.error("review_agent.task_failed", { organizationId, patientExternalId, error: String(err) });
    return { ok: false, error: String(err) };
  }
}
