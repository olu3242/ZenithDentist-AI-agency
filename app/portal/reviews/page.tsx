import { MetricCard } from "@/components/metric-card";
import { PortalHeader } from "@/components/portal/portal-header";
import { RecommendationCard } from "@/components/portal/recommendation-card";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalReviewsPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);
  const latest = data.metrics[0];
  const conversion = latest ? Math.round((latest.reviews_generated / Math.max(1, latest.review_requests_sent)) * 100) : 0;
  return (
    <div className="space-y-6">
      <PortalHeader title="Review Generation" subtitle="Review request timing, conversion rate, and reputation growth signals." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Requests sent" value={latest?.review_requests_sent ?? 0} detail="Current reporting period" tone="teal" />
        <MetricCard label="Reviews generated" value={latest?.reviews_generated ?? 0} detail="Published or pending" tone="green" />
        <MetricCard label="Review conversion" value={`${conversion}%`} detail="Request to generated review" tone="gold" />
      </div>
      <section className="grid gap-4 xl:grid-cols-2">
        {data.recommendations.filter(item => item.title.toLowerCase().includes("review") || item.recommendation.toLowerCase().includes("review")).map(item => (
          <RecommendationCard key={item.id} recommendation={item} />
        ))}
      </section>
    </div>
  );
}
