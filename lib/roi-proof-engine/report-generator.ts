import "server-only";

import { getImpactSummary } from "@/lib/roi-proof-engine/impact-measurement";
import type { ImpactSummary } from "@/lib/roi-proof-engine/impact-measurement";

export interface ImpactReport {
  period: string;
  organizationId: string;
  metrics: ImpactSummary;
  roiMultiple: number;
  narrativeSummary: string;
  generatedAt: string;
}

export interface QuarterlyReport {
  quarter: string;
  organizationId: string;
  metrics: ImpactSummary;
  roiMultiple: number;
  topWins: string[];
  narrativeSummary: string;
  generatedAt: string;
}

export interface AnnualReport {
  year: string;
  organizationId: string;
  metrics: ImpactSummary;
  totalAnnualRoiUsd: number;
  roiMultiple: number;
  narrativeSummary: string;
  generatedAt: string;
}

function buildNarrative(metrics: ImpactSummary, period: string): string {
  return (
    `In the ${period} period, Zenith AI delivered $${metrics.totalRoiUsd.toLocaleString()} in measurable ROI — ` +
    `a ${metrics.roiMultiple}x return. ` +
    `Revenue recovered from reduced no-shows: $${metrics.revenueRecoveredDelta.toLocaleString()}. ` +
    `Labor hours saved: ${metrics.laborHoursSavedDelta} hours. ` +
    `New reviews generated: ${metrics.reviewCountDelta}.`
  );
}

export async function generateMonthlyImpactReport(
  organizationId: string
): Promise<ImpactReport | null> {
  const metrics = await getImpactSummary(organizationId);
  if (!metrics) return null;

  const period = new Date().toISOString().slice(0, 7);
  return {
    period,
    organizationId,
    metrics,
    roiMultiple: metrics.roiMultiple,
    narrativeSummary: buildNarrative(metrics, period),
    generatedAt: new Date().toISOString(),
  };
}

export async function generateQuarterlyReport(
  organizationId: string
): Promise<QuarterlyReport | null> {
  const metrics = await getImpactSummary(organizationId);
  if (!metrics) return null;

  const now = new Date();
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;

  const topWins: string[] = [];
  if (metrics.noShowReductionDelta > 0)
    topWins.push(`Reduced no-show rate by ${metrics.noShowReductionDelta.toFixed(1)}%`);
  if (metrics.recallRecoveryDelta > 0)
    topWins.push(`Improved recall rate by ${metrics.recallRecoveryDelta.toFixed(1)}%`);
  if (metrics.reviewCountDelta > 0)
    topWins.push(`Generated ${metrics.reviewCountDelta} new reviews`);
  if (metrics.laborHoursSavedDelta > 0)
    topWins.push(`Saved ${metrics.laborHoursSavedDelta} staff hours`);

  return {
    quarter,
    organizationId,
    metrics,
    roiMultiple: metrics.roiMultiple,
    topWins,
    narrativeSummary: buildNarrative(metrics, quarter),
    generatedAt: new Date().toISOString(),
  };
}

export async function generateAnnualValueReport(
  organizationId: string
): Promise<AnnualReport | null> {
  const metrics = await getImpactSummary(organizationId);
  if (!metrics) return null;

  const year = String(new Date().getFullYear());
  const totalAnnualRoiUsd = Math.round(metrics.totalRoiUsd * 12);

  return {
    year,
    organizationId,
    metrics,
    totalAnnualRoiUsd,
    roiMultiple: metrics.roiMultiple,
    narrativeSummary: `In ${year}, Zenith AI is projected to deliver $${totalAnnualRoiUsd.toLocaleString()} in annualized ROI — a ${metrics.roiMultiple}x return on your automation investment.`,
    generatedAt: new Date().toISOString(),
  };
}
