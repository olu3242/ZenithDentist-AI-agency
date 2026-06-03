import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type ExecutiveBriefing = {
  organizationId: string;
  briefingDate: string;
  opportunities: Array<{ type: string; description: string; estimatedValue: number; priority: string }>;
  risks: Array<{ type: string; description: string; severity: string; affectedPatients?: number }>;
  revenueForecast: { next30d: number; next90d: number; confidence: number };
  growthForecast: { growthScore: number; trend: string; topDriver: string };
  workflowHealth: { score: number; activeIncidents: number; reliabilityScore: number };
  topRecommendations: Array<{ type: string; action: string; estimatedImpact: number; confidence: number }>;
  priorityActions: string[];
  projectedBusinessImpact: { monthlyRevenueImpact: number; annualRevenueImpact: number; roiMultiple: number };
  executiveIntelligenceScore: number;
};

export async function generateExecutiveBriefing(organizationId: string): Promise<ExecutiveBriefing> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase client unavailable");

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  const [
    oppResult,
    recallResult,
    forecast30Result,
    forecast90Result,
    growthResult,
    workflowResult,
    recsResult,
  ] = await Promise.all([
    (supabase as any)
      .from("revenue_opportunities")
      .select("opportunity_type, description, estimated_value, opportunity_score, priority, actioned_at, created_at")
      .eq("organization_id", organizationId)
      .eq("status", "open")
      .gte("opportunity_score", 70)
      .order("opportunity_score", { ascending: false })
      .limit(50),
    (supabase as any)
      .from("recall_tracking")
      .select("id, patient_external_id")
      .eq("organization_id", organizationId)
      .eq("status", "overdue"),
    (supabase as any)
      .from("revenue_forecasts")
      .select("forecast_value, confidence_score")
      .eq("organization_id", organizationId)
      .eq("horizon", "30d")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    (supabase as any)
      .from("revenue_forecasts")
      .select("forecast_value, confidence_score")
      .eq("organization_id", organizationId)
      .eq("horizon", "90d")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    (supabase as any)
      .from("growth_scores")
      .select("growth_score, trend, top_driver")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    (supabase as any)
      .from("workflow_recovery_metrics")
      .select("workflow_stability_score, active_incidents, automation_reliability_score")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    (supabase as any)
      .from("agent_recommendations")
      .select("recommendation_type, action_text, revenue_potential, confidence_score")
      .eq("organization_id", organizationId)
      .gte("created_at", sevenDaysAgo)
      .order("revenue_potential", { ascending: false })
      .limit(5),
  ]);

  const oppRows = (oppResult.data ?? []) as Array<{
    opportunity_type: string;
    description: string;
    estimated_value: number;
    opportunity_score: number;
    priority: string;
    actioned_at: string | null;
    created_at: string;
  }>;

  const recallRows = (recallResult.data ?? []) as Array<{ id: string; patient_external_id: string }>;
  const forecast30 = forecast30Result.data as { forecast_value: number; confidence_score: number } | null;
  const forecast90 = forecast90Result.data as { forecast_value: number; confidence_score: number } | null;
  const growthRow = growthResult.data as { growth_score: number; trend: string; top_driver: string } | null;
  const workflowRow = workflowResult.data as { workflow_stability_score: number; active_incidents: number; automation_reliability_score: number } | null;
  const recRows = (recsResult.data ?? []) as Array<{
    recommendation_type: string;
    action_text: string;
    revenue_potential: number;
    confidence_score: number;
  }>;

  // Build opportunities (top 5)
  const opportunities = oppRows.slice(0, 5).map((r) => ({
    type: r.opportunity_type ?? "revenue",
    description: r.description ?? "",
    estimatedValue: r.estimated_value ?? 0,
    priority: r.priority ?? (r.opportunity_score >= 85 ? "high" : "medium"),
  }));

  // Build risks
  const risks: ExecutiveBriefing["risks"] = [];
  if (recallRows.length > 0) {
    risks.push({
      type: "recall_risk",
      description: `${recallRows.length} overdue recall patient(s) need immediate follow-up.`,
      severity: recallRows.length > 20 ? "high" : "medium",
      affectedPatients: recallRows.length,
    });
  }
  const staleOpenOpps = oppRows.filter((r) => !r.actioned_at && r.created_at < fourteenDaysAgo);
  if (staleOpenOpps.length > 0) {
    const atRisk = staleOpenOpps.reduce((sum, r) => sum + (r.estimated_value ?? 0), 0);
    risks.push({
      type: "revenue_at_risk",
      description: `${staleOpenOpps.length} high-score opportunities unactioned for >14 days, putting $${atRisk.toLocaleString()} at risk.`,
      severity: atRisk > 10000 ? "high" : "medium",
    });
  }
  const whScore = workflowRow?.workflow_stability_score ?? 100;
  if (whScore < 70) {
    risks.push({
      type: "workflow_risk",
      description: `Workflow stability score is ${whScore}/100 — automation reliability is degraded.`,
      severity: whScore < 50 ? "high" : "medium",
    });
  }

  const revenueForecast = {
    next30d: forecast30?.forecast_value ?? 0,
    next90d: forecast90?.forecast_value ?? 0,
    confidence: forecast30?.confidence_score ?? 0,
  };

  const growthForecast = {
    growthScore: growthRow?.growth_score ?? 0,
    trend: growthRow?.trend ?? "stable",
    topDriver: growthRow?.top_driver ?? "unknown",
  };

  const workflowHealth = {
    score: workflowRow?.workflow_stability_score ?? 100,
    activeIncidents: workflowRow?.active_incidents ?? 0,
    reliabilityScore: workflowRow?.automation_reliability_score ?? 100,
  };

  const topRecommendations = recRows.map((r) => ({
    type: r.recommendation_type ?? "general",
    action: r.action_text ?? "",
    estimatedImpact: r.revenue_potential ?? 0,
    confidence: r.confidence_score ?? 0,
  }));

  // Priority actions from risks and top opportunities
  const priorityActions: string[] = [];
  if (recallRows.length > 0) priorityActions.push(`Contact ${recallRows.length} overdue recall patients this week.`);
  if (staleOpenOpps.length > 0) priorityActions.push(`Action ${staleOpenOpps.length} stale revenue opportunities before further revenue leakage.`);
  if (whScore < 70) priorityActions.push("Investigate and resolve active workflow incidents to restore automation reliability.");
  while (priorityActions.length < 3 && topRecommendations.length > priorityActions.length) {
    const rec = topRecommendations[priorityActions.length];
    if (rec) priorityActions.push(rec.action);
  }
  const finalPriorityActions = priorityActions.slice(0, 3);

  // Projected business impact
  const totalOppValue = oppRows.reduce((sum, r) => sum + (r.estimated_value ?? 0), 0);
  const subscriptionMrr = 997;
  const projectedBusinessImpact = {
    monthlyRevenueImpact: Math.round(totalOppValue / 12),
    annualRevenueImpact: Math.round(totalOppValue),
    roiMultiple: Math.round((totalOppValue / subscriptionMrr) * 10) / 10,
  };

  // Executive intelligence score
  const revenueConfidence = revenueForecast.confidence;
  const growthScore = growthForecast.growthScore;
  const rawScore = (workflowHealth.score + growthScore + revenueConfidence * 100) / 3;
  const executiveIntelligenceScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const briefingDate = new Date().toISOString();
  const briefing: ExecutiveBriefing = {
    organizationId,
    briefingDate,
    opportunities,
    risks,
    revenueForecast,
    growthForecast,
    workflowHealth,
    topRecommendations,
    priorityActions: finalPriorityActions,
    projectedBusinessImpact,
    executiveIntelligenceScore,
  };

  // Upsert into alice_executive_briefings
  await (supabase as any)
    .from("alice_executive_briefings")
    .upsert(
      {
        organization_id: organizationId,
        briefing_date: briefingDate,
        opportunities,
        risks,
        revenue_forecast: revenueForecast,
        growth_forecast: growthForecast,
        workflow_health: workflowHealth,
        top_recommendations: topRecommendations,
        priority_actions: finalPriorityActions,
        projected_business_impact: projectedBusinessImpact,
        executive_intelligence_score: executiveIntelligenceScore,
      },
      { onConflict: "organization_id" }
    );

  // Emit event (non-blocking)
  publishRuntimeFabricEvent({
    eventKey: "executive_brief_generated",
    eventType: "agent",
    sourceSystem: "alice_executive",
    targetChannel: "mission_control",
    priority: "moderate",
    summary: `Executive briefing generated for org ${organizationId} with score ${executiveIntelligenceScore}/100.`,
  }).catch(() => null);

  return briefing;
}

