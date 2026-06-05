"use client";

import { chartPalette, type ChartDatum } from "@/components/charts/chart-types";
import { FunnelBars } from "@/components/charts/recall-funnel";

export function TreatmentAcceptanceFunnel({ data }: { data: ChartDatum[] }) {
  return <FunnelBars data={data} color={chartPalette.violet} />;
}
