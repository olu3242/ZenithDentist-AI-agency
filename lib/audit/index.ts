import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Json } from "@/lib/database.types";
import type { RuntimeActionRisk } from "@/lib/database.types";

export type AuditActorType = "user" | "system" | "ai" | "admin" | "workflow";
export type AuditEventType =
  | "user.login" | "user.logout" | "user.created" | "user.updated" | "user.deleted"
  | "member.invited" | "member.removed" | "member.role_changed"
  | "workflow.created" | "workflow.deployed" | "workflow.disabled" | "workflow.replayed"
  | "ai.query" | "ai.recommendation_applied" | "ai.orchestration_triggered"
  | "billing.plan_changed" | "billing.payment_method_updated" | "billing.entitlement_created"
  | "admin.org_created" | "admin.org_updated" | "admin.impersonation"
  | "marketplace.extension_installed" | "marketplace.extension_deployed"
  | "settings.updated" | "integration.connected" | "integration.disconnected";

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorType: AuditActorType;
  eventType: AuditEventType | string;
  title: string;
  description: string;
  traceId: string | null;
  correlationId: string | null;
  severity: RuntimeActionRisk;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LogAuditEventInput {
  organizationId: string;
  actorType?: AuditActorType;
  eventType: AuditEventType | string;
  title: string;
  description: string;
  traceId?: string | null;
  correlationId?: string | null;
  severity?: RuntimeActionRisk;
  metadata?: Record<string, unknown>;
}

/**
 * logAuditEvent — writes a structured audit event to runtime_audit_timeline.
 * Used for user actions, admin actions, billing changes, and AI actions.
 */
export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) {
    logger.warn("audit_event_not_persisted", { eventType: input.eventType, organizationId: input.organizationId });
    return;
  }

  const { error } = await supabase.from("runtime_audit_timeline").insert({
    organization_id: input.organizationId,
    actor_type: input.actorType ?? "system",
    event_type: input.eventType,
    title: input.title,
    description: input.description,
    trace_id: input.traceId ?? null,
    correlation_id: input.correlationId ?? null,
    severity: input.severity ?? "low",
    metadata: (input.metadata ?? {}) as Json,
  });

  if (error) {
    logger.error("audit_event_write_failed", { error: error.message, eventType: input.eventType });
  }
}

/**
 * logUserAction — convenience wrapper for user-initiated audit events.
 */
export async function logUserAction(
  userId: string,
  organizationId: string,
  action: AuditEventType | string,
  target: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  return logAuditEvent({
    organizationId,
    actorType: "user",
    eventType: action,
    title: action.replace(/\./g, " ").replace(/_/g, " "),
    description: `User ${userId} performed ${action} on ${target}`,
    severity: "low",
    metadata: { userId, target, ...metadata },
  });
}

/**
 * getAuditLog — retrieves paginated audit events for an organization.
 */
export async function getAuditLog(
  organizationId: string,
  options: {
    limit?: number;
    offset?: number;
    eventType?: string;
    actorType?: AuditActorType;
    severity?: RuntimeActionRisk;
    since?: string;
  } = {}
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { entries: [], total: 0 };

  let query = supabase
    .from("runtime_audit_timeline")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.offset) query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  if (options.eventType) query = query.eq("event_type", options.eventType);
  if (options.actorType) query = query.eq("actor_type", options.actorType);
  if (options.severity) query = query.eq("severity", options.severity);
  if (options.since) query = query.gte("created_at", options.since);

  const { data, count } = await query;

  return {
    entries: (data ?? []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      actorType: row.actor_type as AuditActorType,
      eventType: row.event_type,
      title: row.title,
      description: row.description,
      traceId: row.trace_id,
      correlationId: row.correlation_id,
      severity: row.severity,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
  };
}

/**
 * getAuditSummary — aggregate counts by event type and actor type.
 */
export async function getAuditSummary(organizationId: string): Promise<{
  totalEvents: number;
  byActor: Record<string, number>;
  bySeverity: Record<string, number>;
  recentHighSeverity: AuditLogEntry[];
}> {
  const { entries, total } = await getAuditLog(organizationId, { limit: 200 });

  const byActor: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const e of entries) {
    byActor[e.actorType] = (byActor[e.actorType] ?? 0) + 1;
    bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
  }

  const recentHighSeverity = entries.filter(e => e.severity === "high" || e.severity === "critical").slice(0, 10);

  return { totalEvents: total, byActor, bySeverity, recentHighSeverity };
}
