import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type GrowthAgentTask = {
  organizationId: string;
};

export async function runGrowthAgentTask(task: GrowthAgentTask): Promise<any> {
  const { organizationId } = task;
  const supabase = createServiceClient();

  try {
    const { data: scoreRow } = supabase
      ? await (supabase as any)
          .from("growth_scores")
          .select("overall_score, score_data")
          .eq("organization_id", organizationId)
          .order("score_date", { ascending: false })
          .limit(1)
          .single()
      : { data: null };

    const overallScore: number = scoreRow?.overall_score ?? 0;
    const scoreData: Record<string, unknown> = (scoreRow?.score_data as Record<string, unknown>) ?? {};
    const topOpportunity: string = (scoreData.topOpportunity as string) ?? "Review all growth dimensions";

    let action: string;
    let priority: string;
    let confidence: number;
    let reasoning: string;

    const dimensionScores: Record<string, number> = {
      reviews: Number(scoreData.reviewScore ?? 0),
      referrals: Number(scoreData.referralScore ?? 0),
      membership: Number(scoreData.membershipScore ?? 0),
      recall: Number(scoreData.recallScore ?? 0),
      treatment_acceptance: Number(scoreData.treatmentAcceptanceScore ?? 0),
      new_patients: Number(scoreData.newPatientScore ?? 0),
      revenue_growth: Number(scoreData.revenueGrowthScore ?? 50),
    };

    const sorted = Object.entries(dimensionScores).sort(([, a], [, b]) => a - b);

    if (overallScore < 50) {
      action = `improve_${sorted[0][0]}`;
      priority = "high";
      confidence = 0.88;
      reasoning = `Overall growth score critically low (${overallScore}). Top opportunity: ${topOpportunity}`;
    } else if (overallScore < 70) {
      const secondLowest = sorted[1]?.[0] ?? sorted[0][0];
      action = `improve_${secondLowest}`;
      priority = "medium";
      confidence = 0.75;
      reasoning = `Growth score needs improvement (${overallScore}). Recommend improving ${secondLowest} dimension.`;
    } else {
      action = "maintain_growth_momentum";
      priority = "low";
      confidence = 0.80;
      reasoning = `Growth score is healthy (${overallScore}). Continue current strategies.`;
    }

    const recommendation = { action, priority, confidence, reasoning, overallScore, topOpportunity };

    if (supabase) {
      (async () => {
        try {
          await (supabase as any).from("agent_recommendations").insert({
            organization_id: organizationId,
            agent_key: "growth_agent",
            action,
            confidence,
            reasoning,
            status: "pending",
            context: { overallScore, topOpportunity },
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_tasks").insert({
            organization_id: organizationId,
            agent_key: "growth_agent",
            status: "completed",
            result: recommendation,
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_events").insert({
            organization_id: organizationId,
            agent_key: "growth_agent",
            event_type: "agent.completed",
            payload: { recommendation },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          logger.warn("growth_agent.persist_failed_non_blocking", { error: String(err) });
        }
      })();
    }

    logger.info("growth_agent.task_completed", { organizationId, action, overallScore });
    return { ok: true, recommendation };
  } catch (err) {
    logger.error("growth_agent.task_failed", { organizationId, error: String(err) });
    return { ok: false, error: String(err) };
  }
}

export async function getGrowthRecommendations(organizationId: string): Promise<any[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("agent_recommendations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("agent_key", "growth_agent")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as any[];
}
