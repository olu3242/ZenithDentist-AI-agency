import type { RuntimeEventFabricState } from "@/lib/runtime/event-fabric";

export function RuntimeEventFabric({ fabric }: { fabric: RuntimeEventFabricState }) {
  return (
    <section className="rounded border border-[#273244] bg-[#0f1115] p-5 text-[#f5f2ed] shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#10b981]">Runtime Event Fabric</p>
          <h2 className="mt-1 text-2xl font-black">Live operational propagation</h2>
        </div>
        <span className="rounded-full bg-[#10b981]/10 px-3 py-1 text-xs font-black text-[#10b981]">{fabric.propagationScore}% propagation</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {fabric.channels.map(channel => (
          <div key={channel.name} className="rounded border border-white/10 bg-[#161a22] p-4">
            <p className="text-xs font-black uppercase tracking-wider text-[#94a3b8]">{channel.name.replace(/_/g, " ")}</p>
            <strong className="mt-2 block text-2xl font-black">{channel.eventCount}</strong>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#c8922a]" style={{ width: `${channel.pressure}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3">
        {fabric.events.slice(0, 6).map(event => (
          <div key={event.eventKey} className="rounded border border-white/10 bg-[#161a22] p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black">{event.sourceSystem.replace(/_/g, " ")} {"->"} {event.targetChannel.replace(/_/g, " ")}</strong>
              <span className={event.priority === "critical" ? "text-xs font-black uppercase text-[#ef4444]" : event.priority === "high" ? "text-xs font-black uppercase text-[#f59e0b]" : "text-xs font-black uppercase text-[#10b981]"}>{event.priority}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#94a3b8]">{event.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
