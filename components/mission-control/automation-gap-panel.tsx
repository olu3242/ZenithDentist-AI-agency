import type { AutomationAuditState } from "@/lib/automation-audit";

export function AutomationGapPanel({ state }: { state: AutomationAuditState }) {
  return (
    <section className="rounded border border-card bg-surface p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-white/55">Operational gap analysis</p>
      <h2 className="mt-1 text-2xl font-black">Critical gaps and hardening recommendations</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-white/10 bg-white/8 p-4">
          <h3 className="font-black">Critical gaps</h3>
          <ul className="mt-3 grid gap-2 text-sm font-semibold text-white/70">
            {state.criticalGaps.length ? state.criticalGaps.map(gap => <li key={gap}>{gap}</li>) : <li>No critical gaps detected.</li>}
          </ul>
        </div>
        <div className="rounded border border-white/10 bg-white/8 p-4">
          <h3 className="font-black">Recommended hardening</h3>
          <ul className="mt-3 grid gap-2 text-sm font-semibold text-white/70">
            {(state.auditRun.recommendations as string[]).map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
