import { MetricCard } from "@/components/metric-card";
import { DashboardContainer, InsightGrid, KpiGrid } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { RecommendationCard } from "@/components/portal/recommendation-card";
import { CommandCenterV2 } from "@/components/workflow/command-center-v2";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { buildUniversalActions } from "@/lib/action-engine";
import { getAdminDashboardData } from "@/lib/data/leads";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export default async function PortalReviewsPage() {
  const [tenantData, runtime, automationOS] = await Promise.all([
    getTenantData(),
    getRuntimeHealthState(),
    getAutomationOSState()
  ]);
  const data = await getPortalData(tenantData.tenant.organizationId);
  const admin = await getAdminDashboardData(tenantData.tenant.organizationId ?? undefined);
  const latest = data.metrics[0];
  const conversion = latest ? Math.round((latest.reviews_generated / Math.max(1, latest.review_requests_sent)) * 100) : 0;
  return (
    <DashboardContainer>
      <CommandCenterV2
        title="Growth Command Center"
        subtitle="Review score, referral performance, lead funnel, and conversion metrics with campaign launch actions."
        sections={[
          { label: "Review Score", workflowId: "review_request_due", value: `${conversion}%`, detail: "Review request to generated review conversion" },
          { label: "Referral Performance", workflowId: "referral_growth", value: latest?.reviews_generated ?? 0, detail: "Promoter and reputation momentum proxy" },
          { label: "Lead Funnel", workflowId: "lead_created", value: admin.leads.length, detail: "Assessment and lead records ready for nurture" },
          { label: "Conversion Metrics", workflowId: "alice_growth_agent", value: `${conversion}%`, detail: "AI Revenue Intelligence prioritization signal" }
        ]}
        actions={buildUniversalActions("growth")}
        tenantData={tenantData}
        admin={admin}
        runtime={runtime}
        automationOS={automationOS}
        returnTo="/portal/reviews"
      />
      <PortalHeader title="Review Generation Drilldown" subtitle="Review request timing, conversion rate, and reputation growth signals." />
      <KpiGrid className="xl:grid-cols-3">
        <MetricCard label="Requests sent" value={latest?.review_requests_sent ?? 0} detail="Current reporting period" tone="teal" />
        <MetricCard label="Reviews generated" value={latest?.reviews_generated ?? 0} detail="Published or pending" tone="green" />
        <MetricCard label="Review conversion" value={`${conversion}%`} detail="Request to generated review" tone="gold" />
      </KpiGrid>
      <InsightGrid className="xl:grid-cols-2">
        {data.recommendations.filter(item => item.title.toLowerCase().includes("review") || item.recommendation.toLowerCase().includes("review")).map(item => (
          <RecommendationCard key={item.id} recommendation={item} />
        ))}
      </InsightGrid>
    </DashboardContainer>
  );
}
