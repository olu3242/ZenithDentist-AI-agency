import type { getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export async function RevenueOrchestrationPanel({ state }: { state: Awaited<ReturnType<typeof getRevenueOrchestrationState>> }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Revenue Orchestration Intelligence Layer</p>
          <h2 className="text-2xl font-black text-ink">Recovery opportunities ranked by operational impact</h2>
        </div>
        <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-black text-green">{state.autonomousConfidence}% autonomous confidence</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {state.prioritizedRecoveries.map(item => (
          <article key={item.label} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-base font-black text-ink">{item.label}</strong>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black uppercase text-rust">{item.priority}</span>
            </div>
            <p className="mt-4 text-3xl font-black text-teal">{item.value}</p>
            <p className="mt-2 text-sm font-semibold text-muted">{Math.round(item.confidence * 100)}% recommendation reliability</p>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-line p-4">
          <h3 className="font-black text-ink">Detected bottlenecks</h3>
          <ul className="mt-3 grid gap-2 text-sm font-semibold text-muted">
            {(state.bottlenecks as string[]).map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded border border-line p-4">
          <h3 className="font-black text-ink">Recommended coordination</h3>
          <ul className="mt-3 grid gap-2 text-sm font-semibold text-muted">
            {(state.recommendations as string[]).map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
