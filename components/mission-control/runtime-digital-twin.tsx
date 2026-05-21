import type { RuntimeDigitalTwinState } from "@/lib/runtime/digital-twin";

export function RuntimeDigitalTwin({ twin }: { twin: RuntimeDigitalTwinState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Digital Twin</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Runtime stress model</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {twin.runtimeModel.map(layer => (
          <div key={layer.layer} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{layer.layer}</strong>
              <span className="text-sm font-black text-teal">{layer.score}/100</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-rust" style={{ width: `${Math.min(100, layer.pressure)}%` }} />
            </div>
            <p className="mt-2 text-xs font-bold text-muted">pressure {Math.round(layer.pressure)}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3">
        {twin.stressTests.map(test => (
          <div key={test.name} className="flex items-center justify-between rounded border border-line bg-white p-3">
            <span className="text-sm font-black text-ink">{test.name}</span>
            <span className={test.result === "pass" ? "text-xs font-black uppercase text-green" : test.result === "watch" ? "text-xs font-black uppercase text-gold" : "text-xs font-black uppercase text-rust"}>{test.result} · {test.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
