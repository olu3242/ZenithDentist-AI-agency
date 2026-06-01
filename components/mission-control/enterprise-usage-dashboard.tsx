import type { ProductizationState } from "@/lib/platform/productization";

export function EnterpriseUsageDashboard({ state }: { state: ProductizationState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Operational Usage Infrastructure</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Metering and tenant quotas</h2>
      <div className="mt-5 grid gap-3">
        {state.usageMeters.map(meter => {
          const pct = Math.min(100, Math.round((meter.quantity / meter.quota) * 100));
          return (
            <div key={meter.key} className="rounded border border-card bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm font-black text-[#F8FAFC]">{meter.label}</strong>
                <span className="text-xs font-black uppercase text-accent">{meter.tier}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-muted">{Math.round(meter.quantity).toLocaleString()} / {meter.quota.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
