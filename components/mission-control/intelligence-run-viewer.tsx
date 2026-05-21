import type { MissionControlState } from "@/lib/stability";

export function IntelligenceRunViewer({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational intelligence accuracy layer</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Evaluation runs and grounding sources</h2>
      <div className="mt-5 grid gap-3">
        {state.intelligenceRuns.map(run => (
          <article key={run.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{run.run_type.replace(/_/g, " ")}</strong>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black uppercase text-teal">{run.status}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{run.output_summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(run.grounding_sources as string[]).map(source => (
                <span key={source} className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-muted">{source}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
