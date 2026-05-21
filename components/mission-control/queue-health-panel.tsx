import { getQueueHealth, type MissionControlState } from "@/lib/stability";

export function QueueHealthPanel({ state }: { state: MissionControlState }) {
  const health = getQueueHealth(state.queueEvents);
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Queue observability</p>
          <h2 className="text-2xl font-black text-ink">Pipeline health and retry pressure</h2>
        </div>
        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">{health.stability}% stable</span>
      </div>
      <div className="mt-5 grid gap-3">
        {state.queueEvents.map(event => (
          <div key={event.id} className="grid gap-3 rounded border border-line bg-paper p-4 md:grid-cols-[1fr_110px_90px_120px] md:items-center">
            <div>
              <strong className="text-sm font-black text-ink">{event.pipeline}</strong>
              <p className="text-sm font-semibold text-muted">{event.idempotency_key}</p>
            </div>
            <span className="text-sm font-black uppercase text-teal">{event.status}</span>
            <span className="text-sm font-bold text-muted">{event.attempt_count}/{event.max_attempts}</span>
            <span className="text-xs font-black uppercase text-rust">{event.dead_letter_reason ? "recovery needed" : "healthy"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
