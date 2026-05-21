import { getQueueHealth, type MissionControlState } from "@/lib/stability";

export function QueuePressureMonitor({ state }: { state: MissionControlState }) {
  const health = getQueueHealth(state.queueEvents);
  const rows = [
    { label: "Pending", value: state.queueEvents.filter(event => event.status === "pending").length },
    { label: "Processing", value: health.processing },
    { label: "Failed", value: health.failed },
    { label: "Retries", value: health.retries }
  ];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Queue pressure monitor</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Backlog and recovery pressure</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {rows.map(row => (
          <div key={row.label} className="rounded border border-line bg-paper p-4">
            <p className="text-xs font-black uppercase text-muted">{row.label}</p>
            <p className="mt-2 text-3xl font-black text-teal">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
