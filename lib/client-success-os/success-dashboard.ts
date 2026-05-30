import "server-only";

/**
 * Client Success OS — Success Dashboard
 *
 * Aggregates all success metrics for the customer portal.
 * Sources: ROI Engine, Workflow Analytics, Workflow Runtime Health.
 */

import { computeTenantRoi } from "@/lib/roi-os/roi-engine";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { createServiceClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SuccessDashboardData {
  recoveredRevenue: number;
  recoveredPatients: number;
  reviewGrowth: number;
  recallRecoveryRate: number;
  workflowHealth: "healthy" | "degraded" | "critical";
  automationStatus: Array<{
    workflowId: string;
    status: string;
    lastRun: string | null;
  }>;
  openTickets: number;
  closedTickets: number;
}

// ─── Ticket Counts (graceful fallback) ────────────────────────────────────────

async function queryTicketCounts(
  organizationId: string
): Promise<{ openTickets: number; closedTickets: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { openTickets: 0, closedTickets: 0 };

  try {
    const [openResult, closedResult] = await Promise.all([
      supabase
        .from("support_tickets" as never)
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "open"),
      supabase
        .from("support_tickets" as never)
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "closed"),
    ]);

    return {
      openTickets: openResult.count ?? 0,
      closedTickets: closedResult.count ?? 0,
    };
  } catch {
    return { openTickets: 0, closedTickets: 0 };
  }
}

// ─── Workflow Health Classification ──────────────────────────────────────────

function classifyWorkflowHealth(
  operationalScore: number
): "healthy" | "degraded" | "critical" {
  if (operationalScore >= 75) return "healthy";
  if (operationalScore >= 50) return "degraded";
  return "critical";
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function getSuccessDashboardData(
  organizationId: string
): Promise<SuccessDashboardData> {
  const [roi, analytics, runtimeHealth, tickets] = await Promise.all([
    computeTenantRoi(organizationId),
    getWorkflowAnalyticsSummary(),
    getWorkflowRuntimeHealth(),
    queryTicketCounts(organizationId),
  ]);

  const kpiMap = Object.fromEntries(analytics.workflowKpis.map(k => [k.workflowId, k]));
  const recallKpi = kpiMap["recall_due"];

  const automationStatus = runtimeHealth.workflowStates.map(ws => ({
    workflowId: ws.workflowId,
    status: ws.healthy ? "healthy" : "unhealthy",
    lastRun: ws.lastExecutionMs != null
      ? new Date(Date.now() - ws.lastExecutionMs).toISOString()
      : null,
  }));

  return {
    recoveredRevenue: roi.revenueRecovered,
    recoveredPatients: roi.patientReactivations + roi.appointmentsRecovered,
    reviewGrowth: roi.reviewsGenerated,
    recallRecoveryRate: recallKpi?.successRate ?? 0,
    workflowHealth: classifyWorkflowHealth(runtimeHealth.operationalScore),
    automationStatus,
    openTickets: tickets.openTickets,
    closedTickets: tickets.closedTickets,
  };
}
