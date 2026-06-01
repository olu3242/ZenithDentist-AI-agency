import "server-only";

/**
 * Forecast Engine — revenue forecasting from pipeline + retention data.
 */

import { getPipelineSummary } from "@/lib/revenue-os/pipeline-engine";

export interface RevenueForecast {
  currentMrr: number;
  currentArr: number;
  forecastMrr90Days: number;
  forecastArr90Days: number;
  weightedPipelineMrr: number;
  churnRiskMrr: number;
  netNewMrr: number;
  computedAt: string;
}

export async function getRevenueForecast(): Promise<RevenueForecast> {
  const pipeline = await getPipelineSummary();

  const currentMrr = pipeline.closedWonMrr;
  const churnRiskMrr = Math.round(currentMrr * 0.05); // 5% baseline churn risk
  const netNewMrr = Math.round(pipeline.weightedForecast * 0.3); // 30% of weighted pipeline closes in 90d

  return {
    currentMrr,
    currentArr: pipeline.closedWonArr,
    forecastMrr90Days: currentMrr + netNewMrr - churnRiskMrr,
    forecastArr90Days: (currentMrr + netNewMrr - churnRiskMrr) * 12,
    weightedPipelineMrr: pipeline.weightedForecast,
    churnRiskMrr,
    netNewMrr,
    computedAt: new Date().toISOString(),
  };
}
