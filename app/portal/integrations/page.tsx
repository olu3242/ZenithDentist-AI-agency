import { PMSIntegrationManager } from "@/components/enterprise/pms-integration-manager";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export default async function PortalIntegrationsPage() {
  const state = await getEnterpriseCloudState();
  return (
    <DashboardContainer>
      <PortalHeader title="PMS Integration Layer" subtitle="Provider abstraction, normalization, sync health, and failover-ready enterprise operational data." />
      <PMSIntegrationManager state={state} />
    </DashboardContainer>
  );
}
