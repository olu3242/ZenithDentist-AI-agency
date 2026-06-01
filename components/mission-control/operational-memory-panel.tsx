import type { OperationalMemoryState } from "@/lib/runtime/operational-memory";

export function OperationalMemoryPanel({ memory }: { memory: OperationalMemoryState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational memory</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Recurring intelligence signals</h2>
      <div className="mt-5 grid gap-3">
        {[...memory.candidates, ...memory.persisted.map(item => ({
          memoryType: item.memory_type,
          title: item.title,
          summary: item.summary,
          confidence: Math.round(item.confidence * 100)
        }))].slice(0, 8).map(item => (
          <div key={`${item.memoryType}-${item.title}`} className="rounded border border-card bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#F8FAFC]">{item.title}</strong>
              <span className="text-xs font-black text-accent">{item.confidence}%</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{item.summary}</p>
          </div>
        ))}
        {!memory.candidates.length && !memory.persisted.length ? (
          <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No recurring runtime memory signals are present.</div>
        ) : null}
      </div>
    </section>
  );
}
