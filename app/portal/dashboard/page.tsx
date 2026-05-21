import { AIInsightsPanel } from "@/components/portal/ai-insights-panel";
import { AutomationHealthPanel } from "@/components/portal/automation-health-panel";
import { OperationalScorecard } from "@/components/portal/operational-scorecard";
import { PerformanceHeatmap } from "@/components/portal/performance-heatmap";
import { PortalHeader } from "@/components/portal/portal-header";
import { RevenueTrendChart } from "@/components/portal/revenue-trend-chart";
import { generateOperationalInsights, getPortalData } from "@/lib/data/operations";

export default async function PortalDashboardPage() {
  const data = await getPortalData();
  return (
    <div className="space-y-6">
      <PortalHeader title="Performance Dashboard" subtitle="No-show reduction, recovered revenue, engagement, reviews, and automation health." />
      <OperationalScorecard data={data} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <RevenueTrendChart metrics={data.metrics} />
        <PerformanceHeatmap metrics={data.metrics} />
      </div>
      <AIInsightsPanel insights={data.insights.length ? data.insights : generateOperationalInsights(data.metrics, data.automationEvents)} />
      <AutomationHealthPanel events={data.automationEvents} />
    </div>
  );
}
