import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type ClientHealthScore = {
  organizationId: string;
  scoreDate: string;
  overallScore: number;
  usageScore: number;
  journeyCompletionScore: number;
  patientEngagementScore: number;
  revenueAttributionScore: number;
  communicationHealthScore: number;
  providerAdoptionScore: number;
  healthTier: "green" | "yellow" | "red";
  topRisk?: string;
  topOpportunity?: string;
};

export async function calculateClientHealthScore(
  organizationId: string
): Promise<ClientHealthScore> {
  const supabase = createServiceClient();
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  if (!supabase) return buildZeroScore(organizationId);

  const client = supabase as any;

  const [
    journeyResult,
    influenceResult,
    revenueResult,
    agentResult,
    integrationResult,
    avatarResult,
  ] = await Promise.all([
    client
      .from("journey_assignments")
      .select("id, status")
      .eq("organization_id", organizationId)
      .gte("started_at", mtdStart),
    client
      .from("patient_influence_scores")
      .select("overall_influence_score")
      .eq("organization_id", organizationId)
      .limit(200),
    client
      .from("revenue_attribution_records")
      .select("id")
      .eq("organization_id", organizationId)
      .gte("created_at", mtdStart),
    client
      .from("agent_executions")
      .select("id, status")
      .eq("organization_id", organizationId)
      .gte("created_at", mtdStart)
      .limit(500),
    client
      .from("integration_installations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    client
      .from("avatar_profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("status", "active"),
  ]);

  // Journey completion score
  const journeys = (journeyResult.data ?? []) as Array<{ status: string }>;
  const completedJourneys = journeys.filter((j) => j.status === "completed").length;
  const journeyCompletionScore = journeys.length > 0
    ? Math.min(100, Math.round((completedJourneys / journeys.length) * 100) + 30)
    : 30;

  // Patient engagement score
  const influenceScores = (influenceResult.data ?? []) as Array<{ overall_influence_score: number }>;
  const avgInfluence = influenceScores.length > 0
    ? influenceScores.reduce((s, r) => s + (r.overall_influence_score ?? 0), 0) / influenceScores.length
    : 0;
  const patientEngagementScore = Math.min(100, Math.round(avgInfluence));

  // Revenue attribution score
  const revenueCount = (revenueResult.data ?? []).length;
  const revenueAttributionScore = Math.min(100, revenueCount * 5 + (revenueCount > 0 ? 40 : 0));

  // Usage score (agent execution success rate)
  const executions = (agentResult.data ?? []) as Array<{ status: string }>;
  const successfulExec = executions.filter((e) => e.status === "success" || e.status === "completed").length;
  const usageScore = executions.length > 0
    ? Math.min(100, Math.round((successfulExec / executions.length) * 100))
    : 0;

  // Communication health score (active integrations)
  const integrationCount = (integrationResult.data ?? []).length;
  const communicationHealthScore = Math.min(100, integrationCount * 20);

  // Provider adoption score (active avatars)
  const avatarCount = (avatarResult.data ?? []).length;
  const providerAdoptionScore = Math.min(100, avatarCount * 25);

  // Weighted overall (total = 100)
  const overallScore = Math.round(
    usageScore * 0.20 +
    journeyCompletionScore * 0.20 +
    patientEngagementScore * 0.20 +
    revenueAttributionScore * 0.20 +
    communicationHealthScore * 0.10 +
    providerAdoptionScore * 0.10
  );

  const healthTier: ClientHealthScore["healthTier"] =
    overallScore >= 80 ? "green" : overallScore >= 60 ? "yellow" : "red";

  const dimensions = [
    { label: "Usage (Agent Executions)", score: usageScore },
    { label: "Journey Completion", score: journeyCompletionScore },
    { label: "Patient Engagement", score: patientEngagementScore },
    { label: "Revenue Attribution", score: revenueAttributionScore },
    { label: "Communication Health", score: communicationHealthScore },
    { label: "Provider Adoption", score: providerAdoptionScore },
  ];

  const lowestDimension = dimensions.reduce((min, d) => (d.score < min.score ? d : min), dimensions[0]);

  let topOpportunity: string | undefined;
  if (providerAdoptionScore < 50) topOpportunity = "Activate avatar profiles for providers";
  else if (journeyCompletionScore < 50) topOpportunity = "Deploy patient journeys";
  else if (communicationHealthScore < 50) topOpportunity = "Connect communication integrations";
  else if (revenueAttributionScore < 50) topOpportunity = "Increase revenue attribution tracking";

  const scoreDate = now.toISOString().slice(0, 10);

  const result: ClientHealthScore = {
    organizationId,
    scoreDate,
    overallScore,
    usageScore,
    journeyCompletionScore,
    patientEngagementScore,
    revenueAttributionScore,
    communicationHealthScore,
    providerAdoptionScore,
    healthTier,
    topRisk: lowestDimension.score < 60 ? lowestDimension.label : undefined,
    topOpportunity,
  };

  await client
    .from("client_health_scores")
    .upsert(
      {
        organization_id: organizationId,
        score_date: scoreDate,
        overall_score: overallScore,
        usage_score: usageScore,
        journey_completion_score: journeyCompletionScore,
        patient_engagement_score: patientEngagementScore,
        revenue_attribution_score: revenueAttributionScore,
        communication_health_score: communicationHealthScore,
        provider_adoption_score: providerAdoptionScore,
        health_tier: healthTier,
        top_risk: result.topRisk ?? null,
        top_opportunity: topOpportunity ?? null,
        updated_at: now.toISOString(),
      },
      { onConflict: "organization_id,score_date" }
    )
    .catch(() => {});

  return result;
}

export async function getClientHealthScore(
  organizationId: string
): Promise<ClientHealthScore | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await (supabase as any)
    .from("client_health_scores")
    .select("*")
    .eq("organization_id", organizationId)
    .order("score_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    organizationId: data.organization_id,
    scoreDate: data.score_date,
    overallScore: data.overall_score,
    usageScore: data.usage_score,
    journeyCompletionScore: data.journey_completion_score,
    patientEngagementScore: data.patient_engagement_score,
    revenueAttributionScore: data.revenue_attribution_score,
    communicationHealthScore: data.communication_health_score,
    providerAdoptionScore: data.provider_adoption_score,
    healthTier: data.health_tier,
    topRisk: data.top_risk ?? undefined,
    topOpportunity: data.top_opportunity ?? undefined,
  };
}

export async function getImplementationStatus(
  organizationId: string
): Promise<{
  phase: string;
  healthStatus: string;
  completedTasks: number;
  totalTasks: number;
  nextMilestone: string | null;
}> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { phase: "unknown", healthStatus: "unknown", completedTasks: 0, totalTasks: 0, nextMilestone: null };
  }

  const client = supabase as any;

  const [projectResult, tasksResult] = await Promise.all([
    client
      .from("implementation_projects")
      .select("current_phase, risk_level, status")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("implementation_tasks")
      .select("id, status")
      .eq("organization_id", organizationId),
  ]);

  const project = projectResult.data;
  const tasks = (tasksResult.data ?? []) as Array<{ status: string }>;
  const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "done").length;

  const phaseOrder = ["signed", "discovery", "configuration", "integration", "testing", "training", "go_live", "optimization", "completed"];
  const currentPhase = project?.current_phase ?? "unknown";
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const nextMilestone = currentIdx >= 0 && currentIdx < phaseOrder.length - 1
    ? phaseOrder[currentIdx + 1]
    : null;

  return {
    phase: currentPhase,
    healthStatus: project?.risk_level ?? project?.status ?? "active",
    completedTasks,
    totalTasks: tasks.length,
    nextMilestone,
  };
}

