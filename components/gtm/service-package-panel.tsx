import type { ServicePackage } from "@/lib/gtm/business-growth";

export function ServicePackagePanel({ packages }: { packages: ServicePackage[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Productized service packages</p>
      <h2 className="mt-1 text-2xl font-black text-ink">Recurring revenue offers</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {packages.map(pkg => (
          <div key={pkg.key} className="rounded border border-line bg-paper p-4">
            <strong className="text-lg font-black text-ink">{pkg.name}</strong>
            <p className="mt-2 text-2xl font-black text-teal">${pkg.monthlyPrice.toLocaleString()}<span className="text-sm text-muted">/mo</span></p>
            <p className="mt-1 text-sm font-semibold text-muted">${pkg.implementationPrice.toLocaleString()} implementation</p>
            <div className="mt-4 grid gap-2">
              {pkg.deliverables.map(item => <span key={item} className="rounded bg-white px-3 py-2 text-xs font-bold text-muted">{item}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
