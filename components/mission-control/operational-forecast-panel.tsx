import type { RuntimeForecast } from "@/lib/runtime/operational-forecasting";

export function OperationalForecastPanel({ forecasts }: { forecasts: RuntimeForecast[] }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Forecasting</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">SLA defense and runtime risk</h2>
      <div className="mt-5 grid gap-3">
        {forecasts.slice(0, 7).map(forecast => (
          <div key={forecast.id} className="rounded border border-card bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#F8FAFC]">{forecast.title}</strong>
              <span className={forecast.impact === "CRITICAL" || forecast.impact === "HIGH" ? "text-xs font-black text-danger" : "text-xs font-black text-accent"}>
                {forecast.probability}%
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-line">
              <div className="h-full rounded-full bg-warning" style={{ width: `${forecast.probability}%` }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{forecast.recommendation}</p>
          </div>
        ))}
        {!forecasts.length ? <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No elevated runtime forecasts are present.</div> : null}
      </div>
    </section>
  );
}
