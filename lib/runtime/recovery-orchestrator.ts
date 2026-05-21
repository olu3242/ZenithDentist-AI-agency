import "server-only";

import type { Json, RuntimeActionRisk } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import { getAutonomousRecoveryState, type RecoveryActionPlan } from "@/lib/runtime/autonomous-recovery";
import { getGovernanceState } from "@/lib/runtime/governance";
import { buildSimulationCenterState } from "@/lib/runtime/simulation-engine";
import { createServiceClient } from "@/lib/supabase/server";

export interface RecoveryOrchestrationPlan {
  orchestrationKey: string;
  title: string;
  riskLevel: RuntimeActionRisk;
  confidence: number;
  status: "planned" | "approval_required" | "ready" | "blocked";
  sequence: string[];
  mitigationCheckpoints: string[];
  expectedOutcome: string;
}

export interface RecoveryOrchestratorState {
  plans: RecoveryOrchestrationPlan[];
  readyCount: number;
  approvalRequiredCount: number;
  stabilizationScore: number;
}

export async function getRecoveryOrchestratorState(): Promise<RecoveryOrchestratorState> {
  const [recovery, governance, simulations] = await Promise.all([getAutonomousRecoveryState(), getGovernanceState(), buildSimulationCenterState()]);
  const plans = recovery.recoveryPlans.slice(0, 8).map(plan => toOrchestrationPlan(plan, governance.pendingApprovals, simulations.length));
  return {
    plans,
    readyCount: plans.filter(plan => plan.status === "ready").length,
    approvalRequiredCount: plans.filter(plan => plan.status === "approval_required").length,
    stabilizationScore: Math.max(0, Math.min(100, Math.round((recovery.resilienceScore + governance.trustScore + (plans.length ? plans.reduce((sum, plan) => sum + plan.confidence, 0) / plans.length : 0)) / 3)))
  };
}

export async function persistRecoveryOrchestration(plan: RecoveryOrchestrationPlan) {
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("recovery_orchestration_runs")
    .insert({
      organization_id: organizationId,
      orchestration_key: plan.orchestrationKey,
      status: plan.status,
      risk_level: plan.riskLevel,
      confidence: plan.confidence,
      sequence: plan.sequence as unknown as Json,
      outcome: { expectedOutcome: plan.expectedOutcome, mitigationCheckpoints: plan.mitigationCheckpoints } as Json
    })
    .select()
    .single();
  if (error) throw new Error(`Unable to persist recovery orchestration: ${error.message}`);
  return data;
}

function toOrchestrationPlan(plan: RecoveryActionPlan, pendingApprovals: number, simulationCount: number): RecoveryOrchestrationPlan {
  const status = plan.approvalRequired ? "approval_required" : plan.rollbackSafe ? "ready" : "planned";
  return {
    orchestrationKey: plan.id,
    title: plan.title,
    riskLevel: plan.riskLevel,
    confidence: plan.confidence,
    status: pendingApprovals > 6 && plan.riskLevel === "critical" ? "blocked" : status,
    sequence: plan.sequencing,
    mitigationCheckpoints: [
      "Verify tenant runtime scope",
      "Confirm policy boundary",
      "Run mitigation simulation",
      simulationCount ? "Compare against current simulation library" : "Create simulation before execution",
      "Record audit outcome"
    ],
    expectedOutcome: plan.impactEstimate
  };
}
