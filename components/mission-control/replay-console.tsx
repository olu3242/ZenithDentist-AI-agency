import type { MissionControlState } from "@/lib/stability";

export function ReplayConsole({ state }: { state: MissionControlState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Replay Engine</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Replay requests and failed event recovery</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {state.replayEvents.map(event => (
          <article key={event.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{event.replay_scope.replace(/_/g, " ")}</strong>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black uppercase text-teal">{event.status}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{event.target_pipeline} · {event.replay_reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
