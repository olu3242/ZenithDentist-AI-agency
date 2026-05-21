import type { OperationalMeshState } from "@/lib/runtime/agent-mesh";

export function RuntimeSwarmViewer({ mesh }: { mesh: OperationalMeshState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Swarm Coordination</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Runtime consensus</h2>
      <div className="mt-5 grid gap-3">
        {mesh.consensus.map(item => (
          <div key={item.consensusKey} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{item.consensusKey.replace(/_/g, " ")}</strong>
              <span className="text-xl font-black text-teal">{item.consensusScore}%</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{item.recommendedAction}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-muted">{item.participatingAgents.map(agent => agent.replace(/_/g, " ")).join(" + ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
