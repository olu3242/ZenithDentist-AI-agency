import type { getBusinessGrowthState } from "@/lib/gtm/business-growth";

type BusinessGrowthState = Awaited<ReturnType<typeof getBusinessGrowthState>>;

export function DeliveryOnboardingPanel({ state }: { state: BusinessGrowthState }) {
  const checklist = state.onboarding.nextLaunches[0]?.checklist.length
    ? state.onboarding.nextLaunches[0].checklist
    : ["Intake form", "PMS assessment", "Operational baseline", "No-show benchmark", "Review benchmark", "Recall benchmark", "Implementation roadmap", "Launch QA"];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Client Onboarding</p>
      <h2 className="mt-1 text-2xl font-black text-ink">{state.metrics.onboardingCompletion}% onboarding maturity</h2>
      <p className="mt-2 text-sm font-semibold text-muted">
        {state.onboarding.activeClients} active client setups · {state.onboarding.blockedClients} blocked
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {checklist.map((item, index) => (
          <div key={item} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{item}</strong>
              <span className={index * 12 < state.metrics.onboardingCompletion ? "text-xs font-black uppercase text-green" : "text-xs font-black uppercase text-gold"}>
                {index * 12 < state.metrics.onboardingCompletion ? "ready" : "next"}
              </span>
            </div>
          </div>
        ))}
      </div>
      {state.onboarding.nextLaunches.length ? (
        <div className="mt-5 grid gap-3">
          {state.onboarding.nextLaunches.map(client => (
            <div key={client.id} className="rounded border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm font-black text-ink">{client.clientName}</strong>
                <span className="text-xs font-black uppercase text-teal">{client.progress}%</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-muted">{client.status}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
