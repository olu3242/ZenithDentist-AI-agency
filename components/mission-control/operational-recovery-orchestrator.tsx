import type { RecoveryOrchestratorState } from "@/lib/runtime/recovery-orchestrator";

export function OperationalRecoveryOrchestrator({ orchestrator }: { orchestrator: RecoveryOrchestratorState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Recovery Orchestrator</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Mitigation sequencing</h2>
        </div>
        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-black text-teal">{orchestrator.stabilizationScore}% stabilization</span>
      </div>
      <div className="mt-5 grid gap-3">
        {orchestrator.plans.slice(0, 6).map(plan => (
          <div key={plan.orchestrationKey} className="rounded border border-line bg-paper p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black text-ink">{plan.title}</strong>
              <span className={plan.status === "blocked" ? "text-xs font-black uppercase text-rust" : plan.status === "approval_required" ? "text-xs font-black uppercase text-gold" : "text-xs font-black uppercase text-green"}>{plan.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{plan.expectedOutcome}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.mitigationCheckpoints.slice(0, 4).map(step => (
                <span key={step} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted">{step}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
