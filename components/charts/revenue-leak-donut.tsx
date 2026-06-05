"use client";

import { Donut } from "@/components/charts/workflow-health-donut";
import { chartPalette, type ChartDatum } from "@/components/charts/chart-types";

export function RevenueLeakDonut({ data }: { data: ChartDatum[] }) {
  return <Donut data={data} colors={[chartPalette.rust, chartPalette.gold, chartPalette.violet, chartPalette.teal]} />;
}
