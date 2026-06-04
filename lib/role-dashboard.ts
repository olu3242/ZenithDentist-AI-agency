import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getAdminDashboardData } from "@/lib/data/leads";
import { generateOperationalInsights, getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export async function getRoleDashboardState() {
  const [portal, admin, runtime, tenantData, automationOS] = await Promise.all([
    getPortalData(),
    getAdminDashboardData(),
    getRuntimeHealthState(),
    getTenantData(),
    getAutomationOSState()
  ]);

  return {
    portal,
    admin,
    runtime,
    tenantData,
    automationOS,
    insights: portal.insights.length ? portal.insights : generateOperationalInsights(portal.metrics, portal.automationEvents)
  };
}
