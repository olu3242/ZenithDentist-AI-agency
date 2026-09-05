import "server-only";

export type FlowPriorityBand = "low" | "medium" | "high" | "critical";
export type FlowRecommendedAction = "observe" | "approve" | "review_approval" | "retry" | "resume_wait" | "investigate" | "cancel_review";

export interface FlowIntelligenceInput {
  status: string;
  currentStepKey: string | null;
  ageMinutes: number;
  health: "healthy" | "attention" | "critical";
  failedSteps: number;
  activeWaits: number;
  approvalWaits: number;
  retryWaits: number;
  eventWaits: number;
  retryCount: number;
  workflowExecutionCount: number;
  operatorActionCount: number;
  input?: unknown;
  context?: unknown;
}

export interface FlowIntelligence {
  modelVersion: "flow-intelligence-v1";
  priorityScore: number;
  priorityBand: FlowPriorityBand;
  slaRiskPercent: number;
  revenueImpactEstimate: number;
  anomalyScore: number;
  anomalies: string[];
  recommendedAction: FlowRecommendedAction;
  recommendation: string;
  rationale: string[];
  confidence: number;
  requiresHumanApproval: true;
}

export function evaluateFlowIntelligence(input: FlowIntelligenceInput): FlowIntelligence {
  const revenueImpactEstimate = extractRevenueImpact(input.input, input.context);
  const anomalies = detectAnomalies(input);
  const anomalyScore = clamp(
    anomalies.length * 18 +
      Math.min(25, input.failedSteps * 12) +
      Math.min(20, input.retryCount * 8) +
      (input.status === "blocked" ? 25 : 0),
    0,
    100
  );

  const slaRiskPercent = clamp(
    Math.round(
      Math.min(50, input.ageMinutes / 2) +
        (input.health === "critical" ? 30 : input.health === "attention" ? 15 : 0) +
        input.activeWaits * 6 +
        input.retryCount * 8 +
        input.failedSteps * 10
    ),
    0,
    100
  );

  const revenueWeight = revenueImpactEstimate <= 0 ? 0 : Math.min(25, Math.log10(revenueImpactEstimate + 1) * 6);
  const priorityScore = clamp(
    Math.round(
      (input.health === "critical" ? 35 : input.health === "attention" ? 18 : 4) +
        Math.min(20, input.ageMinutes / 6) +
        Math.min(15, input.failedSteps * 8 + input.retryCount * 4) +
        Math.min(12, input.activeWaits * 4) +
        revenueWeight
    ),
    0,
    100
  );

  const priorityBand: FlowPriorityBand = priorityScore >= 80 ? "critical" : priorityScore >= 60 ? "high" : priorityScore >= 35 ? "medium" : "low";
  const recommendedAction = chooseRecommendedAction(input);
  const rationale = buildRationale(input, revenueImpactEstimate, anomalies, slaRiskPercent);

  return {
    modelVersion: "flow-intelligence-v1",
    priorityScore,
    priorityBand,
    slaRiskPercent,
    revenueImpactEstimate,
    anomalyScore,
    anomalies,
    recommendedAction,
    recommendation: recommendationText(recommendedAction, input),
    rationale,
    confidence: confidenceScore(input, revenueImpactEstimate, anomalies),
    requiresHumanApproval: true
  };
}

function chooseRecommendedAction(input: FlowIntelligenceInput): FlowRecommendedAction {
  if (input.approvalWaits > 0) return input.health === "critical" ? "review_approval" : "approve";
  if (input.status === "failed" || input.status === "blocked" || input.retryWaits > 0 || input.retryCount > 0) return "retry";
  if (input.eventWaits > 0) return "resume_wait";
  if (input.health === "critical" || input.failedSteps > 0) return "investigate";
  if (input.ageMinutes >= 240 && input.workflowExecutionCount === 0) return "cancel_review";
  return "observe";
}

