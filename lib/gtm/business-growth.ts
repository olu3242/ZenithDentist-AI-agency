import "server-only";

import { getAdminDashboardData } from "@/lib/data/leads";
import { getClientOperationsState } from "@/lib/client-operations";

export const gtmStages = [
  "Prospect identified",
  "Outreach sent",
  "Loom audit delivered",
  "Discovery booked",
  "Proposal sent",
  "Closed won",
  "Onboarding",
  "Live optimization",
  "Case study candidate",
  "Referral opportunity"
] as const;

export interface ServicePackage {
  key: string;
  name: string;
  implementationPrice: number;
  monthlyPrice: number;
  deliverables: string[];
  kpiTargets: string[];
  supportModel: string;
}

export async function getBusinessGrowthState() {
  const [admin, clientOps] = await Promise.all([getAdminDashboardData(), getClientOperationsState()]);
  const leads = admin.leads;
  const roi = admin.roiCalculations;
  const bookings = admin.bookings;
  const won = leads.filter(lead => lead.status === "won");
  const booked = bookings.filter(booking => booking.booking_status === "scheduled" || booking.booking_status === "clicked");
  const proposals = admin.events.filter(event => String(event.event_metadata).toLowerCase().includes("proposal"));
  const outboundSent = admin.events.filter(event => event.event_type === "email_sent" || event.event_type === "cta_clicked").length;
  const pipelineValue = roi.reduce((sum, calc) => sum + Number(calc.recoverable_revenue ?? 0), 0);
  const avgImplementationValue = roi.length ? Math.round(pipelineValue / roi.length) : 0;
  const mrr = won.length * 2500;
  const arr = mrr * 12;

  const stageCounts = Object.fromEntries(gtmStages.map(stage => [stage, 0])) as Record<typeof gtmStages[number], number>;
  stageCounts["Prospect identified"] = Math.max(0, leads.length - outboundSent);
  stageCounts["Outreach sent"] = outboundSent;
  stageCounts["Loom audit delivered"] = admin.audits.length;
  stageCounts["Discovery booked"] = booked.length;
  stageCounts["Proposal sent"] = proposals.length;
  stageCounts["Closed won"] = won.length;
  stageCounts.Onboarding = leads.filter(lead => lead.status === "qualified").length;
  stageCounts["Live optimization"] = Math.max(0, won.length - Math.floor(won.length * 0.25));
  stageCounts["Case study candidate"] = Math.max(0, Math.floor(won.length * 0.5));
  stageCounts["Referral opportunity"] = Math.max(0, Math.floor(won.length * 0.35));

  return {
    metrics: {
      mrr,
      arr,
      pipelineValue,
      avgImplementationValue,
      leadVelocity: leads.length,
      discoveryBookings: booked.length,
      closeRate: leads.length ? Math.round((won.length / leads.length) * 100) : 0,
      referralOpportunities: stageCounts["Referral opportunity"],
      onboardingCompletion: clientOps.scores.automationMaturityScore,
      clientHealth: clientOps.scores.operationalScore
    },
    stageCounts,
    leadScores: leads.slice(0, 12).map(lead => {
      const opportunity = roi.find(item => item.lead_id === lead.id)?.recoverable_revenue ?? 0;
      return {
        id: lead.id,
        practiceName: lead.practice_name,
        score: scoreLead({
          noShowRate: Number(lead.no_show_rate ?? 0),
          staffSize: Number(lead.staff_size ?? 0),
          opportunity: Number(opportunity),
          status: lead.status
        }),
        angle: Number(lead.no_show_rate ?? 0) > 10 ? "Lead with reduce no-shows and recover revenue." : "Lead with patient retention and operational efficiency.",
        nextAction: lead.status === "booked" ? "Prepare discovery call brief." : "Send operational revenue audit."
      };
    }),
    discoveryFramework: [
      "Current operational pain",
      "No-show analysis",
      "Recall leakage",
      "Front desk overload",
      "Revenue impact",
      "Existing systems",
      "Operational bottlenecks",
      "Desired outcomes"
    ],
    proposalFramework: {
      title: "Patient Revenue Engine™ Proposal Framework",
      sections: [
        "Revenue opportunity",
        "Projected ROI",
        "Operational improvements",
        "Implementation timeline",
        "Onboarding plan",
        "Pricing recommendation",
        "Guarantee framing"
      ]
    },
    packages: servicePackages(),
    proof: buildProofState(clientOps.scores.automationRoi, clientOps.scores.slaCompliance, clientOps.scores.engagementScore),
    retention: buildRetentionState(clientOps.scores),
    contentIdeas: [
      "How dental practices lose revenue through no-shows",
      "The front desk overload problem in growing practices",
      "Patient retention gaps most practices miss",
      "Why full chairs depend on operational systems",
      "How to measure recovered revenue after recall improvements"
    ]
  };
}

