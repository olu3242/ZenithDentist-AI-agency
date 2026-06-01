import "server-only";

import { randomUUID } from "crypto";
import { automationRegistry } from "@/lib/automation/registry";
import { getTenantData } from "@/lib/data/tenants";
import type { AutomationRegistryStatus, Database, Json } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { completeRuntimeTrace, failRuntimeTrace, startRuntimeTrace } from "@/lib/runtime/instrumentation";
import { createServiceClient } from "@/lib/supabase/server";
import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";

export type AutomationRegistryRecord = Database["public"]["Tables"]["automation_registry"]["Row"];

export const dentalAutomationLibrary = [
  { workflowId: "recall_due", category: "Patient Recall", pack: "Recall Automation" },
  { workflowId: "review_request_due", category: "Review Generation", pack: "Review Automation" },
  { workflowId: "appointment_no_show", category: "Missed Appointment Recovery", pack: "Missed Appointment Automation" },
  { workflowId: "reactivation_candidate_detected", category: "Reactivate Dormant Patients", pack: "Patient Reactivation" },
  { workflowId: "stale_patient_detected", category: "Treatment Plan Follow-Up", pack: "Treatment Follow-Up" },
  { workflowId: "lead_created", category: "Lead Follow-Up", pack: "Lead Follow-Up" },
  { workflowId: "missed_call_detected", category: "Staff Notifications", pack: "Staff Notifications" },
  { workflowId: "unpaid_invoice_detected", category: "Insurance Verification", pack: "Insurance Follow-Up" },
  { workflowId: "failed_payment_detected", category: "Internal Operations", pack: "Membership Plan Nurture" },
  { workflowId: "ai_followup_required", category: "Internal Operations", pack: "Post Treatment Check-In" }
] as const;

export interface AutomationPerformance {
  workflowId: string;
  executionCount: number;
  successRate: number;
  failureRate: number;
  averageDurationMs: number;
  lastRunAt: string | null;
  recoveryStatus: "healthy" | "needs_recovery" | "not_run";
}

export interface AutomationOSState {
  organizationId: string;
  registry: AutomationRegistryRecord[];
  performance: AutomationPerformance[];
  categories: string[];
  counts: {
    active: number;
    paused: number;
    failed: number;
    available: number;
    totalExecutions: number;
  };
  configured: boolean;
}

export async function getAutomationOSState(): Promise<AutomationOSState> {
  const tenantData = await getTenantData();
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const supabase = createServiceClient();
  if (!supabase) return emptyAutomationOSState(organizationId, false);

  await syncAutomationRegistry(organizationId);

  const [registry, traces] = await Promise.all([
    supabase
      .from("automation_registry")
      .select("*")
      .eq("organization_id", organizationId)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("automation_traces")
      .select("*")
      .eq("organization_id", organizationId)
      .order("started_at", { ascending: false })
      .limit(500)
  ]);

  const rows = registry.data ?? [];
  const traceRows = traces.data ?? [];
  const performance = rows.map(row => {
    const workflowTraces = traceRows.filter(trace => trace.workflow_id === row.workflow_id);
    const completed = workflowTraces.filter(trace => trace.status === "completed").length;
    const failed = workflowTraces.filter(trace => trace.status === "failed").length;
    const total = workflowTraces.length;
    const durationValues = workflowTraces
      .map(trace => trace.latency_ms)
      .filter((value): value is number => typeof value === "number");
    const averageDurationMs = durationValues.length
      ? Math.round(durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length)
      : 0;

    return {
      workflowId: row.workflow_id,
      executionCount: total,
      successRate: total ? Math.round((completed / total) * 100) : 0,
      failureRate: total ? Math.round((failed / total) * 100) : 0,
      averageDurationMs,
      lastRunAt: workflowTraces[0]?.started_at ?? null,
      recoveryStatus: total ? (failed > 0 ? "needs_recovery" : "healthy") : "not_run"
    } satisfies AutomationPerformance;
  });

  return {
    organizationId,
    registry: rows,
    performance,
    categories: [...new Set(rows.map(row => row.category))],
    counts: {
      active: rows.filter(row => row.status === "active").length,
      paused: rows.filter(row => row.status === "paused").length,
      failed: rows.filter(row => row.status === "failed").length,
      available: rows.filter(row => row.status === "available").length,
      totalExecutions: performance.reduce((sum, item) => sum + item.executionCount, 0)
    },
    configured: true
  };
}

export async function syncAutomationRegistry(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return;

  const rows = automationRegistry.map(blueprint => {
    const library = dentalAutomationLibrary.find(item => item.workflowId === blueprint.id);
    return {
      organization_id: organizationId,
      name: library?.pack ?? blueprint.name,
      category: library?.category ?? blueprint.domain,
      description: blueprint.description,
      trigger: blueprint.triggers[0] ?? blueprint.id,
      workflow_id: blueprint.id,
      runtime_id: `runtime:${blueprint.id}`,
      owner: "Zenith Automation OS",
      status: "available" as AutomationRegistryStatus,
      version: "1.0.0",
      configuration: {
        triggers: blueprint.triggers,
        emittedEvents: blueprint.emittedEvents,
        replayRequired: blueprint.replayRequired,
        retryEnabled: blueprint.retryEnabled,
        slaMinutes: blueprint.slaMinutes,
        aliceGroundingSurfaces: blueprint.aliceGroundingSurfaces
      } as Json
    };
  });

  const { error } = await supabase
    .from("automation_registry")
    .upsert(rows, { onConflict: "organization_id,workflow_id", ignoreDuplicates: true });
  if (error) logger.warn("automation_registry_sync_failed", { organizationId, error: error.message });
}

export async function updateAutomationStatus(workflowId: string, status: AutomationRegistryStatus) {
  const tenantData = await getTenantData();
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Automation Registry requires Supabase service configuration.");

  await syncAutomationRegistry(organizationId);
  const { error } = await supabase
    .from("automation_registry")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("workflow_id", workflowId);
  if (error) throw new Error(`Unable to update automation status: ${error.message}`);
}

export async function executeRegisteredAutomation(workflowId: string) {
  const tenantData = await getTenantData();
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const correlationId = randomUUID();
  const trace = await startRuntimeTrace({
    workflowId,
    eventName: "automation_center_execute",
    organizationId,
    correlationId,
    metadata: { source: "automation_center" }
  });

  try {
    const result = await executeWorkflow({
      workflowId,
      organizationId,
      triggerName: "automation_center_manual_execute",
      actionName: "execute_registered_automation",
      correlationId,
      initiatedBy: "operator",
      payload: { source: "automation_center" }
    });
    await completeRuntimeTrace(trace);
    await updateAutomationStatus(workflowId, "active");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation execution failed";
    await failRuntimeTrace(trace, message, { workflowId, organizationId, correlationId });
    await updateAutomationStatus(workflowId, "failed");
    throw error;
  }
}

function emptyAutomationOSState(organizationId: string, configured: boolean): AutomationOSState {
  return {
    organizationId,
    registry: [],
    performance: [],
    categories: [],
    counts: {
      active: 0,
      paused: 0,
      failed: 0,
      available: 0,
      totalExecutions: 0
    },
    configured
  };
}
