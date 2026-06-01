import type { ProductizationState } from "@/lib/platform/productization";

export function PlatformizationPanel({ state }: { state: ProductizationState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Intelligence Platform Core</p>
          <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">{state.platformReadiness}% enterprise readiness</h2>
        </div>
        <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-black text-warning">{state.organizationName}</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {state.onboardingSteps.map(step => (
          <div key={step.key} className="rounded border border-card bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#F8FAFC]">{step.title}</strong>
              <span className={step.status === "completed" ? "text-xs font-black uppercase text-success" : step.status === "blocked" ? "text-xs font-black uppercase text-danger" : "text-xs font-black uppercase text-warning"}>{step.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
