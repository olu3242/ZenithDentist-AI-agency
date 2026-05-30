import "server-only";

/**
 * Workflow Registry — canonical source of all workflow definitions.
 * Wraps the automation blueprint registry and adds Workflow OS metadata.
 */

import { automationRegistry, getAutomationBlueprint } from "@/lib/automation/registry";
import type { AutomationBlueprint } from "@/types/automation";

export type WorkflowStatus = "active" | "disabled" | "deprecated";

export interface WorkflowDefinition {
  id: string;
  name: string;
  domain: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  blueprint: AutomationBlueprint;
  /** SLA in minutes for execution completion */
  slaMinutes: number;
  /** Whether this workflow supports replay */
  replayable: boolean;
  /** Whether this workflow participates in AI intervention */
  aiInterventionEnabled: boolean;
  tags: string[];
}

function blueprintToWorkflow(bp: AutomationBlueprint): WorkflowDefinition {
  return {
    id: bp.id,
    name: bp.name,
    domain: bp.domain,
    description: bp.description,
    version: "1.0.0",
    status: "active",
    blueprint: bp,
    slaMinutes: bp.slaMinutes ?? 60,
    replayable: bp.replayRequired,
    aiInterventionEnabled: true,
    tags: [bp.domain, "dental", "automation"]
  };
}

export function getAllWorkflows(): WorkflowDefinition[] {
  return automationRegistry.map(blueprintToWorkflow);
}

export function getWorkflow(id: string): WorkflowDefinition | undefined {
  const bp = getAutomationBlueprint(id);
  return bp ? blueprintToWorkflow(bp) : undefined;
}

export function getWorkflowsByDomain(domain: string): WorkflowDefinition[] {
  return getAllWorkflows().filter(wf => wf.domain === domain);
}

export function getActiveWorkflows(): WorkflowDefinition[] {
  return getAllWorkflows().filter(wf => wf.status === "active");
}

export function assertWorkflowExists(id: string): WorkflowDefinition {
  const wf = getWorkflow(id);
  if (!wf) throw new Error(`Workflow not registered: ${id}`);
  return wf;
}
