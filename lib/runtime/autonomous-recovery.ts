import "server-only";

import type { RuntimeActionRisk } from "@/lib/database.types";
import { getGovernanceState } from "@/lib/runtime/governance";
import { buildRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";

export interface RecoveryActionPlan {
  id: string;
  title: string;
  actionType: "retry_optimization" | "queue_balancing" | "provider_failover" | "sla_defense" | "replay_recommendation" | "escalation";
  riskLevel: RuntimeActionRisk;
  confidence: number;
  rollbackSafe: boolean;
  approvalRequired: boolean;
  impactEstimate: string;
  sequencing: string[];
}

export interface AutonomousRecoveryState {
  resilienceScore: number;
  recoveryPlans: RecoveryActionPlan[];
  safeToExecuteCount: number;
  approvalRequiredCount: number;
  governanceTrustScore: number;
}

export async function getAutonomousRecoveryState(): Promise<AutonomousRecoveryState> {
  const [runtime, providers, governance] = await Promise.all([getRuntimeHealthState(), getProviderHealth(), getGovernanceState()]);
  const replay = buildReplayCenterState(runtime);
  const forecasts = buildRuntimeForecasts(runtime, providers);
  const replayPlans = replay.candidates.slice(0, 5).map(candidate => ({
    id: `recovery-${candidate.traceId}`,
    title: `${candidate.workflowId} recovery sequencing`,
    actionType: "replay_recommendation" as const,
    riskLevel: candidate.operationalSeverity === "CRITICAL" ? "critical" as const : candidate.operationalSeverity === "HIGH" ? "high" as const : "moderate" as const,
    confidence: candidate.confidence,
    rollbackSafe: candidate.rollbackSafe,
    approvalRequired: !candidate.rollbackSafe || candidate.confidence < 75,
    impactEstimate: candidate.rollbackSafe ? "Expected to restore trace continuity with low rollback exposure." : "Requires operator review before runtime recovery.",
    sequencing: ["Validate tenant scope", "Check dependency health", "Simulate recovery path", "Execute approved replay", "Monitor recovery confidence"]
  }));
  const forecastPlans = forecasts.slice(0, 4).map(forecast => ({
    id: `forecast-recovery-${forecast.id}`,
    title: `${forecast.title} mitigation`,
    actionType: forecast.forecastType === "provider" ? "provider_failover" as const : forecast.forecastType === "queue" ? "queue_balancing" as const : "sla_defense" as const,
    riskLevel: forecast.impact === "CRITICAL" ? "critical" as const : forecast.impact === "HIGH" ? "high" as const : "moderate" as const,
    confidence: Math.max(45, forecast.probability),
    rollbackSafe: forecast.impact !== "CRITICAL",
    approvalRequired: forecast.impact === "CRITICAL",
    impactEstimate: forecast.recommendation,
    sequencing: ["Detect runtime pressure", "Reduce risky execution", "Escalate if threshold persists", "Confirm SLA recovery"]
  }));
  const recoveryPlans = [...replayPlans, ...forecastPlans].sort((a, b) => b.confidence - a.confidence);
  return {
    resilienceScore: Math.max(0, Math.min(100, Math.round((runtime.scores.healingScore + governance.trustScore + runtime.scores.reliabilityScore) / 3))),
    recoveryPlans,
    safeToExecuteCount: recoveryPlans.filter(plan => plan.rollbackSafe && !plan.approvalRequired).length,
    approvalRequiredCount: recoveryPlans.filter(plan => plan.approvalRequired).length,
    governanceTrustScore: governance.trustScore
  };
}
