import { EnterpriseSimulationCenter } from "@/components/enterprise/enterprise-simulation-center";
import { ForecastingRadar } from "@/components/enterprise/forecasting-radar";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export default async function PortalForecastingPage() {
  const state = await getEnterpriseCloudState();
  return (
    <DashboardContainer>
      <PortalHeader title="Enterprise Forecasting" subtitle="Production trajectory, staffing pressure, patient retention volatility, and operational resilience forecasting." />
      <ForecastingRadar forecasts={state.forecasts} />
      <EnterpriseSimulationCenter state={state} />
    </DashboardContainer>
  );
}
