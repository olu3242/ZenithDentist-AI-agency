import "server-only";

import { getOperationalMeshState } from "@/lib/runtime/agent-mesh";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getOperationalCognitionState } from "@/lib/runtime/operational-cognition";
import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { getTenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";

export interface InfrastructureAwarenessState {
  globalHealthScore: number;
  ecosystemPressure: number;
  providerEcosystem: Array<{ providerKey: string; status: string; score: number; impact: number }>;
  tenantPatterns: Array<{ label: string; score: number; direction: "improving" | "stable" | "watch" }>;
  orchestrationBottlenecks: Array<{ title: string; severity: string; recommendation: string }>;
}

export interface ExecutiveIntelligenceCloudState {
  summary: string;
  roadmaps: string[];
  resilienceStrategy: string;
  governanceStrategy: string;
  ecosystemRecommendations: string[];
}

export async function getInfrastructureAwarenessState(): Promise<InfrastructureAwarenessState> {
  const [runtime, providers, forecasts, tenant, mesh] = await Promise.all([
    getRuntimeHealthState(),
    getProviderHealth(),
    generateRuntimeForecasts(),
    getTenantIntelligenceState(),
    getOperationalMeshState()
  ]);
  const providerAverage = providers.length ? Math.round(providers.reduce((sum, provider) => sum + provider.uptimeScore, 0) / providers.length) : 0;
  const globalHealthScore = Math.round((runtime.scores.operationalScore + providerAverage + tenant.operationalMaturity + mesh.coordinationScore) / 4);
  return {
    globalHealthScore,
    ecosystemPressure: Math.max(0, 100 - globalHealthScore + forecasts.length * 3 + mesh.escalationCount * 6),
    providerEcosystem: providers.map(provider => ({
      providerKey: provider.providerKey,
      status: provider.status,
      score: provider.uptimeScore,
      impact: provider.dependencyImpact
    })),
    tenantPatterns: [
      { label: "Runtime reliability", score: tenant.runtimeReliability, direction: tenant.runtimeReliability > 80 ? "improving" : tenant.runtimeReliability > 60 ? "stable" : "watch" },
      { label: "SLA confidence", score: tenant.slaConfidence, direction: tenant.slaConfidence > 85 ? "improving" : tenant.slaConfidence > 65 ? "stable" : "watch" },
      { label: "Operational maturity", score: tenant.operationalMaturity, direction: tenant.operationalMaturity > 80 ? "improving" : tenant.operationalMaturity > 60 ? "stable" : "watch" }
    ],
    orchestrationBottlenecks: forecasts.slice(0, 5).map(forecast => ({
      title: forecast.title,
      severity: forecast.impact,
      recommendation: forecast.recommendation
    }))
  };
}

export async function getExecutiveIntelligenceCloudState(): Promise<ExecutiveIntelligenceCloudState> {
  const [awareness, cognition, recovery, memory, mesh] = await Promise.all([
    getInfrastructureAwarenessState(),
    getOperationalCognitionState(),
    getAutonomousRecoveryState(),
    getOperationalMemoryState(),
    getOperationalMeshState()
  ]);
  return {
    summary: `Enterprise operational cloud health is ${awareness.globalHealthScore}/100 with ${mesh.agents.length} operational agents and ${memory.recurrenceSignals} memory signals feeding cognition.`,
    roadmaps: cognition.executiveRoadmap,
    resilienceStrategy: recovery.resilienceScore < 70
      ? "Prioritize rollback-safe recovery, governance approvals, and SLA defense before runtime expansion."
      : "Extend runtime infrastructure coverage while preserving governance guardrails.",
    governanceStrategy: mesh.escalationCount
      ? "Escalating agents should route through policy-controlled approvals and audit history."
      : "Current governance posture supports controlled autonomous recovery.",
    ecosystemRecommendations: [
      awareness.ecosystemPressure > 60 ? "Reduce ecosystem pressure by sequencing provider and replay recovery actions." : "Maintain distributed runtime observation and memory capture.",
      "Promote repeated recovery outcomes into runtime policy improvements.",
      "Use digital twin simulations before approving high-risk orchestration changes."
    ]
  };
}
