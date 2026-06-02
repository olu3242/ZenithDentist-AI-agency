import { SimulationDashboard } from "@/components/autonomous/simulation-dashboard";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";

export default function PortalSimulationsPage() {
  return (
    <DashboardContainer>
      <PortalHeader title="Operational Simulator" subtitle="Model staffing, reminder timing, recall cadence, and review timing before operator approval." />
      <SimulationDashboard />
    </DashboardContainer>
  );
}
