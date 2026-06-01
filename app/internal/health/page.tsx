import { HealthScoreCard } from "@/components/tenant/health-score-card";
import { InternalHeader } from "@/components/internal/internal-header";
import { PredictiveInsightCard } from "@/components/tenant/predictive-insight-card";
import { getInternalPlatformData } from "@/lib/data/internal";
import { buildPredictiveInsights } from "@/lib/health";

export default async function InternalHealthPage() {
  const { health, portalData, churnRisk } = await getInternalPlatformData();
  return (
    <div className="space-y-6">
      <InternalHeader title="Practice Health Engine" subtitle="Cross-tenant operational scoring, churn-risk indicators, and predictive operating signals." />
      <HealthScoreCard score={health} />
      <div className="rounded border border-card bg-white p-5 font-bold">Churn risk indicator: <span className="text-accent">{churnRisk}</span></div>
      <section className="grid gap-4 xl:grid-cols-3">
        {buildPredictiveInsights(portalData.metrics).map(insight => <PredictiveInsightCard key={insight.title} insight={insight} />)}
      </section>
    </div>
  );
}
