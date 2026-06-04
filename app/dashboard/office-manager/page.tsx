import { AppShell } from "@/components/app/app-shell";
import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { getTenantData } from "@/lib/data/tenants";
import { getRoleDashboardState } from "@/lib/role-dashboard";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function OfficeManagerDashboardPage() {
  const [state, tenantData, role] = await Promise.all([getRoleDashboardState(), getTenantData(), getCurrentZenithRole("staff")]);
  return <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}><RoleDashboard roleKey="office-manager" {...state} /></AppShell>;
}
