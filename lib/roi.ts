import type { RoiInput } from "@/lib/validation";

export interface RoiProjection {
  monthlyRevenueLoss: number;
  yearlyRevenueLoss: number;
  recoverableRevenue: number;
  noShowLoss: number;
  recallLoss: number;
  adminLoss: number;
  confidence: "conservative" | "moderate" | "aggressive";
}

export function calculateRevenueProjection(input: RoiInput): RoiProjection {
  const noShowAppointments = input.monthlyAppointments * (input.noShowRate / 100);
  const noShowLoss = noShowAppointments * input.avgAppointmentValue;
  const recallLoss = input.recallPatientsLost * input.avgAppointmentValue;
  const adminLoss = input.adminHoursPerDay * 22 * 22;
  const monthlyRevenueLoss = noShowLoss + recallLoss + adminLoss;
  const recoverableRevenue = noShowLoss * 0.4 + recallLoss * 0.25 + adminLoss * 0.6;

  return {
    monthlyRevenueLoss,
    yearlyRevenueLoss: monthlyRevenueLoss * 12,
    recoverableRevenue,
    noShowLoss,
    recallLoss,
    adminLoss,
    confidence: input.noShowRate > 18 || input.recallPatientsLost > 40 ? "aggressive" : "moderate"
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
    }
  ];
}
