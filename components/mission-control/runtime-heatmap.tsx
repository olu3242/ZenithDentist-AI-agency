import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function RuntimeHeatmap({ state }: { state: RuntimeHealthState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Runtime heatmap</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Domain pressure</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {state.domainHealth.map(domain => {
          const pressure = Math.max(0, 100 - domain.healthScore);
          return (
            <div key={domain.domain} className="rounded border border-card p-3" style={{ backgroundColor: `rgba(207, 93, 65, ${Math.min(0.22, pressure / 380)})` }}>
              <p className="text-xs font-black uppercase text-muted">{domain.domain.replace(/_/g, " ")}</p>
              <strong className="mt-2 block text-2xl font-black text-[#F8FAFC]">{pressure}</strong>
              <p className="text-xs font-bold text-muted">pressure</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
