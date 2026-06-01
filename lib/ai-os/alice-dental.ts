import "server-only";

/**
 * ALICE Dental Intelligence Extension
 *
 * Extends the ALICE operational layer with dental domain knowledge.
 * Grounds every answer in live data from ROI Engine + Workflow Analytics.
 * Does NOT duplicate ALICE — imports from the existing layer.
 */

import { getAliceInsights, getAliceWorkflowRecommendations } from "@/lib/ai-os/alice";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { computeTenantRoi } from "@/lib/roi-os/roi-engine";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DentalIntelligenceQuery {
  organizationId: string;
  question:
    | "revenue_recovered"
    | "revenue_opportunities"
    | "recall_performance"
    | "declining_kpi"
    | "next_workflow"
    | "patient_risk"
    | "highest_roi_workflow";
}

export interface DentalIntelligenceAnswer {
  question: string;
  answer: string;
  supportingData: Record<string, unknown>;
  confidence: number;
  recommendedAction?: string;
}

// ─── Core Query Engine ───────────────────────────────────────────────────────

export async function answerDentalQuery(
  query: DentalIntelligenceQuery
): Promise<DentalIntelligenceAnswer> {
  const { organizationId, question } = query;

  const [roi, analytics] = await Promise.all([
    computeTenantRoi(organizationId),
    getWorkflowAnalyticsSummary(),
  ]);

  const kpiMap = Object.fromEntries(analytics.workflowKpis.map(k => [k.workflowId, k]));

  switch (question) {
    case "revenue_recovered": {
      const val = roi.revenueRecovered;
      return {
        question,
        answer: `$${val.toLocaleString()} in revenue has been recovered this period through automated recall and reactivation workflows.`,
        supportingData: {
          revenueRecovered: roi.revenueRecovered,
          totalRoiUsd: roi.totalRoiUsd,
          roiMultiple: roi.roiMultiple,
          period: roi.period,
        },
        confidence: 0.92,
        recommendedAction:
          val < 1000
            ? "Enable recall_due and reactivation_candidate_detected workflows to increase recovery."
            : "Maintain current recall cadence to sustain recovery rate.",
      };
    }

    case "revenue_opportunities": {
      const recallKpi = kpiMap["recall_due"];
      const reactivationKpi = kpiMap["reactivation_candidate_detected"];
      const recallMissed = recallKpi
        ? Math.round(recallKpi.failureRate * recallKpi.totalExecutions * 2.5)
        : 0;
      const reactivationMissed = reactivationKpi
        ? Math.round(reactivationKpi.failureRate * reactivationKpi.totalExecutions * 2.8)
        : 0;
      const total = recallMissed + reactivationMissed;
      return {
        question,
        answer: `Estimated $${total.toLocaleString()} in untapped revenue opportunities detected across recall and reactivation workflows.`,
        supportingData: {
          recallOpportunityUsd: recallMissed,
          reactivationOpportunityUsd: reactivationMissed,
          totalOpportunityUsd: total,
          recallFailureRate: recallKpi?.failureRate ?? 0,
          reactivationFailureRate: reactivationKpi?.failureRate ?? 0,
        },
        confidence: 0.78,
        recommendedAction:
          total > 5000
            ? "Prioritize fixing recall_due failure rate — highest revenue recovery potential."
            : "Revenue leakage is minimal. Focus on review generation.",
      };
    }

    case "recall_performance": {
      const recallKpi = kpiMap["recall_due"];
      const rate = recallKpi?.successRate ?? 0;
      return {
        question,
        answer: `Recall workflow is performing at ${rate}% success rate with ${recallKpi?.totalExecutions ?? 0} total executions this period.`,
        supportingData: {
          successRate: recallKpi?.successRate ?? 0,
          failureRate: recallKpi?.failureRate ?? 0,
          totalExecutions: recallKpi?.totalExecutions ?? 0,
          slaBreachCount: recallKpi?.slaBreachCount ?? 0,
          recoveryRate: recallKpi?.recoveryRate ?? 0,
        },
        confidence: 0.91,
        recommendedAction:
          rate < 70
            ? "Recall success rate is below threshold. Review scheduling configuration and patient contact data quality."
            : "Recall performance is healthy. Consider increasing send frequency for overdue patients.",
      };
    }

    case "declining_kpi": {
      const declining = analytics.workflowKpis
        .filter(k => k.failureRate > 20)
        .sort((a, b) => b.failureRate - a.failureRate)
        .slice(0, 3);
      const top = declining[0];
      return {
        question,
        answer:
          declining.length > 0
            ? `${declining.length} workflow(s) show declining KPIs. Worst performer: ${top?.workflowId ?? "none"} at ${top?.failureRate ?? 0}% failure rate.`
            : "No workflows are currently showing declining KPIs.",
        supportingData: {
          decliningWorkflows: declining.map(k => ({
            workflowId: k.workflowId,
            failureRate: k.failureRate,
            slaBreachCount: k.slaBreachCount,
          })),
          overallFailureRate: analytics.overallFailureRate,
        },
        confidence: 0.87,
        recommendedAction:
          declining.length > 0
            ? `Investigate ${top?.workflowId} — consider replay or escalation.`
            : "All workflows are within normal operating range.",
      };
    }

    case "next_workflow": {
      const recommendations = await getAliceWorkflowRecommendations(organizationId);
      const top = recommendations[0];
      return {
        question,
        answer: top
          ? `ALICE recommends prioritizing "${top.workflowId}" — ${top.rationale}`
          : "All workflows are operating optimally. No immediate action required.",
        supportingData: {
          topRecommendation: top ?? null,
          totalRecommendations: recommendations.length,
        },
        confidence: top?.confidence ?? 0.75,
        recommendedAction: top
          ? `Execute ${top.recommendationType} on ${top.workflowId}`
          : "Monitor current workflows and review next week.",
      };
    }

    case "patient_risk": {
      const noShowKpi = kpiMap["appointment_no_show"];
      const reactivationKpi = kpiMap["reactivation_candidate_detected"];
      const atRiskEstimate =
        (noShowKpi?.totalExecutions ?? 0) + (reactivationKpi?.totalExecutions ?? 0);
      return {
        question,
        answer: `Approximately ${atRiskEstimate} patients are flagged as at-risk (no-shows + reactivation candidates) this period.`,
        supportingData: {
          noShowExecutions: noShowKpi?.totalExecutions ?? 0,
          reactivationExecutions: reactivationKpi?.totalExecutions ?? 0,
          noShowReductionRate: roi.noShowReductionRate,
          patientReactivations: roi.patientReactivations,
        },
        confidence: 0.83,
        recommendedAction:
          atRiskEstimate > 50
            ? "High patient risk volume detected. Activate reactivation workflow and review no-show intervention timing."
            : "Patient risk is within acceptable range.",
      };
    }

    case "highest_roi_workflow": {
      const roiScored = analytics.workflowKpis.map(k => ({
        workflowId: k.workflowId,
        name: k.name,
        domain: k.domain,
        roiScore: k.totalExecutions * (k.successRate / 100),
        successRate: k.successRate,
        totalExecutions: k.totalExecutions,
      }));
      const best = roiScored.sort((a, b) => b.roiScore - a.roiScore)[0];
      return {
        question,
        answer: best
          ? `"${best.workflowId}" delivers the highest estimated ROI impact with ${best.totalExecutions} executions at ${best.successRate}% success rate.`
          : "Insufficient execution data to determine highest ROI workflow.",
        supportingData: {
          topWorkflow: best ?? null,
          rankedWorkflows: roiScored.slice(0, 5),
        },
        confidence: 0.85,
        recommendedAction: best
          ? `Scale "${best.workflowId}" — it is your highest-performing revenue automation.`
          : "Increase workflow execution volume to generate reliable ROI data.",
      };
    }

    default: {
      const _exhaustive: never = question;
      return {
        question: _exhaustive,
        answer: "Unknown question type.",
        supportingData: {},
        confidence: 0,
      };
    }
  }
}

// ─── Bulk Insight Generator ──────────────────────────────────────────────────

export async function getDentalInsights(
  organizationId: string
): Promise<DentalIntelligenceAnswer[]> {
  const questions: DentalIntelligenceQuery["question"][] = [
    "revenue_recovered",
    "revenue_opportunities",
    "recall_performance",
    "declining_kpi",
    "next_workflow",
    "patient_risk",
    "highest_roi_workflow",
  ];

  return Promise.all(
    questions.map(question => answerDentalQuery({ organizationId, question }))
  );
}

// ─── Workflow Priority by ROI Impact ─────────────────────────────────────────

export async function getDentalWorkflowPriority(organizationId: string): Promise<string[]> {
  const analytics = await getWorkflowAnalyticsSummary();

  const scored = analytics.workflowKpis
    .map(k => ({
      workflowId: k.workflowId,
      roiScore: k.totalExecutions * (k.successRate / 100),
    }))
    .sort((a, b) => b.roiScore - a.roiScore);

  return scored.map(s => s.workflowId);
}
