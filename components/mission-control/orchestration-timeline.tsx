import type { MissionControlState } from "@/lib/stability";

export function OrchestrationTimeline({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Orchestration visibility</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Sequence trace and dependency state</h2>
      <div className="mt-5 grid gap-3">
        {state.orchestrationLogs.map(log => (
          <div key={log.id} className="rounded border border-line bg-paper p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-ink">{log.sequence_name} · {log.step_name}</strong>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-teal">{log.status}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">Correlation {log.correlation_id}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
