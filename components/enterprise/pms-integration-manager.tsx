import type { EnterpriseCloudState } from "@/lib/enterprise-cloud";

export function PMSIntegrationManager({ state }: { state: EnterpriseCloudState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-muted">Enterprise PMS integration layer</p>
          <h2 className="text-2xl font-black text-ink">Provider sync and normalization coverage</h2>
        </div>
        <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-black text-blue">{state.providerCoverage.filter(provider => provider.configured).length} configured</span>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_.7fr]">
        <div className="grid gap-3">
          {state.integrations.map(integration => (
            <div key={integration.id} className="rounded border border-line bg-paper p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-base font-black text-ink">{integration.display_name}</strong>
                  <p className="text-sm font-semibold text-muted">{integration.provider.replace(/_/g, " ")} · health {integration.health_score}%</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-teal">{integration.status}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-line">
                <div className="h-2 rounded-full bg-teal" style={{ width: `${integration.health_score}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded border border-line p-4">
          <h3 className="font-black text-ink">Provider abstraction coverage</h3>
          <div className="mt-3 grid gap-2">
            {state.providerCoverage.map(provider => (
              <div key={provider.provider} className="flex items-center justify-between rounded bg-paper px-3 py-2">
                <span className="text-sm font-bold text-ink">{provider.displayName}</span>
                <span className={provider.configured ? "text-xs font-black uppercase text-green" : "text-xs font-black uppercase text-muted"}>
                  {provider.configured ? "active" : "ready"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
