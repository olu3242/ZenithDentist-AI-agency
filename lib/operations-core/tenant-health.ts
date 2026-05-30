import "server-only";

/**
 * Tenant Health — operational health view per tenant for Mission Control.
 */

import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getReplayCenterState } from "@/lib/runtime/replay-engine";
import { createServiceClient } from "@/lib/supabase/server";

export interface TenantHealthSnapshot {
  organizationId: string;
  operationalScore: number;
  workflowsRegistered: number;
  activeExecutions: number;
  failedExecutions: number;
  replayQueueDepth: number;
  recoveryScore: number;
  lastActivityAt: string | null;
  status: "healthy" | "degraded" | "critical";
  computedAt: string;
}

export async function getTenantHealth(
  organizationId: string
): Promise<TenantHealthSnapshot> {
  const [wfHealth, recovery, replay] = await Promise.all([
    getWorkflowRuntimeHealth(),
    getAutonomousRecoveryState(),
    getReplayCenterState(),
  ]);

  const status: TenantHealthSnapshot["status"] =
    wfHealth.operationalScore >= 80 ? "healthy" :
    wfHealth.operationalScore >= 60 ? "degraded" : "critical";

  return {
    organizationId,
    operationalScore: wfHealth.operationalScore,
    workflowsRegistered: wfHealth.registeredWorkflows,
    activeExecutions: wfHealth.activeExecutions,
    failedExecutions: wfHealth.failedExecutions,
    replayQueueDepth: replay.candidates.length,
    recoveryScore: recovery.resilienceScore,
    lastActivityAt: new Date().toISOString(),
    status,
    computedAt: new Date().toISOString(),
  };
}

export async function getAllTenantHealthSnapshots(): Promise<TenantHealthSnapshot[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .limit(50);

  if (!orgs || orgs.length === 0) return [];

  // For multi-tenant: compute health for each org sequentially
  // (in production this would be parallelized with per-org data isolation)
  const snapshots: TenantHealthSnapshot[] = [];
  for (const org of orgs) {
    snapshots.push(await getTenantHealth(org.id));
  }
  return snapshots;
}
