import "server-only";

import { getOperationalMeshState } from "@/lib/runtime/agent-mesh";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getGovernanceState } from "@/lib/runtime/governance";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildSimulationCenterState } from "@/lib/runtime/simulation-engine";

export interface OperationalCognitionState {
  cognitionScore: number;
  infrastructureNarrative: string;
  anomalyCorrelations: Array<{ title: string; explanation: string; confidence: number }>;
  remediationRanking: Array<{ action: string; priority: number; expectedOutcome: string }>;
  orchestrationStrategy: string[];
  executiveRoadmap: string[];
}

export async function getOperationalCognitionState(): Promise<OperationalCognitionState> {
  const [runtime, providers, forecasts, recovery, governance, simulations, mesh] = await Promise.all([
    getRuntimeHealthState(),
    getProviderHealth(),
    generateRuntimeForecasts(),
    getAutonomousRecoveryState(),
    getGovernanceState(),
    buildSimulationCenterState(),
    getOperationalMeshState()
  ]);
  const degradedProviders = providers.filter(provider => provider.status === "degraded" || provider.status === "down");
  const cognitionScore = Math.max(0, Math.min(100, Math.round((runtime.scores.operationalScore + recovery.resilienceScore + governance.trustScore + mesh.coordinationScore) / 4)));
  return {
    cognitionScore,
    infrastructureNarrative: degradedProviders.length
      ? `Operational cognition detects dependency pressure from ${degradedProviders.map(provider => provider.providerKey).join(", ")} with ${forecasts.length} active forecasts.`
      : `Operational cognition is stable with ${mesh.agents.length} agents coordinating across runtime, governance, forecasting, and tenant intelligence.`,
    anomalyCorrelations: [
      {
        title: "Runtime pressure correlation",
        explanation: `${runtime.unhealthyWorkflows.length} unhealthy workflows correlate with ${recovery.approvalRequiredCount} approval-gated recovery actions.`,
        confidence: Math.max(50, recovery.resilienceScore)
      },
      {
        title: "Forecast and simulation alignment",
        explanation: `${forecasts.length} forecasts are mapped against ${simulations.length} operational simulations for mitigation planning.`,
        confidence: forecasts.length ? Math.min(95, 58 + forecasts.length * 6) : 62
      }
    ],
    remediationRanking: recovery.recoveryPlans.slice(0, 5).map((plan, index) => ({
      action: plan.title,
      priority: index + 1,
      expectedOutcome: plan.impactEstimate
    })),
    orchestrationStrategy: [
      "Preserve tenant-scoped execution boundaries",
      "Route high-risk recovery through governance approval",
      "Apply rollback-safe actions before provider routing changes",
      "Use simulation results to sequence SLA defense",
      "Feed outcomes into operational memory"
    ],
    executiveRoadmap: [
      cognitionScore < 70 ? "Stabilize runtime resilience before increasing operational volume." : "Expand operational cloud coverage across tenant benchmarking and executive reporting.",
      mesh.escalationCount ? "Resolve active agent escalations through governance-controlled mitigation." : "Continue distributed runtime observation with current controls.",
      "Convert repeated recovery outcomes into policy improvements."
    ]
  };
}
