import type { EnterpriseForecast } from "@/lib/enterprise-cloud";

export function ForecastingRadar({ forecasts }: { forecasts: EnterpriseForecast[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Predictive operational infrastructure</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Enterprise forecast radar</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {forecasts.map(forecast => (
          <article key={forecast.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{forecast.forecast_type.replace(/_/g, " ")}</strong>
              <span className="text-xl font-black text-rust">{Math.round(forecast.probability * 100)}%</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-muted">{String((forecast.projected_impact as { summary?: string }).summary ?? "Operational impact forecasted")}</p>
            <div className="mt-4 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-rust" style={{ width: `${Math.round(forecast.probability * 100)}%` }} />
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-wider text-teal">{Math.round(forecast.confidence * 100)}% confidence</p>
          </article>
        ))}
      </div>
    </section>
  );
}
