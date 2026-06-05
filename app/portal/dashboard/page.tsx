import { AIInsightsPanel } from "@/components/portal/ai-insights-panel";
import { AutomationHealthPanel } from "@/components/portal/automation-health-panel";
import { OperationalScorecard } from "@/components/portal/operational-scorecard";
import { PerformanceHeatmap } from "@/components/portal/performance-heatmap";
import { DashboardContainer, DashboardGrid, InsightGrid } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { RevenueTrendChart } from "@/components/portal/revenue-trend-chart";
import { ExecutiveDashboardSuite } from "@/components/executive";
import { generateOperationalInsights, getPortalData, summarizePortal } from "@/lib/data/operations";
import { BenchmarkPanel } from "@/components/tenant/benchmark-panel";
import { HealthScoreCard } from "@/components/tenant/health-score-card";
import { PredictiveInsightCard } from "@/components/tenant/predictive-insight-card";
import { getTenantData } from "@/lib/data/tenants";
import { buildPredictiveInsights, calculatePracticeHealth } from "@/lib/health";

export default async function PortalDashboardPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId);
  const health = calculatePracticeHealth(data.metrics, data.automationEvents, tenantData.benchmarks[0]);
  const summary = summarizePortal(data);
  return (
    <DashboardContainer>
      <PortalHeader title="Performance Dashboard" subtitle="No-show reduction, recovered revenue, engagement, reviews, and automation health." />
      <ExecutiveDashboardSuite recoveredRevenue={summary.recoveredRevenue} recoverableRevenue={summary.recoveredRevenue + 54000} />
      <HealthScoreCard score={health} />
      <OperationalScorecard data={data} />
      <DashboardGrid className="xl:grid-cols-[1.2fr_.8fr]">
        <RevenueTrendChart metrics={data.metrics} />
        <PerformanceHeatmap metrics={data.metrics} />
      </DashboardGrid>
      <AIInsightsPanel insights={data.insights.length ? data.insights : generateOperationalInsights(data.metrics, data.automationEvents)} />
      <BenchmarkPanel benchmark={tenantData.benchmarks[0]} />
      <InsightGrid>
        {buildPredictiveInsights(data.metrics).map(insight => <PredictiveInsightCard key={insight.title} insight={insight} />)}
      </InsightGrid>
      <AutomationHealthPanel events={data.automationEvents} />
    </DashboardContainer>
  );
}
