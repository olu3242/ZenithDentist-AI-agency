import type { AutomationAuditState } from "@/lib/automation-audit";

export function E2EChecklistPanel({ state }: { state: AutomationAuditState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Final E2E automation checklist</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Infrastructure controls required for production-grade intelligence</h2>
      <div className="mt-5 grid gap-3">
        {state.e2eChecklist.map(item => (
          <div key={item.label} className="flex flex-col gap-2 rounded border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong className="text-sm font-black text-ink">{item.label}</strong>
              <p className="mt-1 text-sm font-semibold text-muted">{item.detail}</p>
            </div>
            <span className={item.complete ? "rounded-full bg-green/10 px-3 py-1 text-xs font-black uppercase text-green" : "rounded-full bg-rust/10 px-3 py-1 text-xs font-black uppercase text-rust"}>
              {item.complete ? "complete" : "needs work"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
