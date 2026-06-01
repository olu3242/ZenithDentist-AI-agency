import "server-only";

/**
 * ALICE — Operational Intelligence Layer of Zenith AI OS.
 *
 * ALICE is the single AI agent surface for Zenith.  She consumes data from:
 *   - Workflow OS (executions, states, analytics)
 *   - Runtime Kernel (traces, SLA, dead letters, recovery)
 *   - Event Fabric (live platform signals)
 *   - Tenant Context (practice-specific context)
 *   - Mission Control State (operational health)
 *
 * ALICE may:
 *   - Recommend workflow changes
 *   - Recommend escalations, replays, and recovery paths
 *   - Optimize scheduling recommendations
 *   - Generate operational insights and reports
 *
 * ALICE may NOT:
 *   - Execute workflows directly
 *   - Bypass Workflow OS governance
 *   - Modify tenant data without an approved governance record
 *   - Skip audit trails
 */

import { answerOperationalQuery, generateAliceInsights, generateAliceReport } from "@/lib/alice";
import { buildAliceContext, requestAgentIntervention } from "@/lib/ai-os/agent-runtime";
import { coordinateAgents } from "@/lib/ai-os/agent-coordinator";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { logAgentInsight } from "@/lib/ai-os/agent-observability";
import { recordLearningSignal } from "@/lib/ai-os/agent-learning";
import type { InterventionType } from "@/lib/ai-os/agent-governance";

// ─── ALICE Operational Query ────────────────────────────────────────────────

export { answerOperationalQuery as aliceQuery };

// ─── ALICE Insights ─────────────────────────────────────────────────────────

export async function getAliceInsights(organizationId: string) {
  const [rawInsights, analytics, health] = await Promise.all([
    generateAliceInsights(organizationId),
    getWorkflowAnalyticsSummary(),
    getWorkflowRuntimeHealth(),
  ]);

  const groundedInsights = rawInsights.map(insight => ({
    ...insight,
    groundedIn: {
      operationalScore: health.operationalScore,
      successRate: analytics.overallSuccessRate,
      failureRate: analytics.overallFailureRate,
      recoveryScore: health.recoveryScore,
    },
  }));

  for (const insight of groundedInsights.slice(0, 3)) {
    await logAgentInsight({
      agentId: "alice",
      organizationId,
      title: insight.title,
      summary: "summary" in insight ? String(insight.summary) : ("prediction" in insight ? String((insight as { prediction: string }).prediction) : ""),
      confidence: typeof insight.confidence === "number" ? insight.confidence : 0.8,
    });
  }

  return groundedInsights;
}

// ─── ALICE Report Generation ─────────────────────────────────────────────────

export { generateAliceReport as aliceReport };

// ─── ALICE Operational Context ───────────────────────────────────────────────

export async function getAliceOperationalContext(organizationId: string) {
  return buildAliceContext(organizationId);
}

// ─── ALICE Coordination Surface ─────────────────────────────────────────────

export async function aliceCoordinate(organizationId: string) {
  return coordinateAgents(organizationId);
}

// ─── ALICE Intervention Request ─────────────────────────────────────────────

export async function aliceRequestIntervention(opts: {
  interventionType: InterventionType;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  reason: string;
  confidence: number;
}) {
  return requestAgentIntervention(opts);
}

// ─── ALICE Learning Feedback ─────────────────────────────────────────────────

export function aliceRecordFeedback(opts: {
  signalId: string;
  organizationId: string;
  workflowId: string;
  interventionType: string;
  recommendation: string;
  operatorDecision: "accepted" | "rejected" | "modified";
  outcome: "improved" | "degraded" | "neutral" | "unknown";
  confidence: number;
}) {
  recordLearningSignal({
    ...opts,
    aliceRecommendation: opts.recommendation,
    timestamp: new Date().toISOString(),
  });
}

// ─── ALICE Workflow Recommendations ─────────────────────────────────────────

export interface AliceWorkflowRecommendation {
  workflowId: string;
  recommendationType: "optimize_schedule" | "replay" | "escalate" | "pause" | "resume";
  rationale: string;
  confidence: number;
  priority: "low" | "moderate" | "high" | "critical";
  requiresApproval: boolean;
}

export async function getAliceWorkflowRecommendations(
  organizationId: string
): Promise<AliceWorkflowRecommendation[]> {
  const [health, analytics] = await Promise.all([
    getWorkflowRuntimeHealth(),
    getWorkflowAnalyticsSummary(),
  ]);

  const recommendations: AliceWorkflowRecommendation[] = [];

  // Recommend replays for failed workflows with recovery potential
  for (const kpi of analytics.workflowKpis.filter(k => k.failureRate > 20)) {
    recommendations.push({
      workflowId: kpi.workflowId,
      recommendationType: "replay",
      rationale: `${kpi.workflowId} has ${kpi.failureRate}% failure rate. Replay candidates available.`,
      confidence: 0.82,
      priority: kpi.failureRate > 40 ? "high" : "moderate",
      requiresApproval: true,
    });
  }

  // Recommend escalation for SLA breaches
  for (const kpi of analytics.workflowKpis.filter(k => k.slaBreachCount > 0)) {
    recommendations.push({
      workflowId: kpi.workflowId,
      recommendationType: "escalate",
      rationale: `${kpi.workflowId} has ${kpi.slaBreachCount} SLA breaches. Escalation advised.`,
      confidence: 0.88,
      priority: "high",
      requiresApproval: false,
    });
  }

  // Recommend schedule optimization for high-latency workflows
  for (const state of health.workflowStates.filter(s => (s.lastExecutionMs ?? 0) > 30000)) {
    recommendations.push({
      workflowId: state.workflowId,
      recommendationType: "optimize_schedule",
      rationale: `${state.workflowId} avg execution ${Math.round((state.lastExecutionMs ?? 0) / 1000)}s. Schedule optimization may improve throughput.`,
      confidence: 0.74,
      priority: "moderate",
      requiresApproval: false,
    });
  }

  // Log ALICE insights for top recommendations
  for (const rec of recommendations.slice(0, 5)) {
    await logAgentInsight({
      agentId: "alice",
      organizationId,
      title: `ALICE: ${rec.recommendationType} — ${rec.workflowId}`,
      summary: rec.rationale,
      confidence: rec.confidence,
    });
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}
