import type { WorkflowGraph } from "@/lib/runtime/operational-graph";

export function OperationalGraphPanel({ graph }: { graph: WorkflowGraph }) {
  const topNodes = graph.nodes.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Operational graph</p>
          <h2 className="text-2xl font-black text-[#F8FAFC]">Workflow dependency map</h2>
        </div>
        <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-black text-danger">{graph.operationalRisk}/100 risk</span>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {topNodes.map(node => (
          <div key={node.id} className="rounded border border-card bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#F8FAFC]">{node.label}</strong>
              <span className="text-sm font-black uppercase text-accent">{node.type.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{node.domain?.replace(/_/g, " ")} · risk {node.riskScore}/100</p>
          </div>
        ))}
      </div>
    </section>
  );
}
