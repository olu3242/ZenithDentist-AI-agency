import { AIInsightsPanel } from "@/components/portal/ai-insights-panel";
import { AutomationHealthPanel } from "@/components/portal/automation-health-panel";
import { NotificationCenter } from "@/components/portal/notification-center";
import { OperationalFeed } from "@/components/portal/operational-feed";
import { OperationalScorecard } from "@/components/portal/operational-scorecard";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalReveal } from "@/components/portal/portal-motion";
import { RevenueTrendChart } from "@/components/portal/revenue-trend-chart";
import { WorkflowVisualizer } from "@/components/portal/workflow-visualizer";
import { generateOperationalInsights, getPortalData } from "@/lib/data/operations";
import { BenchmarkPanel } from "@/components/tenant/benchmark-panel";
import { HealthScoreCard } from "@/components/tenant/health-score-card";
import { LocationDashboard } from "@/components/tenant/location-dashboard";
import { OrganizationSwitcher } from "@/components/tenant/organization-switcher";
import { SubscriptionBadge } from "@/components/tenant/subscription-badge";
import { UsageMeter } from "@/components/tenant/usage-meter";
import { getTenantData } from "@/lib/data/tenants";
import { calculatePracticeHealth } from "@/lib/health";

export default async function PortalPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);
  const insights = data.insights.length ? data.insights : generateOperationalInsights(data.metrics, data.automationEvents);
  const health = calculatePracticeHealth(data.metrics, data.automationEvents, tenantData.benchmarks[0]);
  const activePlan = tenantData.plans.find(plan => plan.plan_key === tenantData.organization.active_plan);

  return (
    <PortalReveal>
      <div className="space-y-6">
        <PortalHeader
          title="AI Operations Command Center"
          subtitle="A client-facing revenue intelligence portal showing what Zenith AI Automation Agency is operating, optimizing, and recovering."
        />
        <div className="flex flex-wrap items-center gap-3">
          <SubscriptionBadge plan={tenantData.organization.active_plan} />
          <span className="text-sm font-bold text-muted">{tenantData.organization.onboarding_status.replace("_", " ")} onboarding</span>
        </div>
        <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <OrganizationSwitcher organization={tenantData.organization} locations={tenantData.locations} />
          <HealthScoreCard score={health} />
        </div>
        <OperationalScorecard data={data} />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <RevenueTrendChart metrics={data.metrics} />
          <NotificationCenter notifications={data.notifications} />
        </div>
        <AIInsightsPanel insights={insights} />
        <BenchmarkPanel benchmark={tenantData.benchmarks[0]} />
        <LocationDashboard locations={tenantData.locations} metrics={data.metrics} />
        <UsageMeter usage={tenantData.usage[0]} plan={activePlan} />
        <AutomationHealthPanel events={data.automationEvents} />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <WorkflowVisualizer events={data.automationEvents} />
          <OperationalFeed events={data.automationEvents} />
        </div>
      </div>
    </PortalReveal>
  );
}
