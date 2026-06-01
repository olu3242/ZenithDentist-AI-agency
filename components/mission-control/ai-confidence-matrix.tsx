import type { MissionControlState } from "@/lib/stability";

export function AIConfidenceMatrix({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-card bg-surface p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-white/55">AI evaluation framework</p>
      <h2 className="mt-1 text-2xl font-black">Grounding quality and confidence calibration</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {state.intelligenceRuns.map(run => (
          <article key={run.id} className="rounded border border-white/10 bg-white/8 p-4">
            <strong className="text-sm font-black text-white">{run.run_type.replace(/_/g, " ")}</strong>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Relevance" value={run.operational_relevance} />
              <Metric label="Benchmark" value={run.benchmark_correctness} />
              <Metric label="Confidence" value={run.confidence} />
              <Metric label="Hallucination" value={1 - run.hallucination_score} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-black text-warning">{Math.round(value * 100)}%</p>
      <p className="text-[11px] font-bold uppercase text-white/50">{label}</p>
    </div>
  );
}
