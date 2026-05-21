import type { MissionControlState } from "@/lib/stability";

export function IntelligenceBenchmarkBoard({ state }: { state: MissionControlState }) {
  const rows = [
    { label: "Forecast quality", value: state.health.forecast_quality_score },
    { label: "Recommendation quality", value: Math.round((state.recommendationLineage[0]?.historical_effectiveness ?? 0.82) * 100) },
    { label: "Orchestration efficiency", value: state.health.orchestration_health },
    { label: "Anomaly precision", value: Math.round((state.anomalyValidations[0]?.precision_score ?? 0.84) * 100) }
  ];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Intelligence benchmarking</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Quality benchmarks for trusted operational intelligence</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        {rows.map(row => (
          <div key={row.label} className="rounded border border-line bg-paper p-4">
            <p className="text-sm font-black text-ink">{row.label}</p>
            <p className="mt-2 text-3xl font-black text-teal">{row.value}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}
