import type { MissionControlState } from "@/lib/stability";

export function AIConfidenceTimeline({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">AI confidence monitoring</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Confidence movement by evaluation run</h2>
      <div className="mt-5 grid gap-3">
        {state.intelligenceRuns.map(run => (
          <div key={run.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between">
              <strong className="text-sm font-black text-ink">{run.run_type.replace(/_/g, " ")}</strong>
              <span className="text-xl font-black text-teal">{Math.round(run.confidence * 100)}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-teal" style={{ width: `${Math.round(run.confidence * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
