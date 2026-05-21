import type { MissionControlState } from "@/lib/stability";

export function ForecastDriftRadar({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Forecast validation</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Projected vs actual outcome drift</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {state.forecastAccuracy.map(item => (
          <article key={item.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{item.forecast_type.replace(/_/g, " ")}</strong>
              <span className="text-xl font-black text-rust">{Math.round(item.drift_score * 100)}%</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">Predicted {item.predicted_value}, actual {item.actual_value ?? "pending"} · quality {Math.round(item.quality_score * 100)}%</p>
            <div className="mt-4 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-rust" style={{ width: `${Math.round(item.drift_score * 100)}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
