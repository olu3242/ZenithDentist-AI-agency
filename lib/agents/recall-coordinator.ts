import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type RecallCoordinatorTask = {
  organizationId: string;
  patientExternalId: string;
  monthsOverdue: number;
};

export async function runRecallCoordinatorTask(task: RecallCoordinatorTask): Promise<any> {
  const { organizationId, patientExternalId, monthsOverdue } = task;
  const supabase = createServiceClient();

  try {
    let action: string;
    let priority: string;
    let channel: string;
    let confidence: number;
    let reasoning: string;

    if (monthsOverdue >= 12) {
      action = "launch_recall_video";
      priority = "high";
      channel = "video";
      confidence = 0.88;
      reasoning = `Patient is ${monthsOverdue} months overdue — high-priority video recall required.`;
    } else if (monthsOverdue >= 6) {
      action = "launch_recall_sms";
      priority = "medium";
      channel = "sms";
      confidence = 0.75;
      reasoning = `Patient is ${monthsOverdue} months overdue — SMS recall recommended.`;
    } else {
      action = "recall_email";
      priority = "low";
      channel = "email";
      confidence = 0.65;
      reasoning = `Patient is ${monthsOverdue} months overdue — standard email recall.`;
    }

    const recommendation = { action, priority, channel, confidence, reasoning, monthsOverdue };

    if (supabase) {
      (async () => {
        try {
          await (supabase as any).from("agent_recommendations").insert({
            organization_id: organizationId,
            patient_external_id: patientExternalId,
            agent_key: "recall_coordinator",
            action,
            channel,
            confidence,
            reasoning,
            status: "pending",
            context: { monthsOverdue },
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_tasks").insert({
            organization_id: organizationId,
            agent_key: "recall_coordinator",
            patient_external_id: patientExternalId,
            status: "completed",
            result: recommendation,
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_events").insert({
            organization_id: organizationId,
            agent_key: "recall_coordinator",
            event_type: "agent.completed",
            payload: { patientExternalId, recommendation },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          logger.warn("recall_coordinator.persist_failed_non_blocking", { error: String(err) });
        }
      })();
    }

    logger.info("recall_coordinator.task_completed", { organizationId, patientExternalId, action });
    return { ok: true, recommendation };
  } catch (err) {
    logger.error("recall_coordinator.task_failed", { organizationId, patientExternalId, error: String(err) });
    return { ok: false, error: String(err) };
  }
}

export async function getRecallRecommendations(organizationId: string): Promise<any[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("agent_recommendations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("agent_key", "recall_coordinator")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as any[];
}
