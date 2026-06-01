import { MetricCard } from "@/components/metric-card";
import { AIInsightsPanel } from "@/components/portal/ai-insights-panel";
import { PortalHeader } from "@/components/portal/portal-header";
import { RecommendationCard } from "@/components/portal/recommendation-card";
import { WorkflowVisualizer } from "@/components/portal/workflow-visualizer";
import { generateOperationalInsights, getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalRecallPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);
  const latest = data.metrics[0];
  return (
    <div className="space-y-6">
      <PortalHeader title="Recall Recovery" subtitle="Recall conversion, lapsed patient recovery, and sequence optimization." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Recovered recalls" value={latest?.recall_recovery_count ?? 0} detail="Patients booked" tone="success" />
        <MetricCard label="Engagement" value={`${latest?.patient_engagement_rate ?? 0}%`} detail="Across recall touches" tone="accent" />
        <MetricCard label="Admin time saved" value={`${latest?.admin_hours_saved ?? 0}h`} detail="From automation" tone="primary" />
      </div>
      <AIInsightsPanel insights={(data.insights.length ? data.insights : generateOperationalInsights(data.metrics, data.automationEvents)).filter(item => item.category === "recall" || item.category === "scheduling")} />
      <WorkflowVisualizer events={data.automationEvents.filter(item => item.workflow === "recall" || item.workflow === "reminders")} />
      <section className="grid gap-4 xl:grid-cols-2">
        {data.recommendations.filter(item => item.title.toLowerCase().includes("recall") || item.recommendation.toLowerCase().includes("recall")).map(item => (
          <RecommendationCard key={item.id} recommendation={item} />
        ))}
      </section>
    </div>
  );
}
