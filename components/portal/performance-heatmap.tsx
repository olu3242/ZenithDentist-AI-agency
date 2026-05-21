import type { OperationalMetric } from "@/lib/data/operations";

export function PerformanceHeatmap({ metrics }: { metrics: OperationalMetric[] }) {
  const rows = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const slots = ["AM", "Midday", "PM", "Late"];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Performance Heatmap</h2>
      <p className="text-sm text-muted">Cancellation risk and engagement intensity by daypart.</p>
      <div className="mt-5 grid gap-2">
        {rows.map((row, rowIndex) => (
          <div key={row} className="grid grid-cols-[70px_repeat(4,1fr)] gap-2">
            <span className="py-3 text-sm font-bold text-muted">{row}</span>
            {slots.map((slot, slotIndex) => {
              const intensity = ((rowIndex + 1) * (slotIndex + 2) + Number(metrics[0]?.no_show_rate ?? 8)) % 10;
              return (
                <div
                  key={slot}
                  className="rounded p-3 text-center text-xs font-black"
                  style={{ background: `rgba(23,127,117,${0.12 + intensity / 16})`, color: intensity > 5 ? "white" : "#18212f" }}
                >
                  {slot}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
