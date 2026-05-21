import type { OperationalCognitionState } from "@/lib/runtime/operational-cognition";

export function RuntimeCognitionPanel({ cognition }: { cognition: OperationalCognitionState }) {
  return (
    <section className="rounded border border-[#273244] bg-[#161a22] p-5 text-[#f5f2ed] shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-[#1a7a6e]">Operational Cognition Layer</p>
      <h2 className="mt-1 text-2xl font-black">{cognition.cognitionScore}% cognition score</h2>
      <p className="mt-3 text-sm font-semibold text-[#94a3b8]">{cognition.infrastructureNarrative}</p>
      <div className="mt-5 grid gap-3">
        {cognition.anomalyCorrelations.map(item => (
          <div key={item.title} className="rounded border border-white/10 bg-[#1d2330] p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black">{item.title}</strong>
              <span className="text-xs font-black text-[#10b981]">{item.confidence}%</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#94a3b8]">{item.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
