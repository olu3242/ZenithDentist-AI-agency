import { ForecastAreaChart } from "@/components/charts";
import { ForecastCard } from "@/components/widgets";
import { forecastData } from "@/components/executive/sample-data";

export function ForecastWidget() {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-gold">Forecasting Center</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <ForecastAreaChart data={forecastData} />
        <div className="grid gap-3">
          <ForecastCard label="Forecast Revenue" value="$121K" confidence={88} />
          <ForecastCard label="Forecast Collections" value="$92K" confidence={84} />
        </div>
      </div>
    </section>
  );
}