function recommendationText(action: FlowRecommendedAction, input: FlowIntelligenceInput) {
  switch (action) {
    case "approve":
      return `Review and approve the ${humanize(input.currentStepKey ?? "current")} governance gate if evidence is complete.`;
    case "review_approval":
      return `Prioritize human review of the ${humanize(input.currentStepKey ?? "current")} approval gate; SLA risk is elevated.`;
    case "retry":
      return "Review the last failure evidence and, if the dependency is healthy, create a governed retry attempt.";
    case "resume_wait":
      return "Verify the expected external event before using an operator resume override.";
    case "investigate":
      return "Inspect execution lineage and Runtime OS evidence before changing orchestration state.";
    case "cancel_review":
      return "Review whether this inactive flow should be cancelled rather than left consuming operator attention.";
    default:
      return "No intervention recommended. Continue monitoring the flow and its SLA trajectory.";
  }
}

function buildRationale(input: FlowIntelligenceInput, revenueImpact: number, anomalies: string[], slaRiskPercent: number) {
  const rationale: string[] = [];
  if (input.health !== "healthy") rationale.push(`Flow health is ${input.health}.`);
  if (input.ageMinutes >= 30) rationale.push(`Flow has been active for ${input.ageMinutes} minutes.`);
  if (input.failedSteps > 0) rationale.push(`${input.failedSteps} failed step attempt${input.failedSteps === 1 ? "" : "s"} detected.`);
  if (input.activeWaits > 0) rationale.push(`${input.activeWaits} active wait${input.activeWaits === 1 ? "" : "s"} remain unresolved.`);
  if (input.retryCount > 0) rationale.push(`${input.retryCount} retry-scheduled attempt${input.retryCount === 1 ? "" : "s"} detected.`);
  if (revenueImpact > 0) rationale.push(`Estimated business value at risk: $${Math.round(revenueImpact).toLocaleString()}.`);
  if (anomalies.length) rationale.push(`Anomaly signals: ${anomalies.join(", ")}.`);
  rationale.push(`Predicted SLA-risk score is ${slaRiskPercent}%.`);
  return rationale;
}

function detectAnomalies(input: FlowIntelligenceInput) {
  const anomalies: string[] = [];
  if (input.ageMinutes >= 120 && !["succeeded", "failed", "cancelled"].includes(input.status)) anomalies.push("prolonged_runtime");
  if (input.retryCount >= 2) anomalies.push("retry_churn");
  if (input.failedSteps >= 2) anomalies.push("repeated_step_failure");
  if (input.activeWaits >= 2) anomalies.push("multiple_concurrent_waits");
  if (input.approvalWaits > 0 && input.ageMinutes >= 60) anomalies.push("approval_bottleneck");
  if (input.workflowExecutionCount >= 5 && input.failedSteps > 0) anomalies.push("execution_churn");
  if (input.operatorActionCount >= 4 && !["succeeded", "cancelled"].includes(input.status)) anomalies.push("operator_intervention_churn");
  return anomalies;
}

function extractRevenueImpact(...values: unknown[]) {
  const candidates: number[] = [];
  for (const value of values) collectRevenueCandidates(value, candidates, 0);
  if (!candidates.length) return 0;
  return Math.max(...candidates.filter(Number.isFinite).map(value => Math.max(0, value)));
}

function collectRevenueCandidates(value: unknown, candidates: number[], depth: number) {
  if (depth > 4 || value == null) return;
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 30)) collectRevenueCandidates(item, candidates, depth + 1);
    return;
  }
  if (typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const looksFinancial = ["revenue", "recovery", "opportunity", "amount", "value", "production"].some(token => normalized.includes(token));
    if (looksFinancial && typeof child === "number" && Number.isFinite(child)) candidates.push(child);
    else if (looksFinancial && typeof child === "string") {
      const parsed = Number(child.replace(/[$,]/g, ""));
      if (Number.isFinite(parsed)) candidates.push(parsed);
    }
    collectRevenueCandidates(child, candidates, depth + 1);
  }
}

function confidenceScore(input: FlowIntelligenceInput, revenueImpact: number, anomalies: string[]) {
  let score = 62;
  if (input.workflowExecutionCount > 0) score += 8;
  if (input.activeWaits > 0 || input.failedSteps > 0) score += 8;
  if (revenueImpact > 0) score += 8;
  if (anomalies.length > 0) score += 6;
  return clamp(score, 50, 92);
}

function humanize(value: string) {
  return value.replace(/_v\d+$/i, "").replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
