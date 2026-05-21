import type { ProductizationState } from "@/lib/platform/productization";

export function OperationalMarketplace({ state }: { state: ProductizationState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Intelligence Marketplace</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Extension framework</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {state.extensions.map(extension => (
          <div key={extension.key} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-ink">{extension.name}</strong>
              <span className="text-xs font-black uppercase text-teal">{extension.status}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{extension.type.replace(/_/g, " ")} · {extension.readinessScore}% readiness</p>
            <p className="mt-2 text-xs font-bold text-muted">{extension.permissionScope.join(", ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
