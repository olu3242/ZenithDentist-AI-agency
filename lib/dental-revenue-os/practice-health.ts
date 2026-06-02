import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getPortalData } from "@/lib/data/operations";
import { calculatePracticeHealth } from "@/lib/health";

/**
 * Extended Practice Health Score — 6 dimensions.
 *
 * Dimensions:
 *   1. noShows        — schedule protection (no-show/cancellation rate)
 *   2. recall         — recall booking conversion
 *   3. reviews        — review generation conversion
 *   4. engagement     — overall patient engagement rate
 *   5. efficiency     — admin hours saved via automation
 *   6. automationHealth — % of revenue engines active in the last 30 days (0-100)
 */
export interface PracticeHealthScore {
  score: number;
  components: {
    noShows: number;
    recall: number;
    reviews: number;
    engagement: number;
    efficiency: number;
    automationHealth: number;
  };
  computedAt: string;
}

export interface PracticeHealthSummary extends PracticeHealthScore {
  organizationId: string;
  trend: number;
  benchmarkPercentile: number;
  riskIndicators: string[];
  opportunities: string[];
}

const REVENUE_ENGINES = [
  "recall_recovery",
  "no_show_recovery",
  "review_growth",
  "treatment_followup",
  "chair_fill",
  "reactivation",
] as const;

/**
 * Compute automation health score (0-100):
 * Measures what % of the 6 revenue engines had activity in the past 30 days.
 */
async function computeAutomationHealth(organizationId: string): Promise<number> {
  const supabase = createServiceClient();
  if (!supabase) return 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("automation_events")
    .select("workflow")
    .eq("organization_id", organizationId)
    .gte("created_at", thirtyDaysAgo);

  if (!data || data.length === 0) return 0;

  const activeWorkflows = new Set(data.map((row) => row.workflow as string));
  const activeEngineCount = REVENUE_ENGINES.filter((engine) =>
    activeWorkflows.has(engine)
  ).length;

  return Math.round((activeEngineCount / REVENUE_ENGINES.length) * 100);
}

export async function computePracticeHealthScore(
  organizationId: string
): Promise<PracticeHealthScore> {
  const supabase = createServiceClient();
  let metrics = null;
  let automationEvents: Array<{ status: string }> = [];

  if (supabase) {
    const [metricsRes, eventsRes] = await Promise.all([
      supabase
        .from("operational_metrics")
        .select("*")
        .eq("organization_id", organizationId)
        .order("metric_date", { ascending: false })
        .limit(90),
      supabase
        .from("automation_events")
        .select("status")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    metrics = metricsRes.data;
    automationEvents = (eventsRes.data ?? []) as Array<{ status: string }>;
  } else {
    const portalData = await getPortalData();
    metrics = portalData.metrics;
    automationEvents = portalData.automationEvents;
  }

  const baseHealth = calculatePracticeHealth(
    metrics ?? [],
    automationEvents as Parameters<typeof calculatePracticeHealth>[1],
    undefined
  );

  const automationHealth = await computeAutomationHealth(organizationId);

  const components = {
    noShows: baseHealth.components.noShows,
    recall: baseHealth.components.recall,
    reviews: baseHealth.components.reviews,
    engagement: baseHealth.components.engagement,
    efficiency: baseHealth.components.efficiency,
    automationHealth,
  };

  // Equal weight across all 6 dimensions
  const score = Math.round(
    Object.values(components).reduce((sum, v) => sum + v, 0) / 6
  );

  return {
    score,
    components,
    computedAt: new Date().toISOString(),
  };
}

export async function getPracticeHealthSummary(
  organizationId: string
): Promise<PracticeHealthSummary> {
  const supabase = createServiceClient();
  let metrics = null;
  let automationEvents: Array<{ status: string }> = [];

  if (supabase) {
    const [metricsRes, eventsRes] = await Promise.all([
      supabase
        .from("operational_metrics")
        .select("*")
        .eq("organization_id", organizationId)
        .order("metric_date", { ascending: false })
        .limit(90),
      supabase
        .from("automation_events")
        .select("status")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    metrics = metricsRes.data;
    automationEvents = (eventsRes.data ?? []) as Array<{ status: string }>;
  } else {
    const portalData = await getPortalData();
    metrics = portalData.metrics;
    automationEvents = portalData.automationEvents;
  }

  const baseHealth = calculatePracticeHealth(
    metrics ?? [],
    automationEvents as Parameters<typeof calculatePracticeHealth>[1],
    undefined
  );

  const automationHealth = await computeAutomationHealth(organizationId);

  const components = {
    noShows: baseHealth.components.noShows,
    recall: baseHealth.components.recall,
    reviews: baseHealth.components.reviews,
    engagement: baseHealth.components.engagement,
    efficiency: baseHealth.components.efficiency,
    automationHealth,
  };

  const score = Math.round(
    Object.values(components).reduce((sum, v) => sum + v, 0) / 6
  );

  return {
    organizationId,
    score,
    components,
    computedAt: new Date().toISOString(),
    trend: baseHealth.trend,
    benchmarkPercentile: baseHealth.benchmarkPercentile,
    riskIndicators: [
      ...baseHealth.riskIndicators,
      ...(automationHealth < 50
        ? ["Fewer than half of revenue engines have been active in the last 30 days"]
        : []),
    ],
    opportunities: [
      ...baseHealth.opportunities,
      ...(automationHealth < 100
        ? [`Activate ${Math.round((1 - automationHealth / 100) * 6)} additional revenue engines to maximize automation coverage`]
        : []),
    ],
  };
}
