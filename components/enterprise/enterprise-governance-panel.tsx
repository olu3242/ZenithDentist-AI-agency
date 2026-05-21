import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function EnterpriseGovernancePanel({ state }: { state: EnterpriseCloudState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Enterprise governance systems</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Approval chains, rollback controls, and audit-safe intelligence</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {state.governance.map(record => (
          <article key={record.id} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{record.governed_object_type.replace(/_/g, " ")}</strong>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black uppercase text-rust">{record.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-muted">{record.audit_notes}</p>
            <div className="mt-4 grid gap-2 text-xs font-black uppercase tracking-wider text-teal">
              {(record.risk_controls as string[]).map(item => <span key={item}>{item}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
