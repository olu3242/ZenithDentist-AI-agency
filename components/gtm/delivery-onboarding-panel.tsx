import type { getBusinessGrowthState } from "@/lib/gtm/business-growth";

type BusinessGrowthState = Awaited<ReturnType<typeof getBusinessGrowthState>>;

export function DeliveryOnboardingPanel({ state }: { state: BusinessGrowthState }) {
  const checklist = ["Intake form", "PMS assessment", "Operational baseline", "No-show benchmark", "Review benchmark", "Recall benchmark", "Implementation roadmap", "Launch QA"];
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Client Onboarding</p>
      <h2 className="mt-1 text-2xl font-black text-ink">{state.metrics.onboardingCompletion}% onboarding maturity</h2>
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
    </section>
  );
}
