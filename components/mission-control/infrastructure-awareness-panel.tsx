import type { InfrastructureAwarenessState } from "@/lib/runtime/operational-cloud";

export function InfrastructureAwarenessPanel({ awareness }: { awareness: InfrastructureAwarenessState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Infrastructure Awareness Layer</p>
          <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Operational ecosystem pressure</h2>
        </div>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">{awareness.globalHealthScore}% global health</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {awareness.tenantPatterns.map(pattern => (
          <div key={pattern.label} className="rounded border border-card bg-background p-4">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{pattern.label}</p>
            <strong className="mt-2 block text-3xl font-black text-[#F8FAFC]">{pattern.score}%</strong>
            <p className="mt-1 text-sm font-semibold text-muted">{pattern.direction}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3">
        {awareness.orchestrationBottlenecks.slice(0, 4).map(item => (
          <div key={item.title} className="rounded border border-card bg-white p-4">
            <strong className="text-sm font-black text-[#F8FAFC]">{item.title}</strong>
            <p className="mt-2 text-sm font-semibold text-muted">{item.recommendation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
