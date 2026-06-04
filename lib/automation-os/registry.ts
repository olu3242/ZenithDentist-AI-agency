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
  { workflowId: "referral_growth", category: "Referral Growth", pack: "Referral Growth Automation" },
  { workflowId: "appointment_no_show", category: "Missed Appointment Recovery", pack: "Missed Appointment Automation" },
  { workflowId: "reactivation_candidate_detected", category: "Reactivate Dormant Patients", pack: "Patient Reactivation" },
  { workflowId: "treatment_recovery", category: "Treatment Recovery", pack: "Treatment Recovery Automation" },
  { workflowId: "stale_patient_detected", category: "Treatment Plan Follow-Up", pack: "Treatment Follow-Up" },
  { workflowId: "schedule_gap_fill", category: "Schedule Optimization", pack: "Schedule Gap Fill Automation" },
  { workflowId: "recall_capacity_optimization", category: "Capacity Balancing", pack: "Recall Capacity Optimization" },
  { workflowId: "lead_created", category: "Lead Follow-Up", pack: "Lead Follow-Up" },
  { workflowId: "missed_call_detected", category: "Staff Notifications", pack: "Staff Notifications" },
  { workflowId: "unpaid_invoice_detected", category: "Insurance Verification", pack: "Insurance Follow-Up" },
  { workflowId: "failed_payment_detected", category: "Internal Operations", pack: "Membership Plan Nurture" },
  { workflowId: "ai_followup_required", category: "Internal Operations", pack: "Post Treatment Check-In" },
  { workflowId: "alice_revenue_opportunity_agent", category: "AI", pack: "Revenue Opportunity Agent" },
  { workflowId: "alice_practice_health_agent", category: "AI", pack: "Practice Health Agent" },
  { workflowId: "alice_growth_agent", category: "AI", pack: "Growth Agent" },
  { workflowId: "welcome_patient", category: "Patient Influence", pack: "New Patient Video Journey" },
  { workflowId: "cleaning_journey", category: "Patient Influence", pack: "Cleaning Video Journey" },
  { workflowId: "treatment_acceptance_journey", category: "Patient Influence", pack: "Treatment Acceptance Video Journey" },
  { workflowId: "membership_enrollment_journey", category: "Patient Influence", pack: "Membership Enrollment Video Journey" },
  { workflowId: "review_request_video", category: "Patient Influence", pack: "Review Request Video Journey" },
  { workflowId: "referral_request_video", category: "Patient Influence", pack: "Referral Request Video Journey" },
  { workflowId: "patient_30_day_checkin", category: "Patient Influence", pack: "Patient 30 Day Video Check-In" },
  { workflowId: "financing_journey", category: "Patient Influence", pack: "Financing Video Journey" },
  { workflowId: "video_confirmation", category: "Patient Influence", pack: "Confirmation Video Journey" },
  { workflowId: "video_reminder", category: "Patient Influence", pack: "Reminder Video Journey" },
  { workflowId: "video_recall", category: "Patient Influence", pack: "Recall Video Journey" },
  { workflowId: "video_reactivation", category: "Patient Influence", pack: "Reactivation Video Journey" },
  { workflowId: "video_no_show_recovery", category: "Patient Influence", pack: "No Show Recovery Video Journey" },
  { workflowId: "video_post_visit", category: "Patient Influence", pack: "Post Visit Recovery Video Journey" },
  { workflowId: "video_review_request", category: "Patient Influence", pack: "Review Growth Video Journey" },
  { workflowId: "video_referral_request", category: "Patient Influence", pack: "Referral Growth Video Journey" },
  { workflowId: "video_membership", category: "Patient Influence", pack: "Membership Enrollment Video Journey" },
  { workflowId: "video_treatment_acceptance", category: "Patient Influence", pack: "Treatment Acceptance Video Journey" },
  { workflowId: "video_vip_loyalty", category: "Patient Influence", pack: "VIP Loyalty Video Journey" }
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
  const startedAt = new Date();
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
    await recordWorkflowExecutionEvidence({
      workflowId,
      organizationId,
      executionId: result.executionId,
      startedAt,
      status: "completed",
      triggerSource: "automation_center_manual_execute",
      outcomeSummary: `Workflow ${workflowId} executed through Automation Platform with correlation ${result.correlationId}.`,
      traceId: trace?.trace_id ?? null
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation execution failed";
    await failRuntimeTrace(trace, message, { workflowId, organizationId, correlationId });
    await updateAutomationStatus(workflowId, "failed");
    await recordWorkflowExecutionEvidence({
      workflowId,
      organizationId,
      startedAt,
      status: "failed",
      triggerSource: "automation_center_manual_execute",
      outcomeSummary: message,
      traceId: trace?.trace_id ?? null
    });
    throw error;
  }
}

async function recordWorkflowExecutionEvidence(input: {
  workflowId: string;
  organizationId: string;
  executionId?: string;
  startedAt: Date;
  status: "completed" | "failed";
  triggerSource: string;
  outcomeSummary: string;
  traceId?: string | null;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;
  const completedAt = new Date();
  const payload = {
    workflow_id: input.workflowId,
    organization_id: input.organizationId,
    execution_id: input.executionId ?? null,
    started_at: input.startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    status: input.status,
    duration_ms: completedAt.getTime() - input.startedAt.getTime(),
    trigger_source: input.triggerSource,
    affected_entities: [],
    outcome_summary: input.outcomeSummary,
    trace_id: input.traceId ?? null
  };
  const { error } = await (supabase as any).from("workflow_execution_evidence").insert(payload);
  if (error) logger.warn("workflow_execution_evidence_write_failed", { workflowId: input.workflowId, error: error.message });
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
