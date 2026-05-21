import "server-only";

import type { AgentMessagePriority, OperationalAgentStatus, RuntimeActionRisk } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getGovernanceState } from "@/lib/runtime/governance";
import { getRuntimeIncidents } from "@/lib/runtime/incident-management";
import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";
import { getTenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";

export interface OperationalAgent {
  key: string;
  name: string;
  type: string;
  status: OperationalAgentStatus;
  confidence: number;
  responsibilities: string[];
  currentSignal: string;
  riskLevel: RuntimeActionRisk;
}

export interface AgentBusMessage {
  id: string;
  sourceAgentKey: string;
  targetAgentKey: string | null;
  messageType: string;
  priority: AgentMessagePriority;
  summary: string;
}

export interface SwarmConsensus {
  consensusKey: string;
  participatingAgents: string[];
  consensusScore: number;
  recommendedAction: string;
  riskLevel: RuntimeActionRisk;
}

export interface OperationalMeshState {
  organizationId: string;
  agents: OperationalAgent[];
  busMessages: AgentBusMessage[];
  consensus: SwarmConsensus[];
  coordinationScore: number;
  escalationCount: number;
}

export async function getOperationalMeshState(): Promise<OperationalMeshState> {
  const [tenant, runtime, providers, forecasts, governance, recovery, memory, tenantIntelligence, incidents] = await Promise.all([
    getTenantData(),
    getRuntimeHealthState(),
    getProviderHealth(),
    generateRuntimeForecasts(),
    getGovernanceState(),
    getAutonomousRecoveryState(),
    getOperationalMemoryState(),
    getTenantIntelligenceState(),
    getRuntimeIncidents()
  ]);
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const replay = buildReplayCenterState(runtime);
  const agents: OperationalAgent[] = [
    agent("runtime_monitor", "Runtime Monitoring Agent", "monitoring", runtime.scores.operationalScore < 60 ? "escalating" : "active", runtime.scores.operationalScore, ["runtime health", "trace pressure", "SLA transitions"], `${runtime.traces.length} traces observed`, risk(runtime.scores.operationalScore)),
    agent("sla_defense", "SLA Defense Agent", "sla", runtime.slaBreaches.length ? "coordinating" : "watching", 100 - runtime.slaBreaches.length * 10, ["SLA defense", "breach prediction", "timing protection"], `${runtime.slaBreaches.length} SLA threats`, runtime.slaBreaches.length ? "high" : "low"),
    agent("replay_recovery", "Replay Recovery Agent", "replay", replay.candidates.length ? "coordinating" : "watching", replay.averageConfidence, ["replay confidence", "rollback safety", "recovery sequencing"], `${replay.candidates.length} replay candidates`, replay.blockedDeadLetters ? "critical" : replay.candidates.length ? "high" : "low"),
    agent("incident_analysis", "Incident Analysis Agent", "incident", incidents.length ? "escalating" : "watching", Math.max(30, 100 - incidents.length * 12), ["incident correlation", "mitigation tracking", "root cause"], `${incidents.length} incidents`, incidents.some(item => item.severity === "critical") ? "critical" : incidents.length ? "high" : "low"),
    agent("provider_health", "Provider Health Agent", "provider", providers.some(item => item.status === "down") ? "escalating" : providers.some(item => item.status === "degraded") ? "coordinating" : "watching", providerConfidence(providers), ["provider stability", "dependency impact", "fallback readiness"], `${providers.filter(item => item.status !== "unknown").length} providers observed`, providers.some(item => item.status === "down") ? "critical" : providers.some(item => item.status === "degraded") ? "high" : "low"),
    agent("queue_optimization", "Queue Optimization Agent", "queue", runtime.domainHealth.some(item => item.retryRate > 1) ? "coordinating" : "watching", Math.max(20, 100 - runtime.domainHealth.reduce((sum, item) => sum + item.retryRate, 0) * 8), ["queue balancing", "retry pressure", "runtime load"], "Queue pressure derived from retry density", runtime.domainHealth.some(item => item.retryRate > 2) ? "high" : "moderate"),
    agent("tenant_intelligence", "Tenant Intelligence Agent", "tenant", tenantIntelligence.operationalRisk > 45 ? "coordinating" : "active", 100 - tenantIntelligence.operationalRisk, ["tenant isolation", "tenant scoring", "benchmark readiness"], `${tenantIntelligence.organizationName} risk ${tenantIntelligence.operationalRisk}`, tenantIntelligence.operationalRisk > 60 ? "critical" : tenantIntelligence.operationalRisk > 35 ? "high" : "low"),
    agent("forecasting", "Forecasting Agent", "forecast", forecasts.length ? "coordinating" : "watching", forecasts[0]?.probability ?? 70, ["runtime forecasts", "threat prediction", "drift analysis"], `${forecasts.length} forecasts generated`, forecasts.some(item => item.impact === "CRITICAL") ? "critical" : forecasts.length ? "high" : "low"),
    agent("governance", "Governance Agent", "governance", governance.pendingApprovals ? "coordinating" : "active", governance.trustScore, ["policy controls", "approval chains", "auditability"], `${governance.pendingApprovals} approvals pending`, governance.pendingApprovals > 3 ? "high" : "moderate"),
    agent("executive_reporting", "Executive Reporting Agent", "executive", "active", runtime.scores.observabilityScore, ["executive summaries", "business impact", "operational roadmap"], "Executive intelligence synchronized", "low"),
    agent("operational_memory", "Operational Memory Agent", "memory", memory.recurrenceSignals ? "coordinating" : "watching", memory.memoryConfidence || 65, ["memory grid", "recurring patterns", "recovery history"], `${memory.recurrenceSignals} memory signals`, memory.recurrenceSignals > 6 ? "high" : "moderate"),
    agent("workflow_optimization", "Workflow Optimization Agent", "workflow", runtime.degradedWorkflows.length ? "coordinating" : "watching", Math.max(20, 100 - runtime.degradedWorkflows.length * 10), ["workflow reliability", "bottleneck ranking", "optimization"], `${runtime.degradedWorkflows.length} degraded workflows`, runtime.degradedWorkflows.length > 3 ? "high" : "moderate"),
    agent("runtime_resilience", "Runtime Resilience Agent", "resilience", recovery.resilienceScore < 65 ? "escalating" : "active", recovery.resilienceScore, ["resilience scoring", "self-healing readiness", "rollback safety"], `${recovery.safeToExecuteCount} safe recovery paths`, recovery.approvalRequiredCount > 4 ? "high" : "moderate"),
    agent("operational_prediction", "Operational Prediction Agent", "prediction", forecasts.length ? "coordinating" : "watching", forecasts[0]?.probability ?? 60, ["incident likelihood", "replay probability", "operational drift"], "Prediction layer active", forecasts.length > 5 ? "high" : "moderate"),
    agent("client_operations", "Client Operations Agent", "client", tenantIntelligence.operationalRisk > 45 ? "coordinating" : "active", tenantIntelligence.operationalMaturity, ["client scoring", "operational ROI", "client recommendations"], `${tenantIntelligence.operationalMaturity}% maturity`, tenantIntelligence.operationalRisk > 45 ? "high" : "low")
  ];
  const busMessages = buildBusMessages(agents);
  const consensus = buildConsensus(agents, recovery.recoveryPlans.length);
  return {
    organizationId,
    agents,
    busMessages,
    consensus,
    coordinationScore: Math.round(agents.reduce((sum, item) => sum + item.confidence, 0) / agents.length),
    escalationCount: agents.filter(item => item.status === "escalating").length
  };
}

function agent(key: string, name: string, type: string, status: OperationalAgentStatus, confidence: number, responsibilities: string[], currentSignal: string, riskLevel: RuntimeActionRisk): OperationalAgent {
  return { key, name, type, status, confidence: Math.max(0, Math.min(100, Math.round(confidence))), responsibilities, currentSignal, riskLevel };
}

function buildBusMessages(agents: OperationalAgent[]): AgentBusMessage[] {
  return agents
    .filter(agent => agent.status === "coordinating" || agent.status === "escalating")
    .slice(0, 10)
    .map((agent, index) => ({
      id: `bus-${agent.key}-${index}`,
      sourceAgentKey: agent.key,
      targetAgentKey: agent.riskLevel === "critical" ? "governance" : "runtime_resilience",
      messageType: agent.riskLevel === "critical" ? "escalation_signal" : "coordination_signal",
      priority: agent.riskLevel,
      summary: `${agent.name} broadcasting ${agent.currentSignal.toLowerCase()}.`
    }));
}

function buildConsensus(agents: OperationalAgent[], recoveryPlanCount: number): SwarmConsensus[] {
  const highRiskAgents = agents.filter(agent => agent.riskLevel === "high" || agent.riskLevel === "critical");
  return [
    {
      consensusKey: "runtime_resilience_consensus",
      participatingAgents: ["runtime_monitor", "runtime_resilience", "governance", "forecasting"],
      consensusScore: Math.max(45, 100 - highRiskAgents.length * 6),
      recommendedAction: recoveryPlanCount ? "Prioritize rollback-safe recovery paths before expanding runtime load." : "Continue monitoring and preserve current SLA posture.",
      riskLevel: highRiskAgents.length > 5 ? "critical" : highRiskAgents.length > 2 ? "high" : "moderate"
    },
    {
      consensusKey: "executive_cloud_consensus",
      participatingAgents: ["executive_reporting", "tenant_intelligence", "operational_memory", "provider_health"],
      consensusScore: Math.max(50, Math.round(agents.reduce((sum, agent) => sum + agent.confidence, 0) / agents.length)),
      recommendedAction: "Maintain executive operational visibility across tenant risk, provider stability, and memory signals.",
      riskLevel: "moderate"
    }
  ];
}

function providerConfidence(providers: Array<{ uptimeScore: number }>) {
  return providers.length ? Math.round(providers.reduce((sum, item) => sum + item.uptimeScore, 0) / providers.length) : 0;
}

function risk(score: number): RuntimeActionRisk {
  if (score < 45) return "critical";
  if (score < 65) return "high";
  if (score < 80) return "moderate";
  return "low";
}
