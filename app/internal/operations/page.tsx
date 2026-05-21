import { AutonomousAlertFeed } from "@/components/autonomous/autonomous-alert-feed";
import { OperationalTimeline } from "@/components/autonomous/operational-timeline";
import { SimulationDashboard } from "@/components/autonomous/simulation-dashboard";
import { InternalHeader } from "@/components/internal/internal-header";
import { getAutonomousEngineState } from "@/lib/autonomous";

export default async function InternalOperationsPage() {
  const state = await getAutonomousEngineState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Autonomous Operations" subtitle="Operational degradation detection, simulations, alerts, and corrective action planning." />
      <SimulationDashboard />
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <AutonomousAlertFeed events={state.timeline} />
        <OperationalTimeline events={state.timeline} />
      </div>
    </div>
  );
}
