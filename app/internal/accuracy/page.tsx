import { ForecastDriftRadar } from "@/components/mission-control/forecast-drift-radar";
import { RecommendationEffectivenessMatrix } from "@/components/mission-control/recommendation-effectiveness-matrix";
import { SimulationAccuracyChart } from "@/components/mission-control/simulation-accuracy-chart";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalAccuracyPage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Accuracy Systems" subtitle="Forecast drift, simulation accuracy, recommendation effectiveness, and calibrated confidence quality." />
      <ForecastDriftRadar state={state} />
      <SimulationAccuracyChart state={state} />
      <RecommendationEffectivenessMatrix state={state} />
    </div>
  );
}
