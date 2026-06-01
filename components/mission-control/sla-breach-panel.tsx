import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function SlaBreachPanel({ state }: { state: RuntimeHealthState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">SLA breach visualization</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Workflows exceeding runtime thresholds</h2>
      <div className="mt-5 grid gap-3">
        {state.slaBreaches.length ? state.slaBreaches.map(trace => (
          <div key={trace.trace_id} className="rounded border border-card bg-background p-4">
            <strong className="text-sm font-black text-[#F8FAFC]">{trace.workflow_id}</strong>
            <p className="mt-1 text-sm font-semibold text-muted">{trace.latency_ms ?? 0}ms latency · {trace.event_name}</p>
          </div>
        )) : (
          <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No SLA breaches detected in live runtime data.</div>
        )}
      </div>
    </section>
  );
}
