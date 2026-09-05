import { AppShell } from "@/components/app/app-shell";
import { FlowControlCenter } from "@/components/flow-orchestration/flow-control-center";
import { getTenantData } from "@/lib/data/tenants";
import { getFlowControlCenterSnapshot } from "@/lib/flow-orchestration/control-center";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function FlowOSPage() {
  const [tenantData, role] = await Promise.all([
    getTenantData(),
    getCurrentZenithRole("super_admin")
  ]);
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const snapshot = await getFlowControlCenterSnapshot(organizationId);

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <FlowControlCenter snapshot={snapshot} />
    </AppShell>
  );
}
