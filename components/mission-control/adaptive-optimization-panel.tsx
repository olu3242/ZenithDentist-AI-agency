import type { MissionControlState } from "@/lib/stability";

export function AdaptiveOptimizationPanel({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Adaptive intelligence</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Continuous improvement signals</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Signal label="Timing calibration" value="Improving" />
        <Signal label="Risk thresholds" value={`${Math.round((state.anomalyValidations[0]?.precision_score ?? 0.84) * 100)}% precision`} />
        <Signal label="Prioritization" value={`${Math.round((state.recommendationLineage[0]?.confidence_score ?? 0.86) * 100)}% confidence`} />
      </div>
    </section>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-card bg-background p-4">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-2 text-xl font-black text-[#F8FAFC]">{value}</p>
    </div>
  );
}
