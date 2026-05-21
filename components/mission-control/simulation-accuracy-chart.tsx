import type { MissionControlState } from "@/lib/stability";

export function SimulationAccuracyChart({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Simulation accuracy engine</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Projection reliability from forecast validation</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {state.forecastAccuracy.map(item => (
          <div key={item.id} className="rounded border border-line bg-paper p-4">
            <strong className="text-sm font-black text-ink">{item.forecast_type.replace(/_/g, " ")}</strong>
            <p className="mt-2 text-sm font-semibold text-muted">Variance {Math.abs(item.predicted_value - (item.actual_value ?? item.predicted_value))}</p>
            <div className="mt-3 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-green" style={{ width: `${Math.round(item.quality_score * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
