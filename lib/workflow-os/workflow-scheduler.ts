import "server-only";

/**
 * Workflow Scheduler — top-level scheduling facade for Workflow OS.
 *
 * Handles: cron-style trigger resolution, SLA-aware dispatch, and
 * AI-recommended scheduling adjustments from ALICE.
 *
 * This is distinct from execution/execution-scheduler.ts which handles
 * per-execution timing within the Execution Fabric.
 */

import { routeWorkflow } from "@/lib/workflow-os/workflow-router";
import { getAllWorkflows } from "@/lib/workflow-os/workflow-registry";
import { publishWorkflowEvent } from "@/lib/workflow-os/workflow-engine";
import type { WorkflowTrigger } from "@/lib/workflow-os/workflow-router";

export type ScheduleTriggerType = "immediate" | "periodic" | "event_driven" | "ai_recommended";

export interface ScheduledWorkflowRun {
  scheduleId: string;
  workflowId: string;
  trigger: WorkflowTrigger;
  triggerType: ScheduleTriggerType;
  organizationId: string;
  scheduledFor: string;
  rationale?: string;
}

export interface SchedulerDispatchResult {
  scheduleId: string;
  workflowId: string;
  correlationId: string;
  state: string;
  dispatchedAt: string;
}

/**
 * Dispatch a scheduled workflow run through the Workflow OS router.
 * Every trigger goes through routeWorkflow → executeWorkflow — no bypasses.
 */
export async function dispatchScheduledRun(
  run: ScheduledWorkflowRun
): Promise<SchedulerDispatchResult> {
  const result = await routeWorkflow({
    trigger: run.trigger,
    organizationId: run.organizationId,
    initiatedBy: run.triggerType === "ai_recommended" ? "alice" : "scheduler",
    payload: {
      scheduleId: run.scheduleId,
      scheduledFor: run.scheduledFor,
      rationale: run.rationale,
    },
  });

  await publishWorkflowEvent({
    eventType: "workflow.scheduled.dispatched",
    workflowId: run.workflowId,
    organizationId: run.organizationId,
    correlationId: result.correlationId,
    payload: {
      scheduleId: run.scheduleId,
      triggerType: run.triggerType,
      scheduledFor: run.scheduledFor,
    },
  });

  return {
    scheduleId: run.scheduleId,
    workflowId: run.workflowId,
    correlationId: result.correlationId,
    state: result.state,
    dispatchedAt: new Date().toISOString(),
  };
}

/**
 * Returns the default periodic schedule for all registered workflows.
 * In production this feeds a cron/queue system; here it exposes the plan.
 */
export function getDefaultSchedulePlan(): Array<{
  workflowId: string;
  domain: string;
  suggestedCron: string;
  rationale: string;
}> {
  return getAllWorkflows().map(wf => ({
    workflowId: wf.id,
    domain: wf.domain,
    suggestedCron: cronForDomain(wf.domain),
    rationale: `SLA: ${wf.slaMinutes}min. Domain: ${wf.domain}.`,
  }));
}

function cronForDomain(domain: string): string {
  switch (domain) {
    case "recall":           return "0 8 * * *";   // daily 8am
    case "scheduling":       return "*/15 * * * *"; // every 15 min
    case "front_office":     return "*/5 * * * *";  // every 5 min
    case "billing":          return "0 9 * * 1-5";  // weekdays 9am
    case "reputation":       return "0 10 * * *";   // daily 10am
    case "patient_followup": return "0 9 * * *";    // daily 9am
    case "lead_operations":  return "*/10 * * * *"; // every 10 min
    case "mission_control":  return "0 7 * * *";    // daily 7am
    default:                 return "0 * * * *";    // hourly
  }
}
