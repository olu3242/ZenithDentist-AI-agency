import type { TenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";

export function TenantIntelligenceGrid({ tenant }: { tenant: TenantIntelligenceState }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Tenant Operational Intelligence</p>
      <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">{tenant.organizationName}</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {tenant.benchmarkPercentiles.map(item => (
          <div key={item.label} className="rounded border border-card bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#F8FAFC]">{item.label}</strong>
              <span className="text-xl font-black text-accent">P{item.percentile}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        {tenant.recommendations.map(item => (
          <div key={item} className="rounded border border-card bg-white p-3 text-sm font-semibold text-muted">{item}</div>
        ))}
      </div>
    </section>
  );
}
