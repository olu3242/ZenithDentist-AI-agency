import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function RuntimeTraceViewer({ state }: { state: RuntimeHealthState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Trace explorer</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Live automation traces</h2>
      <div className="mt-5 grid gap-3">
        {state.traces.length ? state.traces.map(trace => (
          <div key={trace.trace_id} className="grid gap-3 rounded border border-line bg-paper p-4 lg:grid-cols-[1fr_110px_110px_130px] lg:items-center">
            <div>
              <strong className="text-sm font-black text-ink">{trace.workflow_id}</strong>
              <p className="text-sm font-semibold text-muted">{trace.event_name} · {trace.correlation_id}</p>
            </div>
            <span className="text-sm font-black uppercase text-teal">{trace.status}</span>
            <span className="text-sm font-bold text-muted">{trace.latency_ms ?? 0}ms</span>
            <span className="text-xs font-black uppercase text-rust">{trace.failure_category ?? "healthy"}</span>
          </div>
        )) : (
          <div className="rounded border border-line bg-paper p-4 text-sm font-semibold text-muted">
            No live runtime traces yet. Instrumented executions will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
