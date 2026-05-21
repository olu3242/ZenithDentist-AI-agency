import { OperationalSimulator } from "@/components/autonomous/operational-simulator";
import { ForecastReliabilityChart } from "@/components/autonomous/forecast-reliability-chart";

export function SimulationDashboard() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <OperationalSimulator />
      <ForecastReliabilityChart />
    </div>
  );
}