export async function getLatestExecutiveBriefing(organizationId: string): Promise<ExecutiveBriefing | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await (supabase as any)
    .from("alice_executive_briefings")
    .select("*")
    .eq("organization_id", organizationId)
    .order("briefing_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return generateExecutiveBriefing(organizationId);

  const ageMs = Date.now() - new Date(data.briefing_date as string).getTime();
  if (ageMs > 24 * 3600000) return generateExecutiveBriefing(organizationId);

  return {
    organizationId: data.organization_id as string,
    briefingDate: data.briefing_date as string,
    opportunities: (data.opportunities as ExecutiveBriefing["opportunities"]) ?? [],
    risks: (data.risks as ExecutiveBriefing["risks"]) ?? [],
    revenueForecast: (data.revenue_forecast as ExecutiveBriefing["revenueForecast"]) ?? { next30d: 0, next90d: 0, confidence: 0 },
    growthForecast: (data.growth_forecast as ExecutiveBriefing["growthForecast"]) ?? { growthScore: 0, trend: "stable", topDriver: "unknown" },
    workflowHealth: (data.workflow_health as ExecutiveBriefing["workflowHealth"]) ?? { score: 100, activeIncidents: 0, reliabilityScore: 100 },
    topRecommendations: (data.top_recommendations as ExecutiveBriefing["topRecommendations"]) ?? [],
    priorityActions: (data.priority_actions as string[]) ?? [],
    projectedBusinessImpact: (data.projected_business_impact as ExecutiveBriefing["projectedBusinessImpact"]) ?? { monthlyRevenueImpact: 0, annualRevenueImpact: 0, roiMultiple: 0 },
    executiveIntelligenceScore: (data.executive_intelligence_score as number) ?? 0,
  };
}

export async function detectRevenueRisk(
  organizationId: string
): Promise<Array<{ type: string; severity: string; description: string; estimatedLoss: number }>> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data } = await (supabase as any)
    .from("revenue_opportunities")
    .select("id, opportunity_type, estimated_value, opportunity_score, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "open")
    .gte("opportunity_score", 70)
    .lt("created_at", fourteenDaysAgo);

  const rows = (data ?? []) as Array<{
    id: string;
    opportunity_type: string;
    estimated_value: number;
    opportunity_score: number;
    created_at: string;
  }>;

  return rows.map((r) => ({
    type: "revenue_at_risk",
    severity: r.opportunity_score >= 85 ? "high" : "medium",
    description: `Open ${r.opportunity_type} opportunity (score ${r.opportunity_score}) unactioned for >14 days.`,
    estimatedLoss: r.estimated_value ?? 0,
  }));
}

export async function detectRecallRisk(
  organizationId: string
): Promise<{ count: number; estimatedRevenueLoss: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { count: 0, estimatedRevenueLoss: 0 };

  const { data } = await (supabase as any)
    .from("recall_tracking")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "overdue");

  const count = ((data ?? []) as Array<{ id: string }>).length;
  return { count, estimatedRevenueLoss: count * 300 };
}
