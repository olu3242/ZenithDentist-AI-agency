import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type SystemStatus = "healthy" | "degraded" | "critical" | "unknown";

export interface ComponentHealth {
  name: string;
  status: SystemStatus;
  latencyMs: number | null;
  successRate: number | null;
  lastCheckedAt: string;
  detail: string;
}

export interface OperationalHealthDashboard {
  organizationId: string;
  overallStatus: SystemStatus;
  components: ComponentHealth[];
  workflowHealth: {
    totalRuns: number;
    successRate: number;
    avgLatencyMs: number;
    deadLetterCount: number;
  };
  runtimeHealth: {
    openIncidents: number;
    criticalIncidents: number;
    providerDegradations: number;
  };
  billingHealth: {
    stripeConnected: boolean;
    failedEvents: number;
  };
  generatedAt: string;
}

/**
 * getOperationalHealthDashboard — aggregates health state across all platform subsystems.
 */
export async function getOperationalHealthDashboard(organizationId: string): Promise<OperationalHealthDashboard> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (!supabase) {
    return emptyDashboard(organizationId, now);
  }

  const [tracesResult, deadLettersResult, incidentsResult, providerResult, billingResult] = await Promise.all([
    supabase
      .from("automation_traces")
      .select("status, latency_ms")
      .eq("organization_id", organizationId)
      .gte("created_at", windowStart)
      .limit(500),
    supabase
      .from("automation_dead_letters")
      .select("id")
      .gte("created_at", windowStart)
      .limit(100),
    supabase
      .from("operational_incidents")
      .select("severity, status")
      .eq("organization_id", organizationId)
      .in("status", ["open", "mitigating"]),
    (supabase as any)
      .from("provider_health_snapshots")
      .select("status")
      .eq("organization_id", organizationId)
      .order("observed_at", { ascending: false })
      .limit(20),
    (supabase as any)
      .from("billing_events")
      .select("status")
      .eq("organization_id", organizationId)
      .eq("status", "failed")
      .gte("received_at", windowStart)
      .limit(10),
  ]);

  const traces = tracesResult.data ?? [];
  const deadLetters = deadLettersResult.data ?? [];
  const incidents = incidentsResult.data ?? [];
  const providers = providerResult.data ?? [];
  const failedBilling = billingResult.data ?? [];

  // Workflow health
  const totalRuns = traces.length;
  const successCount = traces.filter(t => t.status === "completed").length;
  const successRate = totalRuns > 0 ? successCount / totalRuns : 1;
  const latencies = traces.map(t => t.latency_ms).filter((l): l is number => l !== null);
  const avgLatencyMs = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  // Runtime health
  const openIncidents = incidents.length;
  const criticalIncidents = incidents.filter(i => i.severity === "critical").length;
  const providerDegradations = providers.filter((p: { status: string }) => p.status !== "healthy").length;

  // Component statuses
  const components: ComponentHealth[] = [
    {
      name: "Workflow Engine",
      status: workflowStatus(successRate, deadLetters.length),
      latencyMs: Math.round(avgLatencyMs),
      successRate: Math.round(successRate * 1000) / 10,
      lastCheckedAt: now,
      detail: `${totalRuns} runs, ${deadLetters.length} dead letters (24h)`,
    },
    {
      name: "Runtime",
      status: runtimeStatus(criticalIncidents, openIncidents),
      latencyMs: null,
      successRate: null,
      lastCheckedAt: now,
      detail: `${openIncidents} open incident(s), ${criticalIncidents} critical`,
    },
    {
      name: "Integrations",
      status: providerDegradations > 0 ? "degraded" : "healthy",
      latencyMs: null,
      successRate: null,
      lastCheckedAt: now,
      detail: `${providerDegradations} provider(s) degraded`,
    },
    {
      name: "Billing",
      status: failedBilling.length > 0 ? "degraded" : "healthy",
      latencyMs: null,
      successRate: null,
      lastCheckedAt: now,
      detail: failedBilling.length > 0 ? `${failedBilling.length} failed billing event(s)` : "All billing events processed",
    },
  ];

  const overallStatus = deriveOverallStatus(components);

  logger.info("health_dashboard_generated", { organizationId, overallStatus, openIncidents });

  return {
    organizationId,
    overallStatus,
    components,
    workflowHealth: { totalRuns, successRate: Math.round(successRate * 1000) / 10, avgLatencyMs: Math.round(avgLatencyMs), deadLetterCount: deadLetters.length },
    runtimeHealth: { openIncidents, criticalIncidents, providerDegradations },
    billingHealth: { stripeConnected: Boolean(process.env.STRIPE_API_KEY), failedEvents: failedBilling.length },
    generatedAt: now,
  };
}

function workflowStatus(successRate: number, deadLetterCount: number): SystemStatus {
  if (deadLetterCount >= 10 || successRate < 0.8) return "critical";
  if (deadLetterCount >= 3 || successRate < 0.95) return "degraded";
  return "healthy";
}

function runtimeStatus(criticalIncidents: number, openIncidents: number): SystemStatus {
  if (criticalIncidents > 0) return "critical";
  if (openIncidents > 0) return "degraded";
  return "healthy";
}

function deriveOverallStatus(components: ComponentHealth[]): SystemStatus {
  if (components.some(c => c.status === "critical")) return "critical";
  if (components.some(c => c.status === "degraded")) return "degraded";
  if (components.some(c => c.status === "unknown")) return "unknown";
  return "healthy";
}

function emptyDashboard(organizationId: string, now: string): OperationalHealthDashboard {
  return {
    organizationId,
    overallStatus: "unknown",
    components: [],
    workflowHealth: { totalRuns: 0, successRate: 100, avgLatencyMs: 0, deadLetterCount: 0 },
    runtimeHealth: { openIncidents: 0, criticalIncidents: 0, providerDegradations: 0 },
    billingHealth: { stripeConnected: false, failedEvents: 0 },
    generatedAt: now,
  };
}
