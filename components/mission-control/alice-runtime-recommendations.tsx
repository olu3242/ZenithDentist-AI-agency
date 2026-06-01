import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import { buildOperationalInsights } from "@/lib/alice/operational-intelligence";

export function AliceRuntimeRecommendations({ state }: { state: RuntimeHealthState }) {
  const insights = buildOperationalInsights(state);
  return (
    <section className="rounded border border-card bg-surface p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-white/55">ALICE operational recommendations</p>
      <h2 className="mt-1 text-2xl font-black">Runtime-grounded remediation insights</h2>
      <div className="mt-5 grid gap-3">
        {insights.map(insight => (
          <div key={`${insight.title}-${insight.detail}`} className="rounded border border-white/10 bg-white/8 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-white">{insight.title}</strong>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-warning">{insight.severity}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white/70">{insight.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
