import type { getBusinessGrowthState } from "@/lib/gtm/business-growth";

type BusinessGrowthState = Awaited<ReturnType<typeof getBusinessGrowthState>>;

export function ClientSuccessPanel({ state }: { state: BusinessGrowthState }) {
  return (
    <section className="rounded border border-line bg-ink p-5 text-white shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-white/55">Operational Client Success System</p>
      <h2 className="mt-1 text-2xl font-black">{state.retention.healthScore}% client health</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/55">Churn risk</p>
          <strong className="mt-2 block text-2xl font-black">{state.retention.churnRisk}</strong>
        </div>
        <div className="rounded border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/55">Expansion</p>
          <strong className="mt-2 block text-2xl font-black">{state.retention.expansionReadiness}</strong>
        </div>
        <div className="rounded border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/55">Referral focus</p>
          <strong className="mt-2 block text-2xl font-black">{state.metrics.referralOpportunities}</strong>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/55">At-risk accounts</p>
          <strong className="mt-2 block text-2xl font-black">{state.retention.atRiskAccounts}</strong>
        </div>
        <div className="rounded border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/55">Expansion ready</p>
          <strong className="mt-2 block text-2xl font-black">{state.retention.expansionReadyAccounts}</strong>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {state.retention.nextSuccessActions.map(action => (
          <div key={action} className="rounded border border-white/10 bg-white/8 p-3 text-sm font-semibold text-white/70">{action}</div>
        ))}
      </div>
    </section>
  );
}
