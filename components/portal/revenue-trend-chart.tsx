import type { OperationalMetric } from "@/lib/data/operations";
import { formatCurrency } from "@/lib/utils";

export function RevenueTrendChart({ metrics }: { metrics: OperationalMetric[] }) {
  const data = [...metrics].slice(0, 10).reverse();
  const max = Math.max(1, ...data.map(item => Number(item.recovered_revenue)));
  const points = data.map((item, index) => {
    const x = 20 + index * (360 / Math.max(1, data.length - 1));
    const y = 180 - (Number(item.recovered_revenue) / max) * 145;
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Recovered Revenue Trend</h2>
          <p className="text-sm text-muted">Weekly revenue recovered by operational automations.</p>
        </div>
        <strong className="text-2xl text-green">{formatCurrency(Number(data.at(-1)?.recovered_revenue ?? 0))}</strong>
      </div>
      <svg className="mt-6 h-56 w-full overflow-visible" viewBox="0 0 400 220" role="img" aria-label="Recovered revenue trend chart">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#177f75" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#177f75" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`20,190 ${points} 380,190`} fill="url(#trendFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#177f75" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const x = 20 + index * (360 / Math.max(1, data.length - 1));
          const y = 180 - (Number(item.recovered_revenue) / max) * 145;
          return <circle key={item.id} cx={x} cy={y} r="5" fill="#177f75" />;
        })}
      </svg>
    </section>
  );
}
