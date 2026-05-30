import "server-only";

/**
 * AI OS — barrel export.
 *
 * ALICE is the Operational Intelligence Layer.
 * AI OS sits above Workflow OS in the Zenith platform stack.
 *
 * Stack:
 *   Supabase → Runtime Kernel → Workflow OS → AI OS → Apps
 */

export { routeToAgent } from "@/lib/ai-os/agent-router";
export { buildAliceContext, requestAliceAnswer, requestAgentIntervention } from "@/lib/ai-os/agent-runtime";
export { getAgentMemory, recordAgentDecision } from "@/lib/ai-os/agent-memory";
export { coordinateAgents } from "@/lib/ai-os/agent-coordinator";
export { evaluateIntervention, canAutoApprove } from "@/lib/ai-os/agent-governance";
export { logAgentIntervention, logAgentInsight } from "@/lib/ai-os/agent-observability";
export { recordLearningSignal, getLearningSignals, getAcceptanceRate } from "@/lib/ai-os/agent-learning";

export type { AgentId, AgentRoutingRequest } from "@/lib/ai-os/agent-router";
export type { AgentInterventionResult } from "@/lib/ai-os/agent-runtime";
export type { InterventionType, AgentInterventionRequest, AgentInterventionDecision } from "@/lib/ai-os/agent-governance";
export type { AgentInterventionLog } from "@/lib/ai-os/agent-observability";
export type { LearningSignal } from "@/lib/ai-os/agent-learning";