function scoreLead(input: { noShowRate: number; staffSize: number; opportunity: number; status: string }) {
  const statusBoost = input.status === "booked" ? 18 : input.status === "audit_requested" ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(input.noShowRate * 2 + input.staffSize * 3 + input.opportunity / 1000 + statusBoost)));
}

function buildProofState(recoveredRevenue: number, slaCompliance: number, engagement: number) {
  return {
    aggregateRecoveredRevenue: Math.round(recoveredRevenue),
    noShowReductionAverage: Math.max(0, Math.min(35, Math.round(slaCompliance / 4))),
    patientRetentionLift: Math.max(0, Math.min(40, Math.round(engagement / 3))),
    reviewGenerationLift: Math.max(0, Math.min(50, Math.round(engagement / 2))),
    testimonialPrompts: [
      "What changed in front desk workload after implementation?",
      "How much easier is it to keep chairs full?",
      "Which revenue recovery result surprised you most?"
    ]
  };
}

function buildRetentionState(scores: { operationalScore: number; automationMaturityScore: number; engagementScore: number; reliabilityScore: number; slaCompliance: number }) {
  const healthScore = Math.round((scores.operationalScore + scores.automationMaturityScore + scores.engagementScore + scores.reliabilityScore + scores.slaCompliance) / 5);
  return {
    healthScore,
    churnRisk: healthScore < 55 ? "high" : healthScore < 75 ? "watch" : "low",
    expansionReadiness: healthScore > 82 ? "ready" : "nurture",
    nextSuccessActions: [
      healthScore < 75 ? "Schedule operational check-in." : "Prepare expansion conversation.",
      "Send monthly recovered revenue summary.",
      "Identify referral opportunity after next milestone."
    ]
  };
}

function servicePackages(): ServicePackage[] {
  return [
    {
      key: "starter_engine",
      name: "Starter Engine",
      implementationPrice: 2500,
      monthlyPrice: 1500,
      deliverables: ["Baseline audit", "No-show recovery setup", "Monthly performance report"],
      kpiTargets: ["Reduce no-shows", "Improve response speed"],
      supportModel: "Monthly optimization"
    },
    {
      key: "patient_revenue_engine",
      name: "Full Patient Revenue Engine™",
      implementationPrice: 5000,
      monthlyPrice: 3000,
      deliverables: ["No-show, recall, review, and intake systems", "Operational dashboard", "Weekly optimization"],
      kpiTargets: ["Recover revenue", "Improve patient retention", "Reduce admin overload"],
      supportModel: "Weekly operating review"
    },
    {
      key: "executive_operations",
      name: "Executive Operations Layer",
      implementationPrice: 8500,
      monthlyPrice: 5000,
      deliverables: ["Executive reporting", "Multi-location visibility", "Client success reviews"],
      kpiTargets: ["Increase operational efficiency", "Improve leadership visibility"],
      supportModel: "Executive business review"
    }
  ];
}
