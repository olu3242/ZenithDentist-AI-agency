import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";
import type { AutomationBlueprint, AutomationDomain } from "@/types/automation";

export type OperationalNodeType =
  | "workflow"
  | "event"
  | "queue_handler"
  | "provider"
  | "persistence"
  | "ui_visibility"
  | "alice_grounding"
  | "sla";

export interface OperationalGraphNode {
  id: string;
  label: string;
  type: OperationalNodeType;
  domain?: AutomationDomain;
  workflowId?: string;
  riskScore: number;
}

export interface OperationalGraphEdge {
  id: string;
  from: string;
  to: string;
  relationship: string;
  workflowId: string;
}

export interface WorkflowGraph {
  nodes: OperationalGraphNode[];
  edges: OperationalGraphEdge[];
  criticalPath: string[];
  cascadeFailures: Array<{ workflowId: string; impactedNodes: string[]; severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" }>;
  operationalRisk: number;
}

export async function buildWorkflowGraph(): Promise<WorkflowGraph> {
  const runtime = await getRuntimeHealthState();
  return buildWorkflowGraphFromRuntime(runtime);
}

export function buildWorkflowGraphFromRuntime(runtime: RuntimeHealthState): WorkflowGraph {
  const nodes = automationRegistry.flatMap(blueprint => buildNodesForBlueprint(blueprint, runtime));
  const edges = automationRegistry.flatMap(buildEdgesForBlueprint);
  const cascadeFailures = detectCascadeFailures(runtime);
  const criticalPath = detectCriticalPath(runtime, edges);
  return {
    nodes,
    edges,
    criticalPath,
    cascadeFailures,
    operationalRisk: calculateOperationalRisk(runtime)
  };
}

export function mapWorkflowDependencies(workflowId: string) {
  const blueprint = automationRegistry.find(item => item.id === workflowId);
  if (!blueprint) return [];
  return [
    ...blueprint.emittedEvents.map(eventName => ({ type: "event", id: eventName })),
    ...blueprint.queueHandlers.map(handler => ({ type: "queue_handler", id: handler })),
    ...(blueprint.dependencies ?? []).map(dependency => ({ type: "provider", id: dependency })),
    ...blueprint.aliceGroundingSurfaces.map(surface => ({ type: "alice_grounding", id: surface })),
    ...(blueprint.slaMinutes ? [{ type: "sla", id: `${blueprint.slaMinutes}m` }] : [])
  ];
}

export function detectCascadeFailures(runtime: RuntimeHealthState) {
  return runtime.unhealthyWorkflows.map(workflow => {
    const dependencies = mapWorkflowDependencies(workflow.workflowId);
    const impactedNodes = dependencies.map(item => `${item.type}:${item.id}`);
    return {
      workflowId: workflow.workflowId,
      impactedNodes,
      severity: workflow.severity === "critical" || impactedNodes.length > 8 ? "CRITICAL" as const : impactedNodes.length > 5 ? "HIGH" as const : "MODERATE" as const
    };
  });
}

export function detectCriticalPath(runtime: RuntimeHealthState, edges?: OperationalGraphEdge[]) {
  const edgeSet = edges ?? automationRegistry.flatMap(buildEdgesForBlueprint);
  const workflowsWithFailures = new Set(runtime.unhealthyWorkflows.map(item => item.workflowId));
  if (!workflowsWithFailures.size) {
    return automationRegistry.slice(0, 3).map(item => item.id);
  }
  return edgeSet
    .filter(edge => workflowsWithFailures.has(edge.workflowId))
    .map(edge => edge.from)
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, 12);
}

export function calculateOperationalRisk(runtime: RuntimeHealthState) {
  const failedWeight = runtime.unhealthyWorkflows.reduce((sum, item) => sum + (item.severity === "critical" ? 18 : 9), 0);
  const slaWeight = runtime.slaBreaches.length * 10;
  const deadLetterWeight = runtime.deadLetters.filter(item => !item.replayed_at).length * 12;
  const registryGapWeight = automationRegistry.filter(item => !item.replayRequired || !item.retryEnabled || !item.deadLetterRequired).length * 5;
  return Math.min(100, failedWeight + slaWeight + deadLetterWeight + registryGapWeight);
}

