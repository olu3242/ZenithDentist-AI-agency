import type { AutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";

export function AutonomousRecoveryCenter({ recovery }: { recovery: AutonomousRecoveryState }) {
  return (
    <section className="rounded border border-[#273244] bg-[#0f1115] p-5 text-[#f5f2ed] shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#10b981]">Autonomous Runtime Recovery</p>
          <h2 className="mt-1 text-2xl font-black">Self-healing action plan</h2>
        </div>
        <span className="rounded-full bg-[#10b981]/10 px-3 py-1 text-xs font-black text-[#10b981]">{recovery.resilienceScore}% resilience</span>
      </div>
      <div className="mt-5 grid gap-3">
        {recovery.recoveryPlans.slice(0, 6).map(plan => (
          <div key={plan.id} className="rounded border border-white/10 bg-[#161a22] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <strong className="text-sm font-black">{plan.title}</strong>
              <span className={plan.approvalRequired ? "text-xs font-black uppercase text-[#f59e0b]" : "text-xs font-black uppercase text-[#10b981]"}>
                {plan.approvalRequired ? "approval required" : "safe path"}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#94a3b8]">{plan.impactEstimate}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.sequencing.slice(0, 4).map(step => (
                <span key={step} className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-[#94a3b8]">{step}</span>
              ))}
            </div>
          </div>
        ))}
        {!recovery.recoveryPlans.length ? <div className="rounded border border-white/10 bg-[#161a22] p-4 text-sm font-semibold text-[#94a3b8]">No recovery actions are required in the current runtime window.</div> : null}
      </div>
    </section>
  );
}
