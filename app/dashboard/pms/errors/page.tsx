import { AppShell } from "@/components/app/app-shell";
import { PMSOperationsCenter } from "@/components/dashboard/pms-operations-center";
import { getTenantData } from "@/lib/data/tenants";
import { getPMSOperationsState } from "@/lib/pms-operations";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function PMSErrorsPage() {
  const [state, tenantData, role] = await Promise.all([getPMSOperationsState(), getTenantData(), getCurrentZenithRole("staff")]);
  return <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}><PMSOperationsCenter state={state} section="errors" /></AppShell>;
}
