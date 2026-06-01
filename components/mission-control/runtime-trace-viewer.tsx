import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function RuntimeTraceViewer({ state }: { state: RuntimeHealthState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Trace explorer</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Live automation traces</h2>
      <div className="mt-5 grid gap-3">
        {state.traces.length ? state.traces.map(trace => (
          <div key={trace.trace_id} className="grid gap-3 rounded border border-card bg-background p-4 lg:grid-cols-[1fr_110px_110px_130px] lg:items-center">
            <div>
              <strong className="text-sm font-black text-[#F8FAFC]">{trace.workflow_id}</strong>
              <p className="text-sm font-semibold text-muted">{trace.event_name} · {trace.correlation_id}</p>
            </div>
            <span className="text-sm font-black uppercase text-accent">{trace.status}</span>
            <span className="text-sm font-bold text-muted">{trace.latency_ms ?? 0}ms</span>
            <span className="text-xs font-black uppercase text-danger">{trace.failure_category ?? "healthy"}</span>
          </div>
        )) : (
          <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">
            No live runtime traces yet. Instrumented executions will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
