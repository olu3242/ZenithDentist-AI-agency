import type { GovernanceState } from "@/lib/runtime/governance";

export function AuditTimeline({ governance }: { governance: GovernanceState }) {
  const derived = governance.auditTimeline.length
    ? governance.auditTimeline
    : governance.replayGovernance.slice(0, 6).map(item => ({
        id: `derived-${item.traceId}`,
        title: `${item.workflowId} governance evaluation`,
        description: `${item.decision.replace(/_/g, " ")} with ${item.signOffPath.join(" -> ")}.`,
        severity: item.riskLevel,
        created_at: new Date().toISOString()
      }));
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Audit Timeline</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Governance history</h2>
      <div className="mt-5 border-l border-card pl-4">
        {derived.map(item => (
          <div key={item.id} className="mb-5 last:mb-0">
            <p className="text-xs font-black uppercase tracking-wider text-accent">{item.severity}</p>
            <strong className="mt-1 block text-sm font-black text-[#F8FAFC]">{item.title}</strong>
            <p className="mt-1 text-sm font-semibold text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
