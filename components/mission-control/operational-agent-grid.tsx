import type { OperationalMeshState } from "@/lib/runtime/agent-mesh";

export function OperationalAgentGrid({ mesh }: { mesh: OperationalMeshState }) {
  return (
    <section className="rounded border border-[#273244] bg-[#0f1115] p-5 text-[#f5f2ed] shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#10b981]">Operational Intelligence Mesh</p>
          <h2 className="mt-1 text-2xl font-black">Distributed operational agents</h2>
        </div>
        <span className="rounded-full bg-[#10b981]/10 px-3 py-1 text-xs font-black text-[#10b981]">{mesh.coordinationScore}% coordination</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {mesh.agents.map(agent => (
          <div key={agent.key} className="rounded border border-white/10 bg-[#161a22] p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="truncate text-sm font-black">{agent.name}</strong>
              <span className={agent.status === "escalating" ? "text-xs font-black uppercase text-[#ef4444]" : agent.status === "coordinating" ? "text-xs font-black uppercase text-[#f59e0b]" : "text-xs font-black uppercase text-[#10b981]"}>
                {agent.status}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#94a3b8]">{agent.currentSignal}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#1a7a6e]" style={{ width: `${agent.confidence}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