function buildNodesForBlueprint(blueprint: AutomationBlueprint, runtime: RuntimeHealthState): OperationalGraphNode[] {
  const traces = runtime.traces.filter(trace => trace.workflow_id === blueprint.id);
  const failed = traces.some(trace => trace.status === "failed");
  const baseRisk = failed ? 80 : traces.length ? 20 : 35;
  return [
    node(`workflow:${blueprint.id}`, blueprint.name, "workflow", blueprint, baseRisk),
    ...blueprint.emittedEvents.map(eventName => node(`event:${blueprint.id}:${eventName}`, eventName, "event", blueprint, baseRisk - 8)),
    ...blueprint.queueHandlers.map(handler => node(`handler:${blueprint.id}:${handler}`, handler, "queue_handler", blueprint, baseRisk - 4)),
    ...(blueprint.dependencies ?? []).map(provider => node(`provider:${blueprint.id}:${provider}`, provider, "provider", blueprint, baseRisk)),
    node(`persistence:${blueprint.id}`, "runtime persistence", "persistence", blueprint, baseRisk - 10),
    node(`ui:${blueprint.id}`, "Mission Control visibility", "ui_visibility", blueprint, baseRisk - 12),
    ...blueprint.aliceGroundingSurfaces.map(surface => node(`alice:${blueprint.id}:${surface}`, surface, "alice_grounding", blueprint, baseRisk - 10)),
    node(`sla:${blueprint.id}`, blueprint.slaMinutes ? `${blueprint.slaMinutes} minute SLA` : "SLA missing", "sla", blueprint, blueprint.slaMinutes ? baseRisk - 15 : 85)
  ];
}

function buildEdgesForBlueprint(blueprint: AutomationBlueprint): OperationalGraphEdge[] {
  const workflow = `workflow:${blueprint.id}`;
  const eventEdges = blueprint.emittedEvents.map(eventName => edge(workflow, `event:${blueprint.id}:${eventName}`, "emits event", blueprint.id));
  const handlerEdges = blueprint.queueHandlers.map((handler, index) => {
    const previous = blueprint.emittedEvents[index % Math.max(1, blueprint.emittedEvents.length)];
    return edge(`event:${blueprint.id}:${previous}`, `handler:${blueprint.id}:${handler}`, "routes to queue handler", blueprint.id);
  });
  const providerEdges = (blueprint.dependencies ?? []).map(provider => edge(`handler:${blueprint.id}:${blueprint.queueHandlers[0]}`, `provider:${blueprint.id}:${provider}`, "calls provider action", blueprint.id));
  const persistenceEdge = edge(`handler:${blueprint.id}:${blueprint.queueHandlers[0]}`, `persistence:${blueprint.id}`, "persists runtime state", blueprint.id);
  const uiEdge = edge(`persistence:${blueprint.id}`, `ui:${blueprint.id}`, "surfaces in UI", blueprint.id);
  const aliceEdges = blueprint.aliceGroundingSurfaces.map(surface => edge(`ui:${blueprint.id}`, `alice:${blueprint.id}:${surface}`, "grounds ALICE", blueprint.id));
  const slaEdge = edge(`alice:${blueprint.id}:${blueprint.aliceGroundingSurfaces[0]}`, `sla:${blueprint.id}`, "validates SLA", blueprint.id);
  return [...eventEdges, ...handlerEdges, ...providerEdges, persistenceEdge, uiEdge, ...aliceEdges, slaEdge];
}

function node(id: string, label: string, type: OperationalNodeType, blueprint: AutomationBlueprint, riskScore: number): OperationalGraphNode {
  return { id, label, type, domain: blueprint.domain, workflowId: blueprint.id, riskScore: Math.max(0, Math.min(100, riskScore)) };
}

function edge(from: string, to: string, relationship: string, workflowId: string): OperationalGraphEdge {
  return { id: `${from}->${to}`, from, to, relationship, workflowId };
}
