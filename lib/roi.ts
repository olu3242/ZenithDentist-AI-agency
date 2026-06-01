import type { RoiInput } from "@/lib/validation";

export interface RoiProjection {
  monthlyRevenueLoss: number;
  yearlyRevenueLoss: number;
  recoverableRevenue: number;
  revenueRecoveryOpportunity: number;
  recallOpportunity: number;
  treatmentOpportunity: number;
  chairFillOpportunity: number;
  reviewOpportunity: number;
  referralOpportunity: number;
  practiceHealthScore: number;
  noShowLoss: number;
  recallLoss: number;
  adminLoss: number;
  confidence: "conservative" | "moderate" | "aggressive";
}

export function calculateRevenueProjection(input: RoiInput): RoiProjection {
  const providers = input.providers ?? input.chairs;
  const treatmentAcceptanceRate = input.treatmentAcceptanceRate ?? 55;
  const recallRate = input.recallRate ?? Math.max(35, 100 - input.recallPatientsLost / 2);
  const noShowAppointments = input.monthlyAppointments * (input.noShowRate / 100);
  const noShowLoss = noShowAppointments * input.avgAppointmentValue;
  const recallGap = Math.max(0, 100 - recallRate);
  const recallPatientsAtRisk = Math.max(input.recallPatientsLost, input.monthlyAppointments * (recallGap / 100) * 0.45);
  const recallLoss = recallPatientsAtRisk * input.avgAppointmentValue;
  const adminLoss = input.adminHoursPerDay * 22 * 22;
  const monthlyRevenueLoss = noShowLoss + recallLoss + adminLoss;
  const recoverableRevenue = noShowLoss * 0.4 + recallLoss * 0.25 + adminLoss * 0.6;
  const recallOpportunity = recallLoss * 0.25;
  const treatmentGap = Math.max(0, 75 - treatmentAcceptanceRate);
  const treatmentOpportunity = input.monthlyAppointments * (treatmentGap / 100) * input.avgAppointmentValue * 0.42;
  const chairFillOpportunity = noShowLoss * 0.4;
  const reviewOpportunity = input.monthlyAppointments * 0.015 * input.avgAppointmentValue * Math.max(1, providers * 0.18);
  const referralOpportunity = input.monthlyAppointments * 0.012 * input.avgAppointmentValue * Math.max(1, providers * 0.16);
  const revenueRecoveryOpportunity = recoverableRevenue + treatmentOpportunity + chairFillOpportunity * 0.35 + reviewOpportunity + referralOpportunity;
  const practiceHealthScore = Math.max(
    42,
    Math.min(
      98,
      Math.round(
        100 -
          input.noShowRate * 1.1 -
          recallGap * 0.28 -
          treatmentGap * 0.35 -
          input.adminHoursPerDay * 1.4
      )
    )
  );

  return {
    monthlyRevenueLoss,
    yearlyRevenueLoss: monthlyRevenueLoss * 12,
    recoverableRevenue,
    revenueRecoveryOpportunity,
    recallOpportunity,
    treatmentOpportunity,
    chairFillOpportunity,
    reviewOpportunity,
    referralOpportunity,
    practiceHealthScore,
    noShowLoss,
    recallLoss,
    adminLoss,
    confidence: input.noShowRate > 18 || recallGap > 35 || treatmentGap > 25 ? "aggressive" : "moderate"
  };
}

export function buildAuditRecommendations(input: RoiInput, projection: RoiProjection) {
  return [
    {
      title: "Confirmation stack",
      body: `Prioritize 48hr, 24hr, and 2hr reminders for the ${Math.round(
        input.monthlyAppointments * (input.noShowRate / 100)
      )} monthly appointments currently exposed to no-show risk.`
    },
    {
      title: "Recall segmentation",
      body: `Segment ${input.recallPatientsLost} lost recall patients into 90, 180, and 365 day recovery campaigns.`
    },
    {
      title: "Front desk leverage",
      body: `Automate repetitive outreach to recover roughly $${Math.round(
        projection.adminLoss * 0.6
      ).toLocaleString()} in monthly administrative capacity.`
    },
    {
      title: "Treatment acceptance acceleration",
      body: `ALICE estimates $${Math.round(
        projection.treatmentOpportunity
      ).toLocaleString()} in monthly treatment opportunity from unscheduled diagnosed care follow-up.`
    },
    {
      title: "Chair fill protection",
      body: `Deploy Chair Fill to protect $${Math.round(
        projection.chairFillOpportunity
      ).toLocaleString()} in monthly schedule risk tied to no-show exposure.`
    },
    {
      title: "Review and referral lift",
      body: `Activate review and referral plays worth roughly $${Math.round(
        projection.reviewOpportunity + projection.referralOpportunity
      ).toLocaleString()} in monthly growth opportunity.`
    }
  ];
}

export function buildAliceRevenueOpportunityReport(input: RoiInput, projection: RoiProjection) {
  const leaks = [
    { label: "No-show and chair fill leakage", value: projection.chairFillOpportunity },
    { label: "Recall recovery gap", value: projection.recallOpportunity },
    { label: "Treatment acceptance gap", value: projection.treatmentOpportunity },
    { label: "Review growth gap", value: projection.reviewOpportunity },
    { label: "Referral growth gap", value: projection.referralOpportunity },
    { label: "Administrative capacity drag", value: projection.adminLoss * 0.6 }
  ].sort((a, b) => b.value - a.value);

  return {
    title: "ALICE Revenue Opportunity Report",
    practiceHealthScore: projection.practiceHealthScore,
    revenueRecoveryEstimate: projection.revenueRecoveryOpportunity,
    revenueRecoveryOpportunity: projection.revenueRecoveryOpportunity,
    recallOpportunity: projection.recallOpportunity,
    treatmentOpportunity: projection.treatmentOpportunity,
    chairFillOpportunity: projection.chairFillOpportunity,
    reviewOpportunity: projection.reviewOpportunity,
    referralOpportunity: projection.referralOpportunity,
    topRevenueLeaks: leaks.slice(0, 3),
    recommendedRevenuePlaybooks: leaks.slice(0, 3).map(leak => {
      if (leak.label.includes("Recall")) return "Recall Recovery";
      if (leak.label.includes("Treatment")) return "Treatment Acceptance";
      if (leak.label.includes("chair")) return "Chair Fill";
      if (leak.label.includes("Review")) return "Review Generation";
      if (leak.label.includes("Referral")) return "Referral Growth";
      return "No Show Prevention";
    }),
    ninetyDayOpportunitySnapshot: {
      revenueRecovered: Math.round(projection.revenueRecoveryOpportunity * 3),
      recallPatientsRecovered: Math.round(input.recallPatientsLost * 0.25 * 3),
      treatmentCasesAdvanced: Math.round(input.monthlyAppointments * 0.08 * 0.35 * 3),
      chairHoursProtected: Math.round(input.monthlyAppointments * (input.noShowRate / 100) * 0.4 * 3)
    },
    executiveSummary: `ALICE identifies a ${projection.confidence} revenue opportunity profile with a ${projection.practiceHealthScore}/100 Practice Health Score and ${Math.round(projection.revenueRecoveryOpportunity).toLocaleString()} in monthly recoverable opportunity.`
  };
}
