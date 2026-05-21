import "server-only";

import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState, type ReplayCandidate } from "@/lib/runtime/replay-engine";

export interface OperationalSimulation {
  id: string;
  simulationType: "replay" | "mitigation" | "queue_load" | "provider_outage" | "sla_defense";
  title: string;
  confidence: number;
  projectedImpact: {
    reliabilityDelta: number;
    slaRiskDelta: number;
    recoveryMinutes: number;
    operatorLoad: "low" | "moderate" | "high";
  };
  checkpoints: string[];
}

export async function buildSimulationCenterState(): Promise<OperationalSimulation[]> {
  const [runtime, providers] = await Promise.all([getRuntimeHealthState(), getProviderHealth()]);
  const replay = buildReplayCenterState(runtime);
  const replaySimulations = replay.candidates.slice(0, 4).map(simulateReplayCandidate);
  const providerSimulations = providers
    .filter(provider => provider.status === "degraded" || provider.status === "down")
    .map(provider => ({
      id: `provider-outage-${provider.providerKey}`,
      simulationType: "provider_outage" as const,
      title: `${provider.providerKey.replace(/_/g, " ")} fallback simulation`,
      confidence: Math.max(30, Math.round(provider.confidence * 100)),
      projectedImpact: {
        reliabilityDelta: provider.status === "down" ? -18 : -8,
        slaRiskDelta: provider.dependencyImpact,
        recoveryMinutes: 25,
        operatorLoad: "moderate" as const
      },
      checkpoints: ["Validate dependency health", "Reduce execution pressure", "Prepare fallback routing", "Monitor SLA recovery"]
    }));
  const slaDefense = runtime.slaBreaches.length
    ? [{
        id: "sla-defense-current",
        simulationType: "sla_defense" as const,
        title: "SLA defense simulation",
        confidence: 76,
        projectedImpact: {
          reliabilityDelta: 9,
          slaRiskDelta: -Math.min(40, runtime.slaBreaches.length * 8),
          recoveryMinutes: 18,
          operatorLoad: "low" as const
        },
        checkpoints: ["Pause low-priority replay", "Prioritize breached traces", "Escalate high-risk workflows", "Confirm recovery timing"]
      }]
    : [];
  return [...replaySimulations, ...providerSimulations, ...slaDefense];
}

function simulateReplayCandidate(candidate: ReplayCandidate): OperationalSimulation {
  return {
    id: `replay-sim-${candidate.traceId}`,
    simulationType: "replay",
    title: `${candidate.workflowId} replay simulation`,
    confidence: candidate.confidence,
    projectedImpact: {
      reliabilityDelta: candidate.rollbackSafe ? 7 : 2,
      slaRiskDelta: candidate.rollbackSafe ? -12 : 4,
      recoveryMinutes: candidate.rollbackSafe ? 12 : 30,
      operatorLoad: candidate.operationalSeverity === "CRITICAL" ? "high" : candidate.operationalSeverity === "HIGH" ? "moderate" : "low"
    },
    checkpoints: [
      "Confirm tenant scope",
      "Validate dependency health",
      "Preserve correlation lineage",
      candidate.rollbackSafe ? "Execute rollback-safe replay" : "Route to approval before execution"
    ]
  };
}
