import type { MissionControlState } from "@/lib/stability";

export function RecommendationAuditPanel({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Recommendation effectiveness tracking</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Explainability, outcomes, and calibration quality</h2>
      <div className="mt-5 grid gap-3">
        {state.recommendationLineage.map(item => (
          <div key={item.id} className="rounded border border-card bg-background p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_120px_120px] md:items-center">
              <div>
                <strong className="text-sm font-black text-[#F8FAFC]">{item.operational_reasoning}</strong>
                <p className="mt-1 text-sm font-semibold text-muted">{item.expected_outcome}</p>
              </div>
              <span className="text-sm font-black text-accent">{Math.round(item.confidence_score * 100)}% confidence</span>
              <span className="text-sm font-black text-success">{Math.round(item.historical_effectiveness * 100)}% effective</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
