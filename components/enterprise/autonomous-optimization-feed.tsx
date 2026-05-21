import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function AutonomousOptimizationFeed({ state }: { state: EnterpriseCloudState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Autonomous healthcare coordination</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Optimization feed with human review controls</h2>
      <div className="mt-5 grid gap-3">
        {state.playbooks.map(playbook => (
          <div key={playbook.id} className="rounded border border-line bg-paper p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="text-sm font-black text-ink">{playbook.name}</strong>
                <p className="text-sm font-semibold text-muted">{playbook.category.replace(/_/g, " ")} · {playbook.status}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-teal">approval gated</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
