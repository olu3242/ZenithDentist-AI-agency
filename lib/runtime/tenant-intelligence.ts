import "server-only";

import { getClientOperationsState } from "@/lib/client-operations";
import { getGovernanceState } from "@/lib/runtime/governance";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getProviderHealth } from "@/lib/runtime/provider-health";

export interface TenantIntelligenceState {
  organizationName: string;
  operationalMaturity: number;
  runtimeReliability: number;
  slaConfidence: number;
  providerDependencyScore: number;
  operationalRisk: number;
  benchmarkPercentiles: Array<{ label: string; percentile: number; detail: string }>;
  recommendations: string[];
}

export async function getTenantIntelligenceState(): Promise<TenantIntelligenceState> {
  const [client, runtime, providers, governance] = await Promise.all([
    getClientOperationsState(),
    getRuntimeHealthState(),
    getProviderHealth(),
    getGovernanceState()
  ]);
  const providerDependencyScore = providers.length ? Math.round(providers.reduce((sum, provider) => sum + provider.uptimeScore, 0) / providers.length) : 0;
  const operationalRisk = Math.max(0, 100 - Math.round((runtime.scores.operationalScore + governance.trustScore + providerDependencyScore) / 3));
  return {
    organizationName: client.organization.name,
    operationalMaturity: client.scores.automationMaturityScore,
    runtimeReliability: runtime.scores.reliabilityScore,
    slaConfidence: client.scores.slaCompliance,
    providerDependencyScore,
    operationalRisk,
    benchmarkPercentiles: [
      { label: "Operational maturity", percentile: percentile(client.scores.automationMaturityScore), detail: "Anonymous tenant benchmark prep" },
      { label: "Workflow reliability", percentile: percentile(runtime.scores.reliabilityScore), detail: "Runtime success and retry pressure" },
      { label: "SLA reliability", percentile: percentile(client.scores.slaCompliance), detail: "Timing discipline against active traces" },
      { label: "Operational trust", percentile: percentile(governance.trustScore), detail: "Governance and replay safety posture" }
    ],
    recommendations: [
      operationalRisk > 45 ? "Resolve high-risk replay approvals before increasing runtime volume." : "Current tenant posture supports controlled runtime expansion.",
      providerDependencyScore < 60 ? "Review dependency exposure and fallback readiness." : "Provider confidence is sufficient for the current operating window.",
      governance.pendingApprovals ? `${governance.pendingApprovals} governance decisions require executive review.` : "No pending governance decisions require review."
    ]
  };
}

function percentile(score: number) {
  return Math.max(5, Math.min(95, Math.round(score * 0.82 + 8)));
}
