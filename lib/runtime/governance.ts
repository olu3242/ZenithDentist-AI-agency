import "server-only";

import type { Database, Json, RuntimeActionRisk } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import type { ReplayCenterState } from "@/lib/runtime/replay-engine";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";
import { createServiceClient } from "@/lib/supabase/server";

export type GovernancePolicy = Database["public"]["Tables"]["runtime_governance_policies"]["Row"];
export type GovernanceDecision = Database["public"]["Tables"]["runtime_governance_decisions"]["Row"];
export type AuditTimelineEvent = Database["public"]["Tables"]["runtime_audit_timeline"]["Row"];

export interface GovernanceRule {
  key: string;
  name: string;
  policyType: "replay_authorization" | "sla_defense" | "provider_failover" | "escalation" | "tenant_limit";
  riskThreshold: RuntimeActionRisk;
  approvalRequired: boolean;
  active: boolean;
  description: string;
}

export interface GovernanceState {
  organizationId: string;
  rules: GovernanceRule[];
  decisions: GovernanceDecision[];
  auditTimeline: AuditTimelineEvent[];
  pendingApprovals: number;
  trustScore: number;
  replayGovernance: Array<{
    traceId: string;
    workflowId: string;
    riskLevel: RuntimeActionRisk;
    approvalRequired: boolean;
    signOffPath: string[];
    decision: "allow" | "approval_required" | "blocked";
  }>;
}

const defaultRules: GovernanceRule[] = [
  {
    key: "critical_replay_signoff",
    name: "Critical replay sign-off",
    policyType: "replay_authorization",
    riskThreshold: "high",
    approvalRequired: true,
    active: true,
    description: "High-risk recovery requires operator authorization before execution."
  },
  {
    key: "sla_defense_escalation",
    name: "SLA defense escalation",
    policyType: "sla_defense",
    riskThreshold: "moderate",
    approvalRequired: false,
    active: true,
    description: "SLA threats create audit-visible mitigation tasks."
  },
  {
    key: "provider_degradation_guardrail",
    name: "Provider degradation guardrail",
    policyType: "provider_failover",
    riskThreshold: "high",
    approvalRequired: true,
    active: true,
    description: "Provider instability requires dependency impact review before routing changes."
  }
];

export async function getGovernanceState(): Promise<GovernanceState> {
  const [tenant, runtime] = await Promise.all([getTenantData(), getRuntimeHealthState()]);
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const replay = buildReplayCenterState(runtime);
  const supabase = createServiceClient();
  if (!supabase) return buildGovernanceState(organizationId, runtime, replay, [], []);

  const [decisions, auditTimeline] = await Promise.all([
    supabase.from("runtime_governance_decisions").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
    supabase.from("runtime_audit_timeline").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(80)
  ]);

  return buildGovernanceState(organizationId, runtime, replay, decisions.data ?? [], auditTimeline.data ?? []);
}

export function buildGovernanceState(
  organizationId: string,
  runtime: RuntimeHealthState,
  replay: ReplayCenterState,
  decisions: GovernanceDecision[],
  auditTimeline: AuditTimelineEvent[]
): GovernanceState {
  const replayGovernance = replay.candidates.map(candidate => {
    const riskLevel = riskForSeverity(candidate.operationalSeverity);
    const approvalRequired = riskLevel === "high" || riskLevel === "critical" || !candidate.rollbackSafe;
    return {
      traceId: candidate.traceId,
      workflowId: candidate.workflowId,
      riskLevel,
      approvalRequired,
      signOffPath: approvalRequired ? ["runtime owner", "operations lead"] : ["runtime policy"],
      decision: !candidate.rollbackSafe && riskLevel === "critical" ? "blocked" as const : approvalRequired ? "approval_required" as const : "allow" as const
    };
  });
  const pendingApprovals = replayGovernance.filter(item => item.approvalRequired).length + decisions.filter(item => item.status === "pending").length;
  const trustScore = Math.max(0, Math.min(100, Math.round((runtime.scores.reliabilityScore + runtime.scores.observabilityScore + runtime.scores.healingScore) / 3 - pendingApprovals * 3)));
  return {
    organizationId,
    rules: defaultRules,
    decisions,
    auditTimeline,
    pendingApprovals,
    trustScore,
    replayGovernance
  };
}

export async function appendAuditEvent(input: {
  eventType: string;
  title: string;
  description: string;
  severity?: RuntimeActionRisk;
  traceId?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("runtime_audit_timeline")
    .insert({
      organization_id: organizationId,
      event_type: input.eventType,
      title: input.title,
      description: input.description,
      severity: input.severity ?? "moderate",
      trace_id: input.traceId ?? null,
      correlation_id: input.correlationId ?? null,
      metadata: (input.metadata ?? {}) as Json
    })
    .select()
    .single();
  if (error) throw new Error(`Unable to append governance audit event: ${error.message}`);
  return data;
}

function riskForSeverity(severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"): RuntimeActionRisk {
  if (severity === "CRITICAL") return "critical";
  if (severity === "HIGH") return "high";
  if (severity === "MODERATE") return "moderate";
  return "low";
}
