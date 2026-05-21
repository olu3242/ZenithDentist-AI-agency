import { PMSIntegrationManager } from "@/components/enterprise/pms-integration-manager";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export default async function PortalIntegrationsPage() {
  const state = await getEnterpriseCloudState();
  return (
    <div className="space-y-6">
      <PortalHeader title="PMS Integration Layer" subtitle="Provider abstraction, normalization, sync health, and failover-ready enterprise operational data." />
      <PMSIntegrationManager state={state} />
    </div>
  );
}
