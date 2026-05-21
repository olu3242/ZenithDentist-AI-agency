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

export default async function PortalPage() {
  const data = await getPortalData();
  const insights = data.insights.length ? data.insights : generateOperationalInsights(data.metrics, data.automationEvents);

  return (
    <PortalReveal>
      <div className="space-y-6">
        <PortalHeader
          title="AI Operations Command Center"
          subtitle="A client-facing revenue intelligence portal showing what Zenith AI is operating, optimizing, and recovering."
        />
        <OperationalScorecard data={data} />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <RevenueTrendChart metrics={data.metrics} />
          <NotificationCenter notifications={data.notifications} />
        </div>
        <AIInsightsPanel insights={insights} />
        <AutomationHealthPanel events={data.automationEvents} />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <WorkflowVisualizer events={data.automationEvents} />
          <OperationalFeed events={data.automationEvents} />
        </div>
      </div>
    </PortalReveal>
  );
}
