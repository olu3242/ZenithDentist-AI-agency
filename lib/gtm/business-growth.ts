import "server-only";

import { getAdminDashboardData } from "@/lib/data/leads";
import { getClientOperationsState } from "@/lib/client-operations";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database, GtmPipelineStage, Json } from "@/lib/database.types";
import { startRuntimeTrace, completeRuntimeTrace, failRuntimeTrace } from "@/lib/runtime/instrumentation";

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

export const gtmStageKeys = [
  "prospect_identified",
  "outreach_sent",
  "loom_audit_delivered",
  "discovery_booked",
  "proposal_sent",
  "closed_won",
  "onboarding",
  "live_optimization",
  "case_study_candidate",
  "referral_opportunity"
] as const satisfies readonly GtmPipelineStage[];

const gtmStageLabels = {
  prospect_identified: "Prospect identified",
  outreach_sent: "Outreach sent",
  loom_audit_delivered: "Loom audit delivered",
  discovery_booked: "Discovery booked",
  proposal_sent: "Proposal sent",
  closed_won: "Closed won",
  onboarding: "Onboarding",
  live_optimization: "Live optimization",
  case_study_candidate: "Case study candidate",
  referral_opportunity: "Referral opportunity"
} as const satisfies Record<GtmPipelineStage, typeof gtmStages[number]>;

export interface ServicePackage {
  key: string;
  name: string;
  implementationPrice: number;
  monthlyPrice: number;
  deliverables: string[];
  kpiTargets: string[];
  supportModel: string;
}

type GtmProspect = Database["public"]["Tables"]["gtm_prospects"]["Row"];
type GtmAudit = Database["public"]["Tables"]["operational_audits_gtm"]["Row"];
type ClientOnboardingPlaybook = Database["public"]["Tables"]["client_onboarding_playbooks"]["Row"];
type CaseStudyResult = Database["public"]["Tables"]["case_study_results"]["Row"];
type ClientSuccessAccount = Database["public"]["Tables"]["client_success_accounts"]["Row"];
type ReferralFlywheelEvent = Database["public"]["Tables"]["referral_flywheel_events"]["Row"];
type AuthorityContentAsset = Database["public"]["Tables"]["authority_content_assets"]["Row"];
type ServicePackageRow = Database["public"]["Tables"]["service_packages"]["Row"];

