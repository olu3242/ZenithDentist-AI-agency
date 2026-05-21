import { PerformanceHeatmap } from "@/components/portal/performance-heatmap";
import { PortalHeader } from "@/components/portal/portal-header";
import { RecommendationCard } from "@/components/portal/recommendation-card";
import { getPortalData } from "@/lib/data/operations";

export default async function PortalPatientsPage() {
  const data = await getPortalData();
  return (
    <div className="space-y-6">
      <PortalHeader title="Patient Engagement" subtitle="Patient response patterns, schedule risk, and high-value recovery segments." />
      <PerformanceHeatmap metrics={data.metrics} />
      <section className="grid gap-4 xl:grid-cols-2">
        {data.recommendations.filter(item => item.title.toLowerCase().includes("patient") || item.recommendation.toLowerCase().includes("patient")).map(item => (
          <RecommendationCard key={item.id} recommendation={item} />
        ))}
      </section>
    </div>
  );
}
