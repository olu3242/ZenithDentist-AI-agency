import { PMSIntegrationManager } from "@/components/enterprise/pms-integration-manager";
import { InternalHeader } from "@/components/internal/internal-header";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export default async function InternalIntegrationsPage() {
  const state = await getEnterpriseCloudState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Enterprise PMS Integrations" subtitle="Provider sync posture, normalization coverage, failover readiness, and PMS abstraction status." />
      <PMSIntegrationManager state={state} />
    </div>
  );
}
