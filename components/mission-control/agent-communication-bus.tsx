import type { OperationalMeshState } from "@/lib/runtime/agent-mesh";

export function AgentCommunicationBus({ mesh }: { mesh: OperationalMeshState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Agent Bus</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Intelligence propagation</h2>
      <div className="mt-5 grid gap-3">
        {mesh.busMessages.length ? mesh.busMessages.map(message => (
          <div key={message.id} className="rounded border border-card bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#F8FAFC]">{message.sourceAgentKey.replace(/_/g, " ")} {"->"} {(message.targetAgentKey ?? "broadcast").replace(/_/g, " ")}</strong>
              <span className={message.priority === "critical" || message.priority === "high" ? "text-xs font-black uppercase text-danger" : "text-xs font-black uppercase text-accent"}>{message.priority}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{message.summary}</p>
          </div>
        )) : (
          <div className="rounded border border-card bg-background p-4 text-sm font-semibold text-muted">No elevated inter-agent messages are present.</div>
        )}
      </div>
    </section>
  );
}
