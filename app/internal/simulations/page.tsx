import { AdaptiveOptimizationPanel } from "@/components/mission-control/adaptive-optimization-panel";
import { SimulationAccuracyChart } from "@/components/mission-control/simulation-accuracy-chart";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalSimulationsPage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Simulation Accuracy" subtitle="Projected vs actual outcomes, optimization reliability, and adaptive operational intelligence." />
      <SimulationAccuracyChart state={state} />
      <AdaptiveOptimizationPanel state={state} />
    </div>
  );
}
