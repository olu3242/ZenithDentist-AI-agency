import type { ProviderHealth } from "@/lib/runtime/provider-health";

export function ProviderHealthPanel({ providers }: { providers: ProviderHealth[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Provider health</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Dependency confidence</h2>
      <div className="mt-5 grid gap-3">
        {providers.map(provider => (
          <div key={provider.providerKey} className="rounded border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black uppercase text-ink">{provider.providerKey.replace(/_/g, " ")}</strong>
              <span className={provider.status === "healthy" ? "text-sm font-black text-green" : provider.status === "unknown" ? "text-sm font-black text-muted" : "text-sm font-black text-rust"}>{provider.status}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-teal" style={{ width: `${provider.uptimeScore}%` }} />
            </div>
            <p className="mt-2 text-xs font-bold text-muted">
              {provider.latencyMs ?? 0}ms · {(provider.failureRate * 100).toFixed(0)}% failure · {provider.dependencyImpact}/100 impact
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
