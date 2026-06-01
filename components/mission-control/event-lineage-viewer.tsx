import type { MissionControlState } from "@/lib/stability";

export function EventLineageViewer({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational lineage tracing</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Recommendation origins and supporting signals</h2>
      <div className="mt-5 grid gap-4">
        {state.recommendationLineage.map(item => (
          <article key={item.id} className="rounded border border-card bg-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-[#F8FAFC]">{item.expected_outcome}</strong>
              <span className="text-sm font-black text-accent">{Math.round(item.confidence_score * 100)}% confidence</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-muted">{item.operational_reasoning}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(item.source_signals as string[]).map(signal => (
                <span key={signal} className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-muted">{signal}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
