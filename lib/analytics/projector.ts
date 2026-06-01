import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getTenantData } from "@/lib/data/tenants";
import { logger } from "@/lib/logger";

export interface AnalyticsProjection {
  organizationId: string;
  period: string;
  eventFabric: {
    totalEvents: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    deliveredCount: number;
    deliveryRate: number;
  };
  workflowMetrics: {
    totalTraces: number;
    successRate: number;
    avgLatencyMs: number;
    deadLetterCount: number;
    slaBreachCount: number;
    topWorkflows: Array<{ workflowId: string; executions: number; successRate: number }>;
  };
  businessMetrics: {
    remindersProcessed: number;
    recallsProcessed: number;
    reviewsGenerated: number;
    aiInsightsConsumed: number;
  };
  projectedAt: string;
}

/**
 * analyticsProjector — projects Event Fabric + automation_traces into a unified analytics snapshot.
 * This is the canonical analytics path: Event Fabric → traces → projections.
 */
export async function analyticsProjector(organizationId?: string): Promise<AnalyticsProjection> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const period = now.slice(0, 7); // YYYY-MM

  if (!organizationId) {
    const tenant = await getTenantData();
    organizationId = tenant.tenant.organizationId || tenant.organization.id;
  }

  if (!supabase || !organizationId) {
    return emptyProjection(organizationId ?? "", period, now);
  }

  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [fabricEvents, traces, deadLetters, usageMetrics] = await Promise.all([
    supabase
      .from("runtime_event_fabric_events")
      .select("event_type, source_system, status")
      .eq("organization_id", organizationId)
      .gte("published_at", windowStart)
      .limit(1000),
    supabase
      .from("automation_traces")
      .select("workflow_id, status, latency_ms")
      .eq("organization_id", organizationId)
      .gte("started_at", windowStart)
      .limit(500),
    (supabase as any)
      .from("automation_dead_letters")
      .select("id")
      .eq("organization_id", organizationId)
      .gte("created_at", windowStart)
      .limit(100),
    supabase
      .from("usage_metrics")
      .select("reminders_sent, recalls_processed, reviews_generated, ai_insights_consumed")
      .eq("organization_id", organizationId)
      .eq("metric_month", period)
      .maybeSingle(),
  ]);

  const events = fabricEvents.data ?? [];
  const traceData = traces.data ?? [];
  const deadLetterCount = (deadLetters.data ?? []).length;
  const usage = usageMetrics.data;

  // Event Fabric projections
  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let deliveredCount = 0;
  for (const e of events) {
    byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
    bySource[e.source_system] = (bySource[e.source_system] ?? 0) + 1;
    if (e.status === "delivered") deliveredCount++;
  }

  // Workflow metrics projections
  const totalTraces = traceData.length;
  const succeededTraces = traceData.filter(t => t.status === "completed").length;
  const successRate = totalTraces > 0 ? Math.round((succeededTraces / totalTraces) * 100) : 0;
  const latencies = traceData.map(t => t.latency_ms).filter((l): l is number => l !== null);
  const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  // Top workflows by execution count
  const workflowCounts: Record<string, { total: number; succeeded: number }> = {};
  for (const t of traceData) {
    const key = t.workflow_id;
    if (!workflowCounts[key]) workflowCounts[key] = { total: 0, succeeded: 0 };
    workflowCounts[key].total++;
    if (t.status === "completed") workflowCounts[key].succeeded++;
  }
  const topWorkflows = Object.entries(workflowCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([workflowId, counts]) => ({
      workflowId,
      executions: counts.total,
      successRate: counts.total > 0 ? Math.round((counts.succeeded / counts.total) * 100) : 0,
    }));

  logger.info("analytics_projection_computed", { organizationId, totalEvents: events.length, totalTraces });

  return {
    organizationId,
    period,
    eventFabric: {
      totalEvents: events.length,
      byType,
      bySource,
      deliveredCount,
      deliveryRate: events.length > 0 ? Math.round((deliveredCount / events.length) * 100) : 0,
    },
    workflowMetrics: {
      totalTraces,
      successRate,
      avgLatencyMs,
      deadLetterCount,
      slaBreachCount: 0,
      topWorkflows,
    },
    businessMetrics: {
      remindersProcessed: usage?.reminders_sent ?? 0,
      recallsProcessed: usage?.recalls_processed ?? 0,
      reviewsGenerated: usage?.reviews_generated ?? 0,
      aiInsightsConsumed: usage?.ai_insights_consumed ?? 0,
    },
    projectedAt: now,
  };
}

function emptyProjection(organizationId: string, period: string, now: string): AnalyticsProjection {
  return {
    organizationId,
    period,
    eventFabric: { totalEvents: 0, byType: {}, bySource: {}, deliveredCount: 0, deliveryRate: 0 },
    workflowMetrics: { totalTraces: 0, successRate: 0, avgLatencyMs: 0, deadLetterCount: 0, slaBreachCount: 0, topWorkflows: [] },
    businessMetrics: { remindersProcessed: 0, recallsProcessed: 0, reviewsGenerated: 0, aiInsightsConsumed: 0 },
    projectedAt: now,
  };
}
