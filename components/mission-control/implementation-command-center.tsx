import { CheckCircle2, CircleAlert, Gauge, Wallet } from "lucide-react";
import type { ImplementationIntelligenceState } from "@/lib/implementation-intelligence";

export function ImplementationCommandCenter({ state }: { state: ImplementationIntelligenceState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-5 w-5 text-teal" />
        <h2 className="text-xl font-black text-ink">Implementation Command Center</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CheckCircle2} label="Readiness" value={`${state.commandCenter.readinessScore}%`} detail={`${state.commandCenter.completed} stages complete`} />
        <Metric icon={Gauge} label="Implementation" value={`${state.commandCenter.implementationScore}%`} detail={`${state.commandCenter.inProgress} active stages`} />
        <Metric icon={CircleAlert} label="Blocked" value={state.commandCenter.blocked} detail="Implementation stages blocked" />
        <Metric icon={Wallet} label="Revenue Potential" value={`$${state.commandCenter.potentialRevenue.toLocaleString()}`} detail={`$${state.commandCenter.recoveredRevenue.toLocaleString()} recovered`} />
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {state.chevron.map(step => (
          <article key={step.key} className="rounded border border-line bg-paper p-3">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{step.status.replace(/_/g, " ")}</p>
            <h3 className="mt-1 font-black text-ink">{step.label}</h3>
            <p className="mt-1 text-sm font-bold text-muted">{step.completion}% complete</p>
            <p className="mt-2 text-xs font-semibold text-muted">{step.recommendation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Gauge; label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded border border-line bg-paper p-4">
      <Icon className="h-5 w-5 text-teal" />
      <p className="mt-3 text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-1 block text-2xl font-black text-ink">{value}</strong>
      <p className="mt-1 text-xs font-bold text-muted">{detail}</p>
    </article>
  );
}
