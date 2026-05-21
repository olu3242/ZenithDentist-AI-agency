import { SimulationDashboard } from "@/components/autonomous/simulation-dashboard";
import { PortalHeader } from "@/components/portal/portal-header";

export default function PortalSimulationsPage() {
  return (
    <div className="space-y-6">
      <PortalHeader title="Operational Simulator" subtitle="Model staffing, reminder timing, recall cadence, and review timing before operator approval." />
      <SimulationDashboard />
    </div>
  );
}
