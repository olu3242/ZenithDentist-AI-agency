import "server-only";

import { getAdminDashboardData } from "@/lib/data/leads";
import { getClientOperationsState } from "@/lib/client-operations";
import { createServiceClient } from "@/lib/supabase/server";

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
  const supabase = createServiceClient();
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
  const [packagesResult, contentResult] = supabase
    ? await Promise.all([
        supabase.from("service_packages").select("*").order("monthly_price", { ascending: true }),
        supabase.from("authority_content_assets").select("*").order("created_at", { ascending: false }).limit(12)
      ])
    : [{ data: [] }, { data: [] }];

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
    packages: (packagesResult.data ?? []).map((pkg) => ({
      key: pkg.package_key,
      name: pkg.name,
      implementationPrice: Number(pkg.implementation_price ?? 0),
      monthlyPrice: Number(pkg.monthly_price ?? 0),
      deliverables: Array.isArray(pkg.deliverables) ? pkg.deliverables.map(String) : [],
      kpiTargets: Array.isArray(pkg.kpi_targets) ? pkg.kpi_targets.map(String) : [],
      supportModel: pkg.support_model
    })),
    proof: buildProofState(clientOps.scores.automationRoi, clientOps.scores.slaCompliance, clientOps.scores.engagementScore),
    retention: buildRetentionState(clientOps.scores),
    contentIdeas: (contentResult.data ?? []).map((asset) => asset.title)
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
