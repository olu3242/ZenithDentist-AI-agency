import type { Json } from "@/lib/database.types";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { calculatePracticeHealth } from "@/lib/health";

export interface OperationalPlaybook {
  id: string;
  name: string;
  category: string;
  triggerConditions: string[];
  operationalGoals: string[];
  recommendedActions: string[];
  expectedOutcomes: Record<string, string>;
  rollbackLogic: string[];
  approvalFlow: string[];
  confidence: number;
}

export interface SimulationInput {
  reminderTimingDelta?: number;
  recallCadenceDelta?: number;
  staffingDelta?: number;
  reviewTimingDelta?: number;
}

export function getAutonomousPlaybooks(): OperationalPlaybook[] {
  return [
    playbook("no-show-recovery", "No-show Recovery Playbook", "schedule_stability", ["No-show rate above 10%", "Confirmation rate below 88%"], ["Stabilize schedule", "Protect chair utilization"], ["Move reminders earlier", "Add same-morning confirmation", "Escalate high-value unconfirmed visits"], { revenue: "+$3.8K monthly", noShows: "-4.2%" }, ["Restore prior timing", "Pause escalation"], ["Manager review", "Owner approval"], 0.86),
    playbook("recall-recovery", "Recall Recovery Playbook", "patient_retention", ["Recall recovery below benchmark", "180-day lapsed segment growing"], ["Recover inactive patients", "Increase retention"], ["Prioritize high-value recall patients", "Add second-touch sequence", "Offer reserved hygiene blocks"], { revenue: "+$5.4K monthly", retention: "+9%" }, ["Return to baseline cadence"], ["Manager review"], 0.83),
    playbook("review-acceleration", "Review Acceleration Playbook", "reputation", ["Review conversion below benchmark"], ["Increase review velocity", "Improve local proof"], ["Send requests within two hours", "Route satisfied patients to public review"], { reviews: "+12 monthly" }, ["Revert timing"], ["Owner approval"], 0.79),
    playbook("staffing-optimization", "Staffing Optimization Playbook", "capacity", ["Admin load rising", "Delivery failures increasing"], ["Reduce operational drag", "Balance front desk load"], ["Batch non-critical alerts", "Reassign confirmation follow-up windows"], { efficiency: "+14 hours saved" }, ["Restore alert cadence"], ["Manager review"], 0.77)
  ];
}

export async function runOperationalSimulation(input: SimulationInput) {
  const portalData = await getPortalData();
  const latest = portalData.metrics[0];
  const timingLift = (input.reminderTimingDelta ?? 0) * 0.8;
  const recallLift = (input.recallCadenceDelta ?? 0) * 1.1;
  const staffingLift = (input.staffingDelta ?? 0) * 4;
  const reviewLift = (input.reviewTimingDelta ?? 0) * 0.7;

  return {
    projectedRevenueImpact: Math.round(Number(latest?.recovered_revenue ?? 0) * 0.08 + recallLift * 310),
    projectedNoShowReduction: Math.max(0, Math.round((timingLift + 2.4) * 10) / 10),
    projectedRetentionChange: Math.round((recallLift + 5.2) * 10) / 10,
    projectedStaffingLoad: Math.max(0, Math.round((100 - staffingLift - 18) * 10) / 10),
    projectedEfficiency: Math.round((Number(latest?.admin_hours_saved ?? 0) + staffingLift + reviewLift) * 10) / 10,
    confidence: 0.81
  };
}

export async function getAutonomousEngineState() {
  const [portalData, tenantData] = await Promise.all([getPortalData(), getTenantData()]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  const playbooks = getAutonomousPlaybooks();
  return {
    health,
    playbooks,
    confidence: Math.round((health.overall + health.benchmarkPercentile) / 2),
    approvalQueue: playbooks.slice(0, 3).map(item => ({
      id: `approval-${item.id}`,
      title: item.name,
      summary: item.recommendedActions[0],
      status: "pending",
      confidence: item.confidence
    })),
    timeline: [
      { id: "timeline-1", title: "Recall opportunity detected", type: "recommendation", severity: "success", createdAt: new Date().toISOString() },
      { id: "timeline-2", title: "Wednesday cancellation risk forecast updated", type: "prediction", severity: "warning", createdAt: new Date().toISOString() },
      { id: "timeline-3", title: "Review timing optimization awaiting approval", type: "approval", severity: "info", createdAt: new Date().toISOString() }
    ] as Array<{ id: string; title: string; type: string; severity: string; createdAt: string }>
  };
}

function playbook(
  id: string,
  name: string,
  category: string,
  triggerConditions: string[],
  operationalGoals: string[],
  recommendedActions: string[],
  expectedOutcomes: Record<string, string>,
  rollbackLogic: string[],
  approvalFlow: string[],
  confidence: number
): OperationalPlaybook {
  return { id, name, category, triggerConditions, operationalGoals, recommendedActions, expectedOutcomes, rollbackLogic, approvalFlow, confidence };
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
