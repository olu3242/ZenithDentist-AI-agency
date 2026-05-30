import "server-only";

/**
 * Agent Learning — captures feedback loops to improve ALICE recommendations.
 * Tracks operator decisions and intervention outcomes.
 */

import { logger } from "@/lib/logger";

export interface LearningSignal {
  signalId: string;
  organizationId: string;
  workflowId: string;
  interventionType: string;
  aliceRecommendation: string;
  operatorDecision: "accepted" | "rejected" | "modified";
  outcome: "improved" | "degraded" | "neutral" | "unknown";
  confidence: number;
  timestamp: string;
}

const learningLog: LearningSignal[] = [];

export function recordLearningSignal(signal: LearningSignal): void {
  learningLog.unshift(signal);
  if (learningLog.length > 500) learningLog.splice(500);
  logger.info("agent_learning_signal", signal as unknown as Record<string, unknown>);
}

export function getLearningSignals(opts?: {
  organizationId?: string;
  workflowId?: string;
  limit?: number;
}): LearningSignal[] {
  let signals = [...learningLog];
  if (opts?.organizationId) signals = signals.filter(s => s.organizationId === opts.organizationId);
  if (opts?.workflowId) signals = signals.filter(s => s.workflowId === opts.workflowId);
  return signals.slice(0, opts?.limit ?? 50);
}

export function getAcceptanceRate(organizationId: string): number {
  const signals = getLearningSignals({ organizationId });
  if (signals.length === 0) return 0;
  const accepted = signals.filter(s => s.operatorDecision === "accepted").length;
  return Math.round((accepted / signals.length) * 100);
}
