import type { AutomationAuditState } from "@/lib/automation-audit";

export function AutomationDomainMatrix({ state }: { state: AutomationAuditState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Master automation domains</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">End-to-end operational coverage by domain</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {state.domainCoverage.map(domain => (
          <div key={domain.domain} className="rounded border border-card bg-background p-4">
            <strong className="block text-sm font-black text-[#F8FAFC]">{domain.domain.replace(/_/g, " ")}</strong>
            <p className="mt-3 text-3xl font-black text-accent">{domain.score}%</p>
            <p className="mt-1 text-sm font-semibold text-muted">{domain.complete}/{domain.total} complete</p>
            <div className="mt-3 h-2 rounded-full bg-line">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${domain.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
