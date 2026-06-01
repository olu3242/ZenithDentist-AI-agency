import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { OperationalIncidentSeverity } from "@/lib/database.types";

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type EscalationPath = "account_manager" | "engineering" | "executive";

export interface SupportTicket {
  id: string;
  organizationId: string;
  incidentKey: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  reportedBy: string | null;
  assignedTo: string | null;
  escalationPath: EscalationPath | null;
  openedAt: string;
  resolvedAt: string | null;
  slaBreached: boolean;
}

export interface SupportDashboard {
  organizationId: string;
  openTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
  avgResolutionHours: number | null;
  slaBreachCount: number;
  tickets: SupportTicket[];
  generatedAt: string;
}

const SEVERITY_TO_PRIORITY: Record<OperationalIncidentSeverity, TicketPriority> = {
  low: "low",
  moderate: "medium",
  high: "high",
  critical: "critical",
};

const STATUS_MAP: Record<string, TicketStatus> = {
  open: "open",
  mitigating: "in_progress",
  resolved: "resolved",
  postmortem: "closed",
};

const SLA_HOURS: Record<TicketPriority, number> = {
  low: 72,
  medium: 24,
  high: 8,
  critical: 2,
};

/**
 * createSupportTicket — opens a new support ticket via operational_incidents.
 */
export async function createSupportTicket(input: {
  organizationId: string;
  title: string;
  description: string;
  priority?: TicketPriority;
  reportedBy?: string;
}): Promise<SupportTicket | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const incidentKey = `support_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const severityMap: Record<TicketPriority, OperationalIncidentSeverity> = {
    low: "low", medium: "moderate", high: "high", critical: "critical",
  };

  const { data, error } = await supabase.from("operational_incidents").insert({
    organization_id: input.organizationId,
    incident_key: incidentKey,
    title: input.title,
    severity: severityMap[input.priority ?? "medium"],
    root_cause: input.description,
  }).select().single();

  if (error) {
    logger.error("support_ticket_create_failed", { error: error.message, organizationId: input.organizationId });
    return null;
  }

  return mapIncidentToTicket(data, input.reportedBy ?? null);
}

/**
 * getOpenTickets — returns all open/in-progress tickets for an org.
 */
export async function getOpenTickets(organizationId: string): Promise<SupportTicket[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("operational_incidents")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["open", "mitigating"])
    .order("opened_at", { ascending: false })
    .limit(50);

  return (data ?? []).map(inc => mapIncidentToTicket(inc, null));
}

/**
 * escalateTicket — updates incident severity and records escalation event.
 */
export async function escalateTicket(
  incidentId: string,
  organizationId: string,
  escalationPath: EscalationPath
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase
    .from("operational_incidents")
    .update({ severity: "critical", mitigation: `Escalated to ${escalationPath}` })
    .eq("id", incidentId)
    .eq("organization_id", organizationId);

  await supabase.from("operational_incident_events").insert({
    incident_id: incidentId,
    event_type: "escalation",
    message: `Ticket escalated to ${escalationPath}`,
    metadata: { escalationPath },
  });
}

/**
 * getSupportDashboard — summary of support activity for an org.
 */
export async function getSupportDashboard(organizationId: string): Promise<SupportDashboard> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  if (!supabase) return emptyDashboard(organizationId, now);

  const { data: incidents } = await supabase
    .from("operational_incidents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("opened_at", { ascending: false })
    .limit(100);

  const all = (incidents ?? []).map(inc => mapIncidentToTicket(inc, null));
  const open = all.filter(t => t.status === "open" || t.status === "in_progress");
  const resolved = all.filter(t => t.status === "resolved" || t.status === "closed");
  const critical = all.filter(t => t.priority === "critical" && t.status !== "closed");
  const breached = all.filter(t => t.slaBreached);

  const resolutionTimes = resolved
    .filter(t => t.resolvedAt)
    .map(t => (new Date(t.resolvedAt!).getTime() - new Date(t.openedAt).getTime()) / (1000 * 60 * 60));

  const avgResolutionHours = resolutionTimes.length > 0
    ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) / 10
    : null;

  return {
    organizationId,
    openTickets: open.length,
    resolvedTickets: resolved.length,
    criticalTickets: critical.length,
    avgResolutionHours,
    slaBreachCount: breached.length,
    tickets: open.slice(0, 20),
    generatedAt: now,
  };
}

function mapIncidentToTicket(
  inc: {
    id: string;
    organization_id: string;
    incident_key: string;
    title: string;
    severity: OperationalIncidentSeverity;
    status: string;
    root_cause: string | null;
    opened_at: string;
    resolved_at: string | null;
    sla_impact_ms?: number | null;
    correlation_id?: string | null;
    mitigation?: string | null;
  },
  reportedBy: string | null
): SupportTicket {
  const priority = SEVERITY_TO_PRIORITY[inc.severity];
  const status = STATUS_MAP[inc.status] ?? "open";
  const slaHours = SLA_HOURS[priority];
  const openedMs = new Date(inc.opened_at).getTime();
  const nowMs = Date.now();
  const slaDeadlineMs = openedMs + slaHours * 60 * 60 * 1000;
  const slaBreached = !inc.resolved_at && nowMs > slaDeadlineMs;

  return {
    id: inc.id,
    organizationId: inc.organization_id,
    incidentKey: inc.incident_key,
    title: inc.title,
    description: inc.root_cause ?? "",
    priority,
    status,
    reportedBy,
    assignedTo: null,
    escalationPath: null,
    openedAt: inc.opened_at,
    resolvedAt: inc.resolved_at,
    slaBreached,
  };
}

function emptyDashboard(organizationId: string, now: string): SupportDashboard {
  return {
    organizationId,
    openTickets: 0,
    resolvedTickets: 0,
    criticalTickets: 0,
    avgResolutionHours: null,
    slaBreachCount: 0,
    tickets: [],
    generatedAt: now,
  };
}
