import type { getBusinessGrowthState } from "@/lib/gtm/business-growth";

type BusinessGrowthState = Awaited<ReturnType<typeof getBusinessGrowthState>>;

export function LeadScoringPanel({ state }: { state: BusinessGrowthState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Lead scoring engine</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Priority prospects</h2>
      <div className="mt-5 grid gap-3">
        {state.leadScores.length ? state.leadScores.map(lead => (
          <div key={lead.id} className="grid gap-3 rounded border border-line bg-paper p-4 md:grid-cols-[1fr_90px_160px] md:items-center">
            <div>
              <strong className="text-sm font-black text-ink">{lead.practiceName}</strong>
              <p className="mt-1 text-sm font-semibold text-muted">{lead.angle}</p>
            </div>
            <span className="text-2xl font-black text-teal">{lead.score}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-muted">{lead.nextAction}</span>
          </div>
        )) : (
          <div className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">No prospects are available yet.</div>
        )}
      </div>
    </section>
  );
}
