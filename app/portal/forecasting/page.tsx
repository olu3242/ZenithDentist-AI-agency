import { EnterpriseSimulationCenter } from "@/components/enterprise/enterprise-simulation-center";
import { ForecastingRadar } from "@/components/enterprise/forecasting-radar";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export default async function PortalForecastingPage() {
  const state = await getEnterpriseCloudState();
  return (
    <div className="space-y-6">
      <PortalHeader title="Enterprise Forecasting" subtitle="Production trajectory, staffing pressure, patient retention volatility, and operational resilience forecasting." />
      <ForecastingRadar forecasts={state.forecasts} />
      <EnterpriseSimulationCenter state={state} />
    </div>
  );
}