export async function getBusinessGrowthState() {
  const [admin, clientOps] = await Promise.all([getAdminDashboardData(), getClientOperationsState()]);
  const supabase = createServiceClient();
  const leads = admin.leads;
  const roi = admin.roiCalculations;
  const bookings = admin.bookings;
  const [
    prospectsResult,
    gtmAuditsResult,
    onboardingResult,
    caseStudiesResult,
    successResult,
    referralsResult,
    packagesResult,
    contentResult
  ] = supabase
    ? await Promise.all([
        supabase.from("gtm_prospects").select("*").order("updated_at", { ascending: false }).limit(250),
        supabase.from("operational_audits_gtm").select("*").order("created_at", { ascending: false }).limit(150),
        supabase.from("client_onboarding_playbooks").select("*").order("updated_at", { ascending: false }).limit(100),
        supabase.from("case_study_results").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("client_success_accounts").select("*").order("updated_at", { ascending: false }).limit(100),
        supabase.from("referral_flywheel_events").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("service_packages").select("*").order("monthly_price", { ascending: true }),
        supabase.from("authority_content_assets").select("*").order("created_at", { ascending: false }).limit(24)
      ])
    : [
        { data: [] as GtmProspect[] },
        { data: [] as GtmAudit[] },
        { data: [] as ClientOnboardingPlaybook[] },
        { data: [] as CaseStudyResult[] },
        { data: [] as ClientSuccessAccount[] },
        { data: [] as ReferralFlywheelEvent[] },
        { data: [] as ServicePackageRow[] },
        { data: [] as AuthorityContentAsset[] }
      ];

  const prospects = prospectsResult.data ?? [];
  const gtmAudits = gtmAuditsResult.data ?? [];
  const onboarding = onboardingResult.data ?? [];
  const caseStudies = caseStudiesResult.data ?? [];
  const successAccounts = successResult.data ?? [];
  const referrals = referralsResult.data ?? [];
  const won = prospects.length ? prospects.filter(prospect => prospect.pipeline_stage === "closed_won") : leads.filter(lead => lead.status === "won");
  const booked = prospects.length
    ? prospects.filter(prospect => prospect.pipeline_stage === "discovery_booked")
    : bookings.filter(booking => booking.booking_status === "scheduled" || booking.booking_status === "clicked");
  const proposals = prospects.length
    ? prospects.filter(prospect => prospect.pipeline_stage === "proposal_sent")
    : admin.events.filter(event => String(event.event_metadata).toLowerCase().includes("proposal"));
  const outboundSent = admin.events.filter(event => event.event_type === "email_sent" || event.event_type === "cta_clicked").length;
  const pipelineValue = prospects.length
    ? prospects.reduce((sum, prospect) => sum + Number(prospect.estimated_monthly_opportunity ?? 0), 0)
    : roi.reduce((sum, calc) => sum + Number(calc.recoverable_revenue ?? 0), 0);
  const avgImplementationValue = (prospects.length || roi.length) ? Math.round(pipelineValue / Math.max(1, prospects.length || roi.length)) : 0;
  const activePackages = packagesResult.data ?? [];
  const averageMonthlyPackage = activePackages.length
    ? Math.round(activePackages.reduce((sum, pkg) => sum + Number(pkg.monthly_price ?? 0), 0) / activePackages.length)
    : 0;
  const mrr = successAccounts.length
    ? successAccounts.reduce((sum, account) => sum + estimateAccountMrr(account, activePackages), 0)
    : won.length * averageMonthlyPackage;
  const arr = mrr * 12;

  const stageCounts = Object.fromEntries(gtmStages.map(stage => [stage, 0])) as Record<typeof gtmStages[number], number>;
  if (prospects.length) {
    for (const prospect of prospects) stageCounts[gtmStageLabels[prospect.pipeline_stage]] += 1;
  } else {
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
  }

  return {
    metrics: {
      mrr,
      arr,
      pipelineValue,
      avgImplementationValue,
      leadVelocity: leads.length,
      discoveryBookings: booked.length,
      closeRate: leads.length ? Math.round((won.length / leads.length) * 100) : 0,
      referralOpportunities: referrals.length || stageCounts["Referral opportunity"],
      onboardingCompletion: onboarding.length ? Math.round(onboarding.reduce((sum, item) => sum + item.progress, 0) / onboarding.length) : clientOps.scores.automationMaturityScore,
      clientHealth: successAccounts.length ? Math.round(successAccounts.reduce((sum, account) => sum + account.health_score, 0) / successAccounts.length) : clientOps.scores.operationalScore,
      caseStudyCandidates: caseStudies.filter(study => study.status !== "published").length,
      referralGrowth: referrals.length,
      customerSuccessAccounts: successAccounts.length,
      contentAssets: (contentResult.data ?? []).length
    },
    stageCounts,
    leadScores: prospects.length ? prospects.slice(0, 12).map(prospect => ({
      id: prospect.id,
      practiceName: prospect.practice_name,
      score: prospect.lead_score,
      angle: prospect.personalization_notes ?? buildProspectAngle(prospect),
      nextAction: prospect.next_action ?? stageToNextAction(prospect.pipeline_stage)
    })) : leads.slice(0, 12).map(lead => {
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
      title: "Patient Revenue Engine Proposal Framework",
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
    packages: activePackages.map((pkg) => ({
      key: pkg.package_key,
      name: pkg.name,
      implementationPrice: Number(pkg.implementation_price ?? 0),
      monthlyPrice: Number(pkg.monthly_price ?? 0),
      deliverables: toStringArray(pkg.deliverables),
      kpiTargets: toStringArray(pkg.kpi_targets),
      supportModel: pkg.support_model
    })),
    proof: buildProofState(caseStudies, clientOps.scores.automationRoi, clientOps.scores.slaCompliance, clientOps.scores.engagementScore),
    retention: buildRetentionState(successAccounts, clientOps.scores),
    onboarding: buildOnboardingState(onboarding),
    referrals: buildReferralState(referrals),
    audits: buildAuditState(gtmAudits),
    contentIdeas: (contentResult.data ?? []).map((asset) => asset.title)
  };
}

export async function createGtmProspect(input: {
  practiceName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  source?: string;
  estimatedMonthlyOpportunity?: number;
  personalizationNotes?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase server environment is not configured.");
  const trace = await startRuntimeTrace({
    workflowId: "lead_created",
    eventName: "gtm_prospect_created",
    metadata: { practiceName: input.practiceName, source: input.source ?? "manual" }
  });

  const leadScore = scoreGtmProspect({
    estimatedMonthlyOpportunity: input.estimatedMonthlyOpportunity ?? 0,
    source: input.source ?? "manual",
    personalizationNotes: input.personalizationNotes ?? ""
  });
  const { data, error } = await supabase.from("gtm_prospects").insert({
    practice_name: input.practiceName,
    contact_name: input.contactName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    source: input.source ?? "manual",
    lead_score: leadScore,
    estimated_monthly_opportunity: input.estimatedMonthlyOpportunity ?? 0,
    personalization_notes: input.personalizationNotes ?? null,
    next_action: "Send operational revenue audit."
  }).select().single();

  if (error) {
    await failRuntimeTrace(trace, error.message, { stage: "gtm_prospect_insert" });
    throw new Error("Unable to create GTM prospect.");
  }
  await completeRuntimeTrace(trace);
  return data;
}

export async function updateGtmProspectStage(input: { prospectId: string; stage: GtmPipelineStage; nextAction?: string }) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase server environment is not configured.");
  const trace = await startRuntimeTrace({
    workflowId: "ai_followup_required",
    eventName: "gtm_stage_updated",
    metadata: { prospectId: input.prospectId, stage: input.stage }
  });
  const { data, error } = await supabase.from("gtm_prospects").update({
    pipeline_stage: input.stage,
    next_action: input.nextAction ?? stageToNextAction(input.stage),
    updated_at: new Date().toISOString()
  }).eq("id", input.prospectId).select().single();

  if (error) {
    await failRuntimeTrace(trace, error.message, { stage: "gtm_stage_update" });
    throw new Error("Unable to update GTM prospect stage.");
  }
  await completeRuntimeTrace(trace);
  return data;
}

export async function createOperationalRevenueAudit(input: {
  prospectId: string;
  noShowFindings?: string;
  reviewFindings?: string;
  recallFindings?: string;
  retentionFindings?: string;
  revenueLeakageEstimate?: number;
  loomUrl?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase server environment is not configured.");
  const trace = await startRuntimeTrace({
    workflowId: "lead_created",
    eventName: "operational_revenue_audit_created",
    metadata: { prospectId: input.prospectId, revenueLeakageEstimate: input.revenueLeakageEstimate ?? 0 }
  });
  const { data, error } = await supabase.from("operational_audits_gtm").insert({
    prospect_id: input.prospectId,
    no_show_findings: input.noShowFindings ?? null,
    review_findings: input.reviewFindings ?? null,
    recall_findings: input.recallFindings ?? null,
    retention_findings: input.retentionFindings ?? null,
    revenue_leakage_estimate: input.revenueLeakageEstimate ?? 0,
    loom_url: input.loomUrl ?? null,
    delivered_at: input.loomUrl ? new Date().toISOString() : null
  }).select().single();

  if (error) {
    await failRuntimeTrace(trace, error.message, { stage: "gtm_audit_insert" });
    throw new Error("Unable to create operational revenue audit.");
  }
  await updateGtmProspectStage({ prospectId: input.prospectId, stage: "loom_audit_delivered" });
  await completeRuntimeTrace(trace);
  return data;
}

function scoreLead(input: { noShowRate: number; staffSize: number; opportunity: number; status: string }) {
  const statusBoost = input.status === "booked" ? 18 : input.status === "audit_requested" ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(input.noShowRate * 2 + input.staffSize * 3 + input.opportunity / 1000 + statusBoost)));
}

function buildProofState(caseStudies: CaseStudyResult[], recoveredRevenue: number, slaCompliance: number, engagement: number) {
  const aggregateRecoveredRevenue = caseStudies.length
    ? caseStudies.reduce((sum, study) => sum + Number(study.recovered_revenue), 0)
    : recoveredRevenue;
  const noShowReductionAverage = caseStudies.length
    ? Math.round(caseStudies.reduce((sum, study) => sum + Number(study.no_show_reduction), 0) / caseStudies.length)
    : Math.max(0, Math.min(35, Math.round(slaCompliance / 4)));
  const patientRetentionLift = caseStudies.length
    ? Math.round(caseStudies.reduce((sum, study) => sum + Number(study.recall_patients_recovered), 0) / caseStudies.length)
    : Math.max(0, Math.min(40, Math.round(engagement / 3)));
  const reviewGenerationLift = caseStudies.length
    ? Math.round(caseStudies.reduce((sum, study) => sum + Number(study.reviews_generated), 0) / caseStudies.length)
    : Math.max(0, Math.min(50, Math.round(engagement / 2)));
  return {
    aggregateRecoveredRevenue: Math.round(aggregateRecoveredRevenue),
    noShowReductionAverage,
    patientRetentionLift,
    reviewGenerationLift,
    caseStudiesReady: caseStudies.filter(study => study.status === "ready" || study.status === "published").length,
    testimonialPrompts: [
      "What changed in front desk workload after implementation?",
      "How much easier is it to keep chairs full?",
      "Which revenue recovery result surprised you most?"
    ]
  };
}

function buildRetentionState(accounts: ClientSuccessAccount[], scores: { operationalScore: number; automationMaturityScore: number; engagementScore: number; reliabilityScore: number; slaCompliance: number }) {
  const healthScore = accounts.length
    ? Math.round(accounts.reduce((sum, account) => sum + account.health_score, 0) / accounts.length)
    : Math.round((scores.operationalScore + scores.automationMaturityScore + scores.engagementScore + scores.reliabilityScore + scores.slaCompliance) / 5);
  const atRisk = accounts.filter(account => account.status === "at_risk").length;
  const expansionReady = accounts.filter(account => account.status === "expansion_ready").length;
  return {
    healthScore,
    churnRisk: atRisk ? "high" : healthScore < 75 ? "watch" : "low",
    expansionReadiness: expansionReady || healthScore > 82 ? "ready" : "nurture",
    atRiskAccounts: atRisk,
    expansionReadyAccounts: expansionReady,
    nextSuccessActions: [
      healthScore < 75 ? "Schedule operational check-in." : "Prepare expansion conversation.",
      "Send monthly recovered revenue summary.",
      "Identify referral opportunity after next milestone."
    ]
  };
}

function buildOnboardingState(playbooks: ClientOnboardingPlaybook[]) {
  return {
    activeClients: playbooks.length,
    averageProgress: playbooks.length ? Math.round(playbooks.reduce((sum, playbook) => sum + playbook.progress, 0) / playbooks.length) : 0,
    blockedClients: playbooks.filter(playbook => playbook.status === "blocked").length,
    nextLaunches: playbooks.slice(0, 6).map(playbook => ({
      id: playbook.id,
      clientName: playbook.client_name,
      status: playbook.status,
      progress: playbook.progress,
      roadmap: toStringArray(playbook.implementation_roadmap),
      checklist: toStringArray(playbook.launch_checklist)
    }))
  };
}

function buildReferralState(referrals: ReferralFlywheelEvent[]) {
  return {
    total: referrals.length,
    pendingRewards: referrals.filter(referral => referral.reward_status === "pending").length,
    advocacyStages: referrals.reduce<Record<string, number>>((counts, referral) => {
      counts[referral.advocacy_stage] = (counts[referral.advocacy_stage] ?? 0) + 1;
      return counts;
    }, {})
  };
}

function buildAuditState(audits: GtmAudit[]) {
  return {
    delivered: audits.filter(audit => Boolean(audit.delivered_at)).length,
    totalRevenueLeakage: Math.round(audits.reduce((sum, audit) => sum + Number(audit.revenue_leakage_estimate), 0)),
    loomAudits: audits.filter(audit => Boolean(audit.loom_url)).length
  };
}

function stageToNextAction(stage: GtmPipelineStage) {
  const actions: Record<GtmPipelineStage, string> = {
    prospect_identified: "Prepare operational revenue audit.",
    outreach_sent: "Send first follow-up with revenue leakage angle.",
    loom_audit_delivered: "Invite practice owner to discovery.",
    discovery_booked: "Prepare discovery brief.",
    proposal_sent: "Follow up on Patient Revenue Engine proposal.",
    closed_won: "Start operational onboarding.",
    onboarding: "Complete PMS and baseline setup.",
    live_optimization: "Review first operational results.",
    case_study_candidate: "Request proof metrics and testimonial.",
    referral_opportunity: "Ask for referral introduction."
  };
  return actions[stage];
}

function buildProspectAngle(prospect: GtmProspect) {
  if (prospect.estimated_monthly_opportunity > 10000) return "Lead with revenue recovery and reduce no-shows.";
  if (prospect.source === "referral") return "Lead with trust, patient retention, and full chairs.";
  return "Lead with operational efficiency and admin overload relief.";
}

function scoreGtmProspect(input: { estimatedMonthlyOpportunity: number; source: string; personalizationNotes: string }) {
  const opportunityScore = Math.min(55, input.estimatedMonthlyOpportunity / 500);
  const sourceScore = input.source === "referral" ? 25 : input.source === "google_maps" ? 16 : 12;
  const personalizationScore = input.personalizationNotes.length > 80 ? 20 : input.personalizationNotes.length > 20 ? 12 : 0;
  return Math.round(Math.min(100, opportunityScore + sourceScore + personalizationScore));
}

function estimateAccountMrr(account: ClientSuccessAccount, packages: ServicePackageRow[]) {
  if (!packages.length) return 0;
  const average = packages.reduce((sum, pkg) => sum + Number(pkg.monthly_price ?? 0), 0) / packages.length;
  return account.status === "expansion_ready" ? Math.round(average * 1.25) : Math.round(average);
}

function toStringArray(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
