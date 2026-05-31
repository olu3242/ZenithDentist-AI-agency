import type { MissionControlState } from "@/lib/stability";

export function QueueTopologyMap({ state }: { state: MissionControlState }) {
  const pipelines = ["ingestion", "intelligence", "recommendation", "forecasting", "orchestration", "notification"];
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Queue topology</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Pipeline dependencies and pressure</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {pipelines.map(pipeline => {
          const events = state.queueEvents.filter(event => event.pipeline === pipeline);
          return (
            <div key={pipeline} className="rounded border border-card bg-background p-4">
              <strong className="text-sm font-black text-[#F8FAFC]">{pipeline}</strong>
              <p className="mt-2 text-3xl font-black text-accent">{events.length}</p>
              <p className="text-xs font-bold uppercase text-muted">{events.some(event => event.status === "failed" || event.status === "dead_letter") ? "pressure" : "stable"}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
