import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface ErrorDashboardEntry {
  id: string;
  errorCode: string;
  category: string;
  severity: string;
  message: string;
  route: string | null;
  component: string | null;
  organizationId: string | null;
  traceId: string | null;
  resolvedAt: string | null;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}

export interface ErrorDashboardSummary {
  total: number;
  unresolved: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  topErrors: ErrorDashboardEntry[];
  recentErrors: ErrorDashboardEntry[];
  recoveryRate: number;
}

export async function getErrorDashboard(organizationId?: string): Promise<ErrorDashboardSummary> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const windowStart = new Date(Date.now() - 7 * 86400000).toISOString();

  const empty: ErrorDashboardSummary = {
    total: 0, unresolved: 0, byCategory: {}, bySeverity: {}, topErrors: [], recentErrors: [], recoveryRate: 100,
  };

  if (!supabase) return empty;

  // Use automation_dead_letters + runtime audit timeline as error sources
  const [deadLetters, auditErrors, traces] = await Promise.all([
    organizationId
      ? (supabase as any).from("automation_dead_letters").select("*").eq("organization_id", organizationId).gte("created_at", windowStart).order("created_at", { ascending: false }).limit(100)
      : (supabase as any).from("automation_dead_letters").select("*").gte("created_at", windowStart).order("created_at", { ascending: false }).limit(100),
    supabase.from("runtime_audit_timeline")
      .select("id, event_type, title, metadata, created_at, organization_id, correlation_id")
      .ilike("event_type", "%error%")
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(100),
    organizationId
      ? supabase.from("automation_traces").select("trace_id, workflow_id, status, started_at, organization_id").eq("organization_id", organizationId).eq("status", "failed").gte("started_at", windowStart).limit(100)
      : supabase.from("automation_traces").select("trace_id, workflow_id, status, started_at, organization_id").eq("status", "failed").gte("started_at", windowStart).limit(100),
  ]);

  const entries: ErrorDashboardEntry[] = [];

  // Dead letters as critical errors
  for (const dl of (deadLetters.data ?? []) as Array<Record<string, unknown>>) {
    entries.push({
      id: dl.id as string,
      errorCode: "RT_003",
      category: "RUNTIME_ERROR",
      severity: "critical",
      message: `Dead letter: ${dl.workflow_id ?? "unknown"} — ${dl.error_message ?? "no message"}`,
      route: null,
      component: `workflow/${dl.workflow_id ?? ""}`,
      organizationId: (dl.organization_id as string) ?? null,
      traceId: dl.trace_id as string ?? null,
      resolvedAt: (dl.replayed_at as string) ?? null,
      occurrences: 1,
      firstSeen: dl.created_at as string,
      lastSeen: dl.created_at as string,
    });
  }

  // Failed traces as runtime errors
  for (const trace of (traces.data ?? [])) {
    entries.push({
      id: trace.trace_id,
      errorCode: "RT_001",
      category: "RUNTIME_ERROR",
      severity: "critical",
      message: `Workflow ${trace.workflow_id} failed`,
      route: null,
      component: `workflow/${trace.workflow_id}`,
      organizationId: trace.organization_id ?? null,
      traceId: trace.trace_id,
      resolvedAt: null,
      occurrences: 1,
      firstSeen: trace.started_at ?? now,
      lastSeen: trace.started_at ?? now,
    });
  }

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
  }

  const unresolved = entries.filter(e => !e.resolvedAt).length;
  const resolved = entries.filter(e => !!e.resolvedAt).length;
  const recoveryRate = entries.length > 0 ? Math.round((resolved / entries.length) * 100) : 100;

  logger.info("error_dashboard_loaded", { organizationId, total: entries.length, unresolved });

  return {
    total: entries.length,
    unresolved,
    byCategory,
    bySeverity,
    topErrors: entries.filter(e => !e.resolvedAt).slice(0, 10),
    recentErrors: entries.slice(0, 20),
    recoveryRate,
  };
}
