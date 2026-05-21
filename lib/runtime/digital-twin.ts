import "server-only";

import { getOperationalMeshState } from "@/lib/runtime/agent-mesh";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeIncidents } from "@/lib/runtime/incident-management";
import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";
import { buildSimulationCenterState } from "@/lib/runtime/simulation-engine";

export interface RuntimeDigitalTwinState {
  twinKey: string;
  resilienceScore: number;
  runtimeModel: Array<{ layer: string; score: number; pressure: number }>;
  simulations: Array<{ scenario: string; confidence: number; projectedEffect: string }>;
  stressTests: Array<{ name: string; result: "pass" | "watch" | "fail"; detail: string }>;
}

export async function getRuntimeDigitalTwinState(): Promise<RuntimeDigitalTwinState> {
  const [runtime, providers, forecasts, recovery, simulations, memory, incidents, mesh] = await Promise.all([
    getRuntimeHealthState(),
    getProviderHealth(),
    generateRuntimeForecasts(),
    getAutonomousRecoveryState(),
    buildSimulationCenterState(),
    getOperationalMemoryState(),
    getRuntimeIncidents(),
    getOperationalMeshState()
  ]);
  const replay = buildReplayCenterState(runtime);
  const providerScore = providers.length ? Math.round(providers.reduce((sum, provider) => sum + provider.uptimeScore, 0) / providers.length) : 0;
  return {
    twinKey: `runtime-twin-${runtime.organizationId}`,
    resilienceScore: recovery.resilienceScore,
    runtimeModel: [
      { layer: "Runtime health", score: runtime.scores.operationalScore, pressure: 100 - runtime.scores.operationalScore },
      { layer: "Provider ecosystem", score: providerScore, pressure: 100 - providerScore },
      { layer: "Replay safety", score: replay.averageConfidence, pressure: replay.blockedDeadLetters * 18 },
      { layer: "Operational memory", score: memory.memoryConfidence, pressure: memory.recurrenceSignals * 7 },
      { layer: "Agent mesh", score: mesh.coordinationScore, pressure: mesh.escalationCount * 14 }
    ],
    simulations: simulations.slice(0, 6).map(simulation => ({
      scenario: simulation.title,
      confidence: simulation.confidence,
      projectedEffect: `Reliability ${simulation.projectedImpact.reliabilityDelta > 0 ? "+" : ""}${simulation.projectedImpact.reliabilityDelta}, SLA risk ${simulation.projectedImpact.slaRiskDelta > 0 ? "+" : ""}${simulation.projectedImpact.slaRiskDelta}`
    })),
    stressTests: [
      { name: "Provider outage", result: providerScore < 50 ? "fail" : providerScore < 75 ? "watch" : "pass", detail: `${providerScore}% provider score` },
      { name: "SLA degradation", result: runtime.slaBreaches.length > 3 ? "fail" : runtime.slaBreaches.length ? "watch" : "pass", detail: `${runtime.slaBreaches.length} SLA breaches` },
      { name: "Incident load", result: incidents.length > 5 ? "fail" : incidents.length ? "watch" : "pass", detail: `${incidents.length} incidents` },
      { name: "Forecast pressure", result: forecasts.length > 6 ? "fail" : forecasts.length ? "watch" : "pass", detail: `${forecasts.length} forecasts` }
    ]
  };
}
