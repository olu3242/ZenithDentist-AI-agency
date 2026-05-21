import { gtmStages, type getBusinessGrowthState } from "@/lib/gtm/business-growth";

type BusinessGrowthState = Awaited<ReturnType<typeof getBusinessGrowthState>>;

export function SalesPipeline({ state }: { state: BusinessGrowthState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Sales Pipeline</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Client acquisition stages</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {gtmStages.map(stage => (
          <div key={stage} className="rounded border border-line bg-paper p-4">
            <p className="text-sm font-black text-ink">{stage}</p>
            <p className="mt-2 text-3xl font-black text-teal">{state.stageCounts[stage]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
