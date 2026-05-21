import type { getBusinessGrowthState } from "@/lib/gtm/business-growth";

type BusinessGrowthState = Awaited<ReturnType<typeof getBusinessGrowthState>>;

export function ProofEnginePanel({ state }: { state: BusinessGrowthState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Proof Engine</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Case study readiness</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Proof label="Recovered revenue" value={`$${state.proof.aggregateRecoveredRevenue.toLocaleString()}`} />
        <Proof label="No-show reduction" value={`${state.proof.noShowReductionAverage}%`} />
        <Proof label="Retention lift" value={`${state.proof.patientRetentionLift}%`} />
        <Proof label="Review lift" value={`${state.proof.reviewGenerationLift}%`} />
      </div>
      <div className="mt-5 grid gap-2">
        {state.proof.testimonialPrompts.map(prompt => (
          <div key={prompt} className="rounded border border-line bg-paper p-3 text-sm font-semibold text-muted">{prompt}</div>
        ))}
      </div>
    </section>
  );
}

function Proof({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-paper p-4">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-teal">{value}</strong>
    </div>
  );
}
