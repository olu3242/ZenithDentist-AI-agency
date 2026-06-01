import type { Location } from "@/lib/data/tenants";
import type { OperationalMetric } from "@/lib/data/operations";
import { formatCurrency } from "@/lib/utils";

export function LocationDashboard({ locations, metrics }: { locations: Location[]; metrics: OperationalMetric[] }) {
  return (
    <section className="rounded border border-card bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Location Performance</h2>
      <div className="mt-5 grid gap-3">
        {locations.map((location, index) => {
          const metric = metrics[index] ?? metrics[0];
          return (
            <div key={location.id} className="grid gap-3 rounded bg-background p-4 md:grid-cols-5">
              <strong>{location.name}</strong>
              <span>{location.chair_count} chairs</span>
              <span>{metric?.no_show_rate ?? 8}% no-show</span>
              <span>{metric?.recall_recovery_count ?? 0} recalls</span>
              <span className="font-bold text-success">{formatCurrency(Number(metric?.recovered_revenue ?? 0))}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
