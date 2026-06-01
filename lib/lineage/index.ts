import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type LineageNodeType =
  | "portal_action"
  | "workflow_execution"
  | "event_fabric"
  | "analytics_projection"
  | "alice_query"
  | "mission_control_read";

export interface LineageNode {
  id: string;
  type: LineageNodeType;
  label: string;
  correlationId: string;
  organizationId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface LineageChain {
  correlationId: string;
  organizationId: string;
  nodes: LineageNode[];
  complete: boolean;
  startedAt: string;
  completedAt: string | null;
}

/**
 * traceLineage — reconstructs the full execution chain for a given correlationId.
 * Traces: Portal → Workflow → Event → Analytics → ALICE → Mission Control
 */
export async function traceLineage(correlationId: string, organizationId: string): Promise<LineageChain> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  if (!supabase) {
    return { correlationId, organizationId, nodes: [], complete: false, startedAt: now, completedAt: null };
  }

  const [traces, fabricEvents, auditEntries] = await Promise.all([
    supabase
      .from("automation_traces")
      .select("trace_id, workflow_id, status, started_at, latency_ms")
      .eq("organization_id", organizationId)
      .eq("correlation_id", correlationId)
      .order("started_at", { ascending: true })
      .limit(20),
    supabase
      .from("runtime_event_fabric_events")
      .select("id, event_type, source_system, target_channel, status, published_at, correlation_id")
      .eq("organization_id", organizationId)
      .eq("correlation_id", correlationId)
      .order("published_at", { ascending: true })
      .limit(50),
    supabase
      .from("runtime_audit_timeline")
      .select("id, event_type, actor_type, title, created_at, correlation_id")
      .eq("organization_id", organizationId)
      .eq("correlation_id", correlationId)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const nodes: LineageNode[] = [];

  // Audit timeline entries → portal actions and ALICE queries
  for (const entry of auditEntries.data ?? []) {
    const type: LineageNodeType =
      entry.actor_type === "ai" ? "alice_query" :
      entry.actor_type === "user" ? "portal_action" :
      "portal_action";
    nodes.push({
      id: entry.id,
      type,
      label: entry.title,
      correlationId,
      organizationId,
      timestamp: entry.created_at,
      metadata: { eventType: entry.event_type, actorType: entry.actor_type },
    });
  }

  // Workflow traces
  for (const trace of traces.data ?? []) {
    nodes.push({
      id: trace.trace_id,
      type: "workflow_execution",
      label: `Workflow: ${trace.workflow_id}`,
      correlationId,
      organizationId,
      timestamp: trace.started_at ?? now,
      metadata: { workflowId: trace.workflow_id, status: trace.status, latencyMs: trace.latency_ms },
    });
  }

  // Event Fabric events
  for (const event of fabricEvents.data ?? []) {
    nodes.push({
      id: event.id,
      type: "event_fabric",
      label: `Event: ${event.event_type}`,
      correlationId: event.correlation_id ?? correlationId,
      organizationId,
      timestamp: event.published_at,
      metadata: { eventType: event.event_type, sourceSystem: event.source_system, targetChannel: event.target_channel, status: event.status },
    });
  }

  // Sort all nodes by timestamp
  nodes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const nodeTypes = new Set(nodes.map(n => n.type));
  const complete = nodeTypes.has("portal_action") &&
    nodeTypes.has("workflow_execution") &&
    nodeTypes.has("event_fabric");

  logger.info("lineage_traced", { correlationId, organizationId, nodeCount: nodes.length, complete });

  return {
    correlationId,
    organizationId,
    nodes,
    complete,
    startedAt: nodes[0]?.timestamp ?? now,
    completedAt: complete ? nodes[nodes.length - 1]?.timestamp ?? null : null,
  };
}

/**
 * getRecentLineageChains — returns lineage chains for recent events in an org.
 */
export async function getRecentLineageChains(organizationId: string, limit = 10): Promise<LineageChain[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data: recentEvents } = await supabase
    .from("runtime_event_fabric_events")
    .select("correlation_id")
    .eq("organization_id", organizationId)
    .not("correlation_id", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit * 3);

  const seen = new Set<string>();
  const chains: LineageChain[] = [];

  for (const event of recentEvents ?? []) {
    if (!event.correlation_id || seen.has(event.correlation_id)) continue;
    seen.add(event.correlation_id);
    if (chains.length >= limit) break;
    chains.push(await traceLineage(event.correlation_id, organizationId));
  }

  return chains;
}
