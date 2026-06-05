"use client";

import { Donut } from "@/components/charts/workflow-health-donut";
import { chartPalette, type ChartDatum } from "@/components/charts/chart-types";

export function PatientSegmentDonut({ data }: { data: ChartDatum[] }) {
  return <Donut data={data} colors={[chartPalette.emerald, chartPalette.blue, chartPalette.gold, chartPalette.violet]} />;
}
