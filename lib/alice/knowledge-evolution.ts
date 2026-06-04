import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export async function createKnowledgeVersion(opts: {
  versionNumber: number;
  trainingSource: string;
  summary?: string;
  confidenceScore?: number;
}): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "";

  const { data } = await (supabase as any)
    .from("alice_knowledge_versions")
    .insert({
      version_number: opts.versionNumber,
      training_source: opts.trainingSource,
      summary: opts.summary ?? null,
      confidence_score: opts.confidenceScore ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  return data?.id ?? "";
}

export async function promoteKnowledgeVersion(versionNumber: number): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  // Roll back any currently active versions
  await (supabase as any)
    .from("alice_knowledge_versions")
    .update({ status: "rolled_back" })
    .eq("status", "active");

  // Promote the target version
  await (supabase as any)
    .from("alice_knowledge_versions")
    .update({ status: "active", promoted_at: new Date().toISOString() })
    .eq("version_number", versionNumber);

  publishRuntimeFabricEvent({
    eventKey: "knowledge_promoted",
    eventType: "governance",
    sourceSystem: "alice_knowledge",
    targetChannel: "mission_control",
    priority: "high",
    summary: `ALICE knowledge version ${versionNumber} promoted to active.`,
  }).catch(() => null);
}

export async function rollbackKnowledgeVersion(versionNumber: number, reason: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await (supabase as any)
    .from("alice_knowledge_versions")
    .update({
      status: "rolled_back",
      rolled_back_at: new Date().toISOString(),
      rollback_reason: reason,
    })
    .eq("version_number", versionNumber);

  publishRuntimeFabricEvent({
    eventKey: "knowledge_rolled_back",
    eventType: "governance",
    sourceSystem: "alice_knowledge",
    targetChannel: "mission_control",
    priority: "high",
    summary: `ALICE knowledge version ${versionNumber} rolled back. Reason: ${reason}`,
  }).catch(() => null);
}

export async function getActiveKnowledgeVersion(): Promise<{
  versionNumber: number;
  trainingSource: string;
  confidenceScore: number;
  effectiveDate: string;
} | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await (supabase as any)
    .from("alice_knowledge_versions")
    .select("version_number, training_source, confidence_score, promoted_at")
    .eq("status", "active")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    versionNumber: data.version_number as number,
    trainingSource: data.training_source as string,
    confidenceScore: data.confidence_score as number ?? 0,
    effectiveDate: data.promoted_at as string ?? new Date().toISOString(),
  };
}

export async function recordRecommendationFeedback(opts: {
  organizationId: string;
  recommendationId?: string;
  recommendationType?: string;
  accepted: boolean;
  outcomeRevenueImpact?: number;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const insertPromise = (supabase as any)
    .from("alice_recommendation_feedback")
    .insert({
      organization_id: opts.organizationId,
      recommendation_id: opts.recommendationId ?? null,
      recommendation_type: opts.recommendationType ?? null,
      accepted: opts.accepted,
      outcome_revenue_impact: opts.outcomeRevenueImpact ?? null,
    });

  const eventKey = opts.accepted ? "recommendation_accepted" : "recommendation_rejected";
  const eventPromise = publishRuntimeFabricEvent({
    eventKey,
    eventType: "agent",
    sourceSystem: "alice_knowledge",
    targetChannel: "mission_control",
    priority: "low",
    summary: `Recommendation ${opts.accepted ? "accepted" : "rejected"} for org ${opts.organizationId}.`,
  });

  // Non-blocking
  Promise.all([insertPromise, eventPromise]).catch(() => null);
}

export async function getRecommendationAccuracy(
  organizationId: string
): Promise<{ totalIssued: number; accepted: number; rejected: number; acceptanceRate: number; avgImpactScore: number }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { totalIssued: 0, accepted: 0, rejected: 0, acceptanceRate: 0, avgImpactScore: 0 };
  }

  const { data } = await (supabase as any)
    .from("alice_recommendation_feedback")
    .select("accepted, outcome_revenue_impact")
    .eq("organization_id", organizationId);

  const rows = (data ?? []) as Array<{ accepted: boolean; outcome_revenue_impact: number | null }>;

  const totalIssued = rows.length;
  const accepted = rows.filter((r) => r.accepted).length;
  const rejected = totalIssued - accepted;
  const acceptanceRate = totalIssued > 0 ? Math.round((accepted / totalIssued) * 100) : 0;
  const impactValues = rows
    .map((r) => r.outcome_revenue_impact ?? 0)
    .filter((v) => v > 0);
  const avgImpactScore = impactValues.length
    ? Math.round(impactValues.reduce((s, v) => s + v, 0) / impactValues.length)
    : 0;

  return { totalIssued, accepted, rejected, acceptanceRate, avgImpactScore };
}
