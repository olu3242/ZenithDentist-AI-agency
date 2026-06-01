import type { InsightSnapshot } from "@/lib/data/operations";
import { InsightCard } from "@/components/portal/insight-card";

export function AIInsightsPanel({ insights }: { insights: InsightSnapshot[] }) {
  return (
    <section className="grid gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-accent">Operational Intelligence Layer</p>
        <h2 className="mt-2 text-2xl font-black">AI-style insights and alerts</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {insights.slice(0, 6).map(insight => <InsightCard key={insight.id} insight={insight} />)}
      </div>
    </section>
  );
}
