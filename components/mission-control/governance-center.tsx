import type { GovernanceState } from "@/lib/runtime/governance";

export function GovernanceCenter({ governance }: { governance: GovernanceState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Governance</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Policy controls and replay authorization</h2>
        </div>
        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">{governance.trustScore}% trust</span>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {governance.rules.map(rule => (
          <div key={rule.key} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{rule.name}</strong>
              <span className={rule.approvalRequired ? "text-xs font-black uppercase text-rust" : "text-xs font-black uppercase text-green"}>
                {rule.approvalRequired ? "approval gated" : "policy allowed"}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{rule.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3">
        {governance.replayGovernance.slice(0, 5).map(item => (
          <div key={item.traceId} className="rounded border border-line bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-ink">{item.workflowId}</strong>
              <span className="text-xs font-black uppercase text-teal">{item.decision.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{item.signOffPath.join(" -> ")} · {item.riskLevel} risk</p>
          </div>
        ))}
      </div>
    </section>
  );
}
