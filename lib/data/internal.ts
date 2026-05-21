import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { calculatePracticeHealth } from "@/lib/health";

export async function getInternalPlatformData() {
  const [tenantData, portalData] = await Promise.all([getTenantData(), getPortalData()]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  const activeOrganizations = 1;
  const activePlan = tenantData.plans.find(plan => plan.plan_key === tenantData.organization.active_plan);
  const mrr = Number(activePlan?.price_monthly ?? 0);
  const churnRisk = health.overall < 70 ? "elevated" : "low";

  return {
    tenantData,
    portalData,
    health,
    activeOrganizations,
    mrr,
    platformHealth: Math.round((health.overall + 96) / 2),
    churnRisk,
    orgGrowth: 18,
    funnelPerformance: 42
  };
}
