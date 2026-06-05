import { AppShell } from "@/components/app/app-shell";
import { PersonaCommandCenter } from "@/components/dashboard/persona-command-center";
import { ExecutiveDashboardSuite } from "@/components/executive";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getAdminDashboardData } from "@/lib/data/leads";
import { getTenantData } from "@/lib/data/tenants";
import { getPersonaForRole } from "@/lib/personas";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function DashboardPage() {
  const tenantData = await getTenantData();
  const [admin, runtime, automationOS, role] = await Promise.all([
    getAdminDashboardData(tenantData.tenant.organizationId ?? undefined),
    getRuntimeHealthState(),
    getAutomationOSState(),
    getCurrentZenithRole("staff")
  ]);
  const persona = getPersonaForRole(role);
  const recoveredRevenue = admin.opportunities.reduce((total, item) => total + Number(item.estimated_recovery ?? 0), 0);
  const recoverableRevenue = admin.opportunities.reduce((total, item) => total + Number(item.pipeline_value ?? item.estimated_recovery ?? 0), 0);

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="space-y-6">
        <PersonaCommandCenter persona={persona} tenantData={tenantData} admin={admin} runtime={runtime} automationOS={automationOS} />
        <ExecutiveDashboardSuite recoveredRevenue={recoveredRevenue} recoverableRevenue={recoverableRevenue} />
      </div>
    </AppShell>
  );
}