export async function createImplementationProject(
  organizationId: string,
  opts: {
    projectName: string;
    startDate?: string;
    targetGoLiveDate?: string;
    assignedCsm?: string;
  }
): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "";

  const { data } = await (supabase as any)
    .from("implementation_projects")
    .upsert(
      {
        organization_id: organizationId,
        client_name: opts.projectName,
        implementation_owner: opts.assignedCsm ?? null,
        go_live_date: opts.targetGoLiveDate ?? null,
        signed_at: opts.startDate ?? new Date().toISOString(),
        current_phase: "signed",
        completion_percent: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    )
    .select("id")
    .single();

  return data?.id ?? "";
}

export async function completeImplementationTask(
  organizationId: string,
  taskKey: string,
  evidence?: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await (supabase as any)
    .from("implementation_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      evidence_notes: evidence ?? null,
    })
    .eq("organization_id", organizationId)
    .eq("checklist_item_key", taskKey);
}

export async function recordPilotEvent(
  organizationId: string,
  eventType: string,
  detail?: Record<string, unknown>,
  patientExternalId?: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (supabase as any)
    .from("pilot_health_events")
    .insert({
      organization_id: organizationId,
      event_type: eventType,
      detail: detail ?? null,
      patient_external_id: patientExternalId ?? null,
      occurred_at: new Date().toISOString(),
    })
    .then(() => {})
    .catch(() => {});
}

function buildZeroScore(organizationId: string): ClientHealthScore {
  return {
    organizationId,
    scoreDate: new Date().toISOString().slice(0, 10),
    overallScore: 0,
    usageScore: 0,
    journeyCompletionScore: 0,
    patientEngagementScore: 0,
    revenueAttributionScore: 0,
    communicationHealthScore: 0,
    providerAdoptionScore: 0,
    healthTier: "red",
    topRisk: "Platform not configured",
    topOpportunity: "Configure platform integrations",
  };
}
