import type { OperationalMetric } from "@/lib/data/operations";

export function OperationalTrendChart({ metrics, field, label }: { metrics: OperationalMetric[]; field: keyof OperationalMetric; label: string }) {
  const data = [...metrics].slice(0, 8).reverse();
  const max = Math.max(1, ...data.map(item => Number(item[field] ?? 0)));
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">{label}</h2>
      <div className="mt-5 grid h-52 grid-cols-8 items-end gap-2 border-b border-card">
        {data.map(item => {
          const value = Number(item[field] ?? 0);
          return (
            <div key={`${item.id}-${String(field)}`} className="relative rounded-t bg-accent" style={{ height: `${Math.max(8, (value / max) * 190)}px` }}>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-muted">{Math.round(value)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
