import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function OperationalKnowledgeGraph({ state }: { state: EnterpriseCloudState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Healthcare knowledge graph</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Hidden relationships across operational outcomes</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <div className="grid gap-3">
          {state.graph.nodes.map(node => (
            <div key={node.id} className="rounded border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm font-black text-ink">{node.label}</strong>
                <span className="text-xs font-black uppercase text-teal">{node.node_type}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-muted">{Math.round(node.confidence * 100)}% pattern confidence</p>
            </div>
          ))}
        </div>
        <div className="rounded border border-line bg-ink p-5 text-white">
          <h3 className="font-black">Correlation map</h3>
          <div className="mt-4 grid gap-3">
            {state.graph.edges.map(edge => {
              const source = state.graph.nodes.find(node => node.id === edge.source_node_id)?.label ?? "Source";
              const target = state.graph.nodes.find(node => node.id === edge.target_node_id)?.label ?? "Target";
              return (
                <div key={edge.id} className="rounded border border-white/10 bg-white/8 p-3">
                  <p className="text-sm font-bold text-white">{source}</p>
                  <p className="text-xs font-black uppercase tracking-wider text-gold">{edge.relationship_type} · {Math.round(edge.weight * 100)}%</p>
                  <p className="text-sm font-bold text-white/70">{target}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
